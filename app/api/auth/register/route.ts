import { NextRequest, NextResponse } from 'next/server';
import { supabase, hashPassword, generateVerificationCode } from '@/lib/supabase';

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

    if (name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 2~20자로 입력해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 4자 이상으로 입력해주세요.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(password);

    // 인증코드 생성
    const verificationCode = generateVerificationCode();

    // 사용자 등록
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        password: hashedPassword,
        verification_code: verificationCode,
        is_active: false,
      })
      .select('id, name, verification_code, is_active, created_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '회원가입에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
