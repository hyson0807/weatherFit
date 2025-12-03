import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface User {
  id: string;
  name: string;
  password?: string; // 해시된 비밀번호 (응답에서는 제외)
  telegram_chat_id: string | null;
  verification_code: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  notification_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Clothes {
  id: string;
  category: 'top' | 'bottom' | 'outer';
  name: string;
  image_url: string;
  temperature_min: number;
  temperature_max: number;
  weather_condition: string | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  weather_data: Record<string, unknown>;
  recommended_clothes: Record<string, unknown>;
  sent_at: string;
  status: string;
}

// 한국 주요 도시 좌표
export const KOREAN_CITIES: Record<string, { lat: number; lon: number }> = {
  "서울": { lat: 37.5665, lon: 126.978 },
  "부산": { lat: 35.1796, lon: 129.0756 },
  "인천": { lat: 37.4563, lon: 126.7052 },
  "대구": { lat: 35.8714, lon: 128.6014 },
  "대전": { lat: 36.3504, lon: 127.3845 },
  "광주": { lat: 35.1595, lon: 126.8526 },
  "울산": { lat: 35.5384, lon: 129.3114 },
  "수원": { lat: 37.2636, lon: 127.0286 },
  "제주": { lat: 33.4996, lon: 126.5312 },
};

// 인증코드 생성 함수
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 간단한 비밀번호 해시 함수 (실제 프로덕션에서는 bcrypt 사용 권장)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'weatherfit_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 비밀번호 검증 함수
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}