const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    first_name: string;
    username?: string;
    type: string;
  };
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// 메시지 전송
export async function sendMessage(chatId: string | number, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });

  return response.json();
}

// 이미지 전송
export async function sendPhoto(chatId: string | number, photoUrl: string, caption?: string) {
  const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
    }),
  });

  return response.json();
}

// 여러 이미지 전송 (미디어 그룹)
export async function sendMediaGroup(chatId: string | number, photos: { url: string; caption?: string }[]) {
  const media = photos.map((photo, index) => ({
    type: 'photo',
    media: photo.url,
    caption: index === 0 ? photo.caption : undefined,
    parse_mode: 'HTML',
  }));

  const response = await fetch(`${TELEGRAM_API_URL}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      media,
    }),
  });

  return response.json();
}

// Webhook 설정
export async function setWebhook(url: string) {
  const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  return response.json();
}

// 날씨 정보 포맷팅
export function formatWeatherMessage(weatherData: {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  weather: string;
  icon: string;
}) {
  const { city, temp, feels_like, humidity, weather, icon } = weatherData;

  return `
${icon} <b>${city} 오늘의 날씨</b>

🌡️ 기온: <b>${temp}°C</b> (체감 ${feels_like}°C)
💧 습도: ${humidity}%
🌤️ 날씨: ${weather}
  `.trim();
}

// 옷차림 추천 메시지 포맷팅
export function formatOutfitMessage(clothes: {
  top?: { name: string; image_url: string };
  bottom?: { name: string; image_url: string };
  outer?: { name: string; image_url: string };
}) {
  let message = '\n\n👔 <b>오늘의 추천 옷차림</b>\n\n';

  if (clothes.outer) {
    message += `🧥 외투: ${clothes.outer.name || '외투'}\n`;
  }
  if (clothes.top) {
    message += `👕 상의: ${clothes.top.name || '상의'}\n`;
  }
  if (clothes.bottom) {
    message += `👖 하의: ${clothes.bottom.name || '하의'}\n`;
  }

  message += '\n좋은 하루 보내세요! 😊';

  return message;
}