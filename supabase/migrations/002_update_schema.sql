-- =============================================
-- WeatherFit DB Schema Update v2
-- 변경사항: 로그인 시스템 + 공용 옷 시스템
-- =============================================

-- 1. users 테이블 수정
-- 기존 테이블 삭제 후 재생성 (데이터 초기화)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS clothes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 새 users 테이블
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,  -- 닉네임 (로그인 ID로 사용)
    password VARCHAR(255) NOT NULL,     -- 비밀번호 (해시)
    location_name VARCHAR(100),         -- 위치 이름
    latitude DECIMAL(10, 8),            -- 위도
    longitude DECIMAL(11, 8),           -- 경도
    notification_time TIME DEFAULT '07:00:00',  -- 알림 시간
    telegram_chat_id VARCHAR(50),       -- 텔레그램 Chat ID
    verification_code VARCHAR(10),      -- 텔레그램 인증 코드
    is_active BOOLEAN DEFAULT false,    -- 알림 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 공용 clothes 테이블 (모든 사용자 공유)
CREATE TABLE clothes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(20) NOT NULL CHECK (category IN ('top', 'bottom', 'outer')),
    name VARCHAR(100) NOT NULL,         -- 옷 이름 (예: "반팔 티셔츠")
    image_url TEXT NOT NULL,            -- 이미지 URL
    temperature_min INTEGER NOT NULL,   -- 최소 온도
    temperature_max INTEGER NOT NULL,   -- 최대 온도
    weather_condition VARCHAR(50),      -- 날씨 조건 (rain, snow, clear 등, NULL이면 모든 날씨)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 알림 로그 테이블
CREATE TABLE notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    weather_data JSONB,
    recommended_clothes JSONB,          -- 추천된 옷 정보
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'success'
);

-- 인덱스 생성
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_telegram ON users(telegram_chat_id);
CREATE INDEX idx_users_notification_time ON users(notification_time);
CREATE INDEX idx_clothes_category ON clothes(category);
CREATE INDEX idx_clothes_temperature ON clothes(temperature_min, temperature_max);

-- RLS 비활성화 (학교 프로젝트용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clothes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 기본 옷 데이터 삽입 (온도 범위별)
-- =============================================

-- 상의 (Top)
INSERT INTO clothes (category, name, image_url, temperature_min, temperature_max, weather_condition) VALUES
-- 더운 날씨 (25도 이상)
('top', '반팔 티셔츠', 'clothes/top/tshirt.jpg', 25, 40, NULL),
('top', '민소매', 'clothes/top/sleeveless.jpg', 28, 40, NULL),

-- 따뜻한 날씨 (20-25도)
('top', '얇은 긴팔', 'clothes/top/longsleeve_light.jpg', 20, 25, NULL),
('top', '얇은 셔츠', 'clothes/top/shirt_light.jpg', 20, 25, NULL),

-- 선선한 날씨 (15-20도)
('top', '긴팔 티셔츠', 'clothes/top/longsleeve.jpg', 15, 20, NULL),
('top', '얇은 니트', 'clothes/top/knit_light.jpg', 15, 20, NULL),

-- 쌀쌀한 날씨 (10-15도)
('top', '맨투맨', 'clothes/top/sweatshirt.jpg', 10, 15, NULL),
('top', '후드티', 'clothes/top/hoodie.jpg', 10, 15, NULL),

-- 추운 날씨 (5-10도)
('top', '니트', 'clothes/top/knit.jpg', 5, 10, NULL),
('top', '기모 맨투맨', 'clothes/top/sweatshirt_fleece.jpg', 5, 10, NULL),

-- 매우 추운 날씨 (5도 이하)
('top', '두꺼운 니트', 'clothes/top/knit_thick.jpg', -20, 5, NULL),
('top', '기모 후드티', 'clothes/top/hoodie_fleece.jpg', -20, 5, NULL);

-- 하의 (Bottom)
INSERT INTO clothes (category, name, image_url, temperature_min, temperature_max, weather_condition) VALUES
-- 더운 날씨 (25도 이상)
('bottom', '반바지', 'clothes/bottom/shorts.jpg', 25, 40, NULL),
('bottom', '린넨 팬츠', 'clothes/bottom/linen_pants.jpg', 25, 40, NULL),

-- 따뜻한 날씨 (20-25도)
('bottom', '면바지', 'clothes/bottom/cotton_pants.jpg', 20, 25, NULL),
('bottom', '슬랙스', 'clothes/bottom/slacks.jpg', 15, 25, NULL),

-- 선선한 날씨 (10-20도)
('bottom', '청바지', 'clothes/bottom/jeans.jpg', 10, 20, NULL),
('bottom', '면바지', 'clothes/bottom/cotton_pants.jpg', 10, 20, NULL),

-- 추운 날씨 (10도 이하)
('bottom', '기모 바지', 'clothes/bottom/fleece_pants.jpg', -20, 10, NULL),
('bottom', '코듀로이 팬츠', 'clothes/bottom/corduroy.jpg', -20, 10, NULL);

-- 외투 (Outer) - 20도 이하에서만 추천
INSERT INTO clothes (category, name, image_url, temperature_min, temperature_max, weather_condition) VALUES
-- 선선한 날씨 (15-20도)
('outer', '얇은 가디건', 'clothes/outer/cardigan_light.jpg', 15, 20, NULL),
('outer', '바람막이', 'clothes/outer/windbreaker.jpg', 15, 20, NULL),

-- 쌀쌀한 날씨 (10-15도)
('outer', '자켓', 'clothes/outer/jacket.jpg', 10, 15, NULL),
('outer', '후드집업', 'clothes/outer/hoodie_zip.jpg', 10, 15, NULL),

-- 추운 날씨 (5-10도)
('outer', '코트', 'clothes/outer/coat.jpg', 5, 10, NULL),
('outer', '가죽자켓', 'clothes/outer/leather_jacket.jpg', 5, 10, NULL),

-- 매우 추운 날씨 (5도 이하)
('outer', '패딩', 'clothes/outer/padding.jpg', -20, 5, NULL),
('outer', '롱패딩', 'clothes/outer/long_padding.jpg', -20, 5, NULL),

-- 비 오는 날
('outer', '우비/레인코트', 'clothes/outer/raincoat.jpg', 5, 25, 'rain');