import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendMessage, TelegramUpdate } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const firstName = update.message.from.first_name;

    // /start 명령어
    if (text === '/start') {
      await sendMessage(
        chatId,
        `안녕하세요, ${firstName}님! 👋\n\n` +
        `<b>WeatherFit</b>에 오신 것을 환영합니다!\n\n` +
        `웹사이트에서 발급받은 <b>인증코드 6자리</b>를 입력해주세요.\n\n` +
        `예: <code>ABC123</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // /help 명령어
    if (text === '/help') {
      await sendMessage(
        chatId,
        `<b>WeatherFit 도움말</b>\n\n` +
        `🔹 <b>/start</b> - 봇 시작\n` +
        `🔹 <b>/status</b> - 내 정보 확인\n` +
        `🔹 <b>/off</b> - 알림 끄기\n` +
        `🔹 <b>/on</b> - 알림 켜기\n\n` +
        `설정 변경은 웹사이트에서 가능합니다.`
      );
      return NextResponse.json({ ok: true });
    }

    // /status 명령어 - 내 정보 확인
    if (text === '/status') {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_chat_id', chatId.toString())
        .single();

      if (!user) {
        await sendMessage(chatId, '❌ 연동된 계정이 없습니다.\n인증코드를 입력해주세요.');
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        `<b>📋 내 정보</b>\n\n` +
        `👤 이름: ${user.name}\n` +
        `📍 위치: ${user.location_name || '미설정'}\n` +
        `⏰ 알림 시간: ${user.notification_time?.slice(0, 5) || '07:00'}\n` +
        `🔔 알림 상태: ${user.is_active ? 'ON ✅' : 'OFF ❌'}`
      );
      return NextResponse.json({ ok: true });
    }

    // /off 명령어 - 알림 끄기
    if (text === '/off') {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('telegram_chat_id', chatId.toString());

      if (error) {
        await sendMessage(chatId, '❌ 연동된 계정이 없습니다.');
      } else {
        await sendMessage(chatId, '🔕 알림이 꺼졌습니다.\n다시 켜려면 /on 을 입력하세요.');
      }
      return NextResponse.json({ ok: true });
    }

    // /on 명령어 - 알림 켜기
    if (text === '/on') {
      // 먼저 사용자 정보 확인
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_chat_id', chatId.toString())
        .single();

      if (!user) {
        await sendMessage(chatId, '❌ 연동된 계정이 없습니다.');
        return NextResponse.json({ ok: true });
      }

      // 위치 설정 확인
      if (!user.location_name) {
        await sendMessage(chatId, '⚠️ 위치를 먼저 설정해주세요.\n웹사이트에서 설정할 수 있습니다.');
        return NextResponse.json({ ok: true });
      }

      await supabase
        .from('users')
        .update({ is_active: true })
        .eq('telegram_chat_id', chatId.toString());

      await sendMessage(chatId, '🔔 알림이 켜졌습니다.\n매일 아침 옷차림 추천을 받아보세요!');
      return NextResponse.json({ ok: true });
    }

    // 인증코드 확인 (6자리 영숫자)
    if (/^[A-Z0-9]{6}$/.test(text.toUpperCase())) {
      const code = text.toUpperCase();

      // 인증코드로 사용자 찾기
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('verification_code', code)
        .single();

      if (error || !user) {
        await sendMessage(
          chatId,
          '❌ 유효하지 않은 인증코드입니다.\n\n' +
          '웹사이트에서 발급받은 코드를 확인해주세요.'
        );
        return NextResponse.json({ ok: true });
      }

      // 이미 다른 계정에 연동된 경우
      if (user.telegram_chat_id && user.telegram_chat_id !== chatId.toString()) {
        await sendMessage(
          chatId,
          '⚠️ 이 계정은 이미 다른 텔레그램에 연동되어 있습니다.'
        );
        return NextResponse.json({ ok: true });
      }

      // 텔레그램 chat_id 저장
      await supabase
        .from('users')
        .update({
          telegram_chat_id: chatId.toString(),
        })
        .eq('id', user.id);

      await sendMessage(
        chatId,
        `✅ <b>인증 완료!</b>\n\n` +
        `${user.name}님, 환영합니다! 🎉\n\n` +
        `웹사이트에서 위치와 알림 시간을 설정하고\n` +
        `알림을 활성화하면 매일 아침 옷차림 추천을 받을 수 있어요.\n\n` +
        `/status - 내 정보 확인\n` +
        `/help - 명령어 보기`
      );

      return NextResponse.json({ ok: true });
    }

    // 그 외 메시지
    await sendMessage(
      chatId,
      '🤔 명령어를 인식하지 못했어요.\n\n/help 를 입력해 도움말을 확인하세요.'
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

// Webhook 확인용 GET
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is active' });
}
