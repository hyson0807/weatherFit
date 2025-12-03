-- WeatherFit 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 날씨 조건 참조 테이블
CREATE TABLE weather_conditions (
  id SERIAL PRIMARY KEY,
  condition_code VARCHAR(50) NOT NULL UNIQUE,
  condition_name VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 날씨 조건 데이터
INSERT INTO weather_conditions (condition_code, condition_name, icon) VALUES
  ('clear', '맑음', '☀️'),
  ('clouds', '흐림', '☁️'),
  ('rain', '비', '🌧️'),
  ('drizzle', '이슬비', '🌦️'),
  ('thunderstorm', '뇌우', '⛈️'),
  ('snow', '눈', '❄️'),
  ('mist', '안개', '🌫️'),
  ('wind', '강풍', '💨');

-- 2. 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  telegram_chat_id VARCHAR(50),
  verification_code VARCHAR(10),
  location_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  notification_time TIME DEFAULT '07:00:00',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 옷 테이블
CREATE TABLE clothes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('top', 'bottom', 'outer')),
  name VARCHAR(100),
  image_url TEXT NOT NULL,
  min_temp INTEGER DEFAULT -20,
  max_temp INTEGER DEFAULT 40,
  weather_conditions TEXT[] DEFAULT ARRAY['clear', 'clouds'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 알림 로그 테이블
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weather_data JSONB NOT NULL,
  recommended_clothes JSONB NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- 5. 관리자 테이블
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX idx_users_notification_time ON users(notification_time);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_clothes_user_id ON clothes(user_id);
CREATE INDEX idx_clothes_category ON clothes(category);
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Storage 버킷 생성 (Supabase Dashboard에서 수동으로 생성 필요)
-- 버킷명: clothes-images
-- Public: true

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();