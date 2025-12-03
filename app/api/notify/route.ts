import { NextRequest, NextResponse } from 'next/server';
import { supabase, Clothes } from '@/lib/supabase';
import { sendMessage, sendPhoto, formatWeatherMessage } from '@/lib/telegram';

// Vercel Cron 인증 검증
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되지 않은 경우 (개발 환경) 통과
  if (!cronSecret) return true;

  // Vercel Cron에서 오는 요청 검증
  return authHeader === `Bearer ${cronSecret}`;
}

// 온도에 맞는 옷 추천 로직
function recommendClothes(
  clothes: Clothes[],
  temp: number,
  weatherCondition: string,
  userGender: string | null
) {
  // 성별 필터: 사용자 성별과 일치하거나 unisex인 옷만 선택
  const genderFilter = (c: Clothes) => {
    if (!userGender || userGender === 'unisex') return true; // 성별 미설정 시 모든 옷 표시
    return c.gender === userGender || c.gender === 'unisex' || c.gender === null;
  };

  // 카테고리별 온도에 맞는 옷 필터링
  const getByCategory = (category: string) => {
    // 먼저 날씨 조건과 온도가 모두 맞는 옷 찾기
    let items = clothes.filter(
      (c) =>
        c.category === category &&
        genderFilter(c) &&
        temp >= c.temperature_min &&
        temp <= c.temperature_max &&
        (c.weather_condition === null || c.weather_condition === weatherCondition)
    );

    // 없으면 온도만 맞는 옷
    if (items.length === 0) {
      items = clothes.filter(
        (c) =>
          c.category === category &&
          genderFilter(c) &&
          temp >= c.temperature_min &&
          temp <= c.temperature_max &&
          c.weather_condition === null
      );
    }

    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  };

  return {
    top: getByCategory('top'),
    bottom: getByCategory('bottom'),
    outer: temp <= 20 ? getByCategory('outer') : null, // 20도 이하일 때만 외투 추천
  };
}

// 날씨 아이콘 매핑
function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
  };
  return icons[condition] || '🌤️';
}

// 날씨 조건 코드 변환
function getWeatherCode(condition: string): string {
  const codes: Record<string, string> = {
    Clear: 'clear',
    Clouds: 'clouds',
    Rain: 'rain',
    Drizzle: 'rain',
    Thunderstorm: 'rain',
    Snow: 'snow',
    Mist: 'clouds',
    Fog: 'clouds',
    Haze: 'clouds',
  };
  return codes[condition] || 'clear';
}

// 옷 추천 메시지 포맷
function formatOutfitMessage(recommended: { top: Clothes | null; bottom: Clothes | null; outer: Clothes | null }): string {
  let message = '\n\n👔 오늘의 추천 옷차림:\n';

  if (recommended.outer) {
    message += `• 외투: ${recommended.outer.name}\n`;
  }
  if (recommended.top) {
    message += `• 상의: ${recommended.top.name}\n`;
  }
  if (recommended.bottom) {
    message += `• 하의: ${recommended.bottom.name}\n`;
  }

  return message;
}

// 알림 발송 핵심 로직
async function sendNotifications(targetTime: string | null, userId: string | null) {
  // 대상 사용자 조회
  let query = supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null)
    .not('location_name', 'is', null);

  if (targetTime) {
    query = query.eq('notification_time', targetTime + ':00');
  }

  if (userId) {
    query = query.eq('id', userId);
  }

  const { data: users, error: usersError } = await query;

  if (usersError || !users || users.length === 0) {
    return {
      success: true,
      message: '알림을 보낼 사용자가 없습니다.',
      count: 0,
    };
  }

  // 공용 옷 목록 가져오기
  const { data: clothes } = await supabase
    .from('clothes')
    .select('*');

  if (!clothes || clothes.length === 0) {
    return {
      success: false,
      message: '등록된 옷이 없습니다.',
    };
  }

  const results = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  for (const user of users) {
    try {
      // 1. 날씨 API 호출
      const apiKey = process.env.OPENWEATHER_API_KEY;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${user.latitude}&lon=${user.longitude}&appid=${apiKey}&units=metric&lang=kr`
      );
      const weatherData = await response.json();

      const temp = Math.round(weatherData.main.temp);
      const feelsLike = Math.round(weatherData.main.feels_like);
      const humidity = weatherData.main.humidity;
      const weatherMain = weatherData.weather[0].main;
      const weatherDesc = weatherData.weather[0].description;
      const weatherIcon = getWeatherIcon(weatherMain);
      const weatherCode = getWeatherCode(weatherMain);

      // 2. 옷차림 추천 (사용자 성별 기반)
      const recommended = recommendClothes(clothes, temp, weatherCode, user.gender);

      // 3. 메시지 생성
      let message = formatWeatherMessage({
        city: user.location_name,
        temp,
        feels_like: feelsLike,
        humidity,
        weather: weatherDesc,
        icon: weatherIcon,
      });

      if (recommended.top || recommended.bottom || recommended.outer) {
        message += formatOutfitMessage(recommended);

        // 메시지 먼저 전송
        await sendMessage(user.telegram_chat_id!, message);

        // 옷 이미지 전송 (Storage URL 생성)
        const itemsToSend = [
          recommended.outer,
          recommended.top,
          recommended.bottom,
        ].filter(Boolean);

        for (const item of itemsToSend) {
          if (item) {
            const categoryName = item.category === 'top' ? '상의' :
              item.category === 'bottom' ? '하의' : '외투';

            // Storage URL 생성
            const imageUrl = `${supabaseUrl}/storage/v1/object/public/${item.image_url}`;

            await sendPhoto(
              user.telegram_chat_id!,
              imageUrl,
              `${categoryName}: ${item.name}`
            );
          }
        }
      } else {
        await sendMessage(user.telegram_chat_id!, message);
      }

      // 4. 알림 로그 저장
      await supabase.from('notification_logs').insert({
        user_id: user.id,
        weather_data: weatherData,
        recommended_clothes: recommended,
        status: 'success',
      });

      results.push({ userId: user.id, name: user.name, status: 'sent' });
    } catch (userError) {
      console.error(`Error for user ${user.id}:`, userError);
      results.push({ userId: user.id, name: user.name, status: 'failed', error: String(userError) });
    }
  }

  return {
    success: true,
    message: `${results.filter((r) => r.status === 'sent').length}명에게 알림을 보냈습니다.`,
    results,
  };
}

// GET: Vercel Cron에서 호출
export async function GET(request: NextRequest) {
  try {
    // Cron 인증 검증
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetTime = searchParams.get('time');

    const result = await sendNotifications(targetTime, null);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Notify API error:', error);
    return NextResponse.json(
      { error: '알림 발송에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}

// POST: 수동 호출 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTime = searchParams.get('time'); // HH:MM 형식
    const userId = searchParams.get('userId'); // 특정 사용자만 (테스트용)

    const result = await sendNotifications(targetTime, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Notify API error:', error);
    return NextResponse.json(
      { error: '알림 발송에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}