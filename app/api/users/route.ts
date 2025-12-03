import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 전체 사용자 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      // 특정 사용자 조회
      const { data, error } = await supabase
        .from('users')
        .select('id, name, location_name, latitude, longitude, notification_time, telegram_chat_id, verification_code, is_active, created_at')
        .eq('name', name)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    // 전체 사용자 조회
    const { data, error } = await supabase
      .from('users')
      .select('id, name, location_name, notification_time, telegram_chat_id, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: '사용자 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}