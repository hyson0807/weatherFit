import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyPassword } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, password } = body;

    // 유효성 검사
    if (!name || !password) {
      return NextResponse.json(
        { error: '닉네임과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
