# WeatherFit - 날씨 기반 옷차림 추천 서비스

## 1. 프로젝트 개요

### 1.1 서비스 설명
매일 아침 사용자의 위치 기반 날씨 정보를 분석하여, 사용자가 등록한 옷 중에서 날씨에 맞는 옷차림을 텔레그램으로 추천해주는 서비스

### 1.2 핵심 기능
- **사용자 등록**: 이름, 전화번호, 위치정보 입력
- **옷 등록**: 사용자가 자신의 옷 사진을 카테고리별(상의/하의/외투)로 업로드
- **날씨 분석**: 기존 쉘 스크립트를 활용한 날씨 데이터 수집
- **옷차림 추천**: 온도 + 날씨 조건 기반 옷차림 자동 추천
- **텔레그램 알림**: 사용자가 선택한 시간에 날씨 정보 + 옷차림 발송

---

## 2. 기술 스택

### 2.1 Frontend
- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Design Style**: Organic / Biomorphic (자연스러운 곡선, 유기적 형태)

### 2.2 Backend
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (옷 이미지 저장)
- **Authentication**: Supabase Auth (관리자 인증)

### 2.3 External Services
- **날씨 API**: OpenWeather API (기존 스크립트 활용)
- **알림**: Telegram Bot API

### 2.4 Scheduler
- **Cron Job**: 기존 `/SystemProject/weather/scripts/fetch_weather.sh` 활용
- **알림 발송**: Node.js 스크립트 또는 Supabase Edge Function

---

## 3. 데이터베이스 설계

### 3.1 users (사용자)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| name | VARCHAR(100) | 이름 |
| phone | VARCHAR(20) | 전화번호 |
| telegram_chat_id | VARCHAR(50) | 텔레그램 채팅 ID |
| location_name | VARCHAR(100) | 위치명 (예: 서울) |
| latitude | DECIMAL(10,7) | 위도 |
| longitude | DECIMAL(10,7) | 경도 |
| notification_time | TIME | 알림 받을 시간 |
| is_active | BOOLEAN | 활성화 여부 |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 수정일 |

### 3.2 clothes (옷)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| category | VARCHAR(20) | 카테고리 (top/bottom/outer) |
| name | VARCHAR(100) | 옷 이름 (선택) |
| image_url | TEXT | 이미지 URL |
| min_temp | INTEGER | 최소 적정 온도 |
| max_temp | INTEGER | 최대 적정 온도 |
| weather_conditions | TEXT[] | 적합한 날씨 조건 배열 |
| created_at | TIMESTAMP | 생성일 |

### 3.3 weather_conditions (날씨 조건 참조)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | SERIAL | PK |
| condition_code | VARCHAR(50) | 조건 코드 (sunny, rainy, snowy, cloudy 등) |
| condition_name | VARCHAR(50) | 조건명 (한글) |
| icon | VARCHAR(10) | 아이콘 코드 |

### 3.4 notification_logs (알림 로그)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| weather_data | JSONB | 날씨 정보 |
| recommended_clothes | JSONB | 추천된 옷 정보 |
| sent_at | TIMESTAMP | 발송 시간 |
| status | VARCHAR(20) | 발송 상태 |

### 3.5 admin_users (관리자)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | PK |
| email | VARCHAR(255) | 이메일 |
| password_hash | TEXT | 암호화된 비밀번호 |
| role | VARCHAR(20) | 역할 (admin/super_admin) |
| created_at | TIMESTAMP | 생성일 |

---

## 4. 온도별 옷차림 기준

### 4.1 온도 구간
| 구간 | 온도 범위 | 권장 옷차림 |
|------|-----------|-------------|
| 한파 | -10°C 이하 | 패딩, 두꺼운 외투, 기모 |
| 매우 추움 | -10°C ~ 0°C | 두꺼운 외투, 목도리, 장갑 |
| 추움 | 0°C ~ 10°C | 코트, 가죽자켓, 니트 |
| 쌀쌀함 | 10°C ~ 15°C | 자켓, 가디건, 맨투맨 |
| 선선함 | 15°C ~ 20°C | 얇은 가디건, 긴팔 |
| 적당함 | 20°C ~ 25°C | 반팔, 얇은 셔츠 |
| 더움 | 25°C ~ 30°C | 반팔, 반바지, 린넨 |
| 매우 더움 | 30°C 이상 | 민소매, 얇은 옷 |

### 4.2 날씨 조건별 추가 고려
- **비 (Rain)**: 방수 외투, 우산 알림
- **눈 (Snow)**: 방한 외투, 미끄럼 주의 알림
- **강풍 (Wind)**: 바람막이 추천
- **맑음 (Clear)**: 선글라스, 모자 추천 (여름철)

---

## 5. 페이지 구조

### 5.1 사용자 페이지
```
/ (메인)
├── 히어로 섹션: 서비스 소개
├── 등록 폼: 이름, 전화번호, 성별, 위치정보
└── 텔레그램 연동 안내

/my
├── 내 정보 관리
├── 옷 등록/수정/삭제
├── 알림 시간 설정
└── 활성화/비활성화 토글
```

### 5.2 관리자 페이지
```
/admin
├── /login: 관리자 로그인
├── /dashboard: 대시보드 (통계)
├── /users: 사용자 관리
├── /weather-settings: 날씨 조건 설정
└── /logs: 알림 발송 로그
```

---

## 6. 시스템 흐름도

```
[사용자 등록 흐름]
웹사이트 접속 → 정보 입력 → DB 저장 → 텔레그램 봇 연동 → 옷 업로드 → 알림 시간 설정 → 활성화

[알림 발송 흐름]
Cron (매 시간) → 해당 시간 사용자 조회 → 날씨 데이터 수집 → 옷차림 매칭 → 텔레그램 발송 → 로그 저장
```

---

## 7. 구현 순서

### Phase 1: 기초 설정
1. Supabase 프로젝트 연동 및 테이블 생성
2. Next.js 프로젝트 구조 설정
3. Tailwind CSS Organic/Biomorphic 테마 설정

### Phase 2: 사용자 기능
4. 메인 페이지 (히어로 섹션 + 등록 폼)
5. 사용자 등록 API
6. 텔레그램 봇 생성 및 연동
7. 옷 업로드 페이지 및 Supabase Storage 연동
8. 내 정보 관리 페이지

### Phase 3: 관리자 기능
9. 관리자 로그인
10. 사용자 관리 페이지
11. 날씨 조건 설정 페이지
12. 대시보드

### Phase 4: 알림 시스템
13. 날씨 데이터 연동 (기존 스크립트 활용)
14. 옷차림 추천 로직 구현
15. 텔레그램 알림 발송 기능
16. 스케줄러 설정

### Phase 5: 마무리
17. 테스트 및 버그 수정
18. UI/UX 개선
19. 배포

---

## 8. 디자인 가이드라인 (Organic / Biomorphic)

### 8.1 특징
- 자연에서 영감을 받은 유기적 형태
- 부드러운 곡선과 불규칙한 모양
- 자연스러운 색상 팔레트 (그린, 베이지, 스카이블루 등)
- 물결, 구름, 잎사귀 등의 자연 요소 활용

### 8.2 컬러 팔레트 (예시)
- **Primary**: #4ECDC4 (민트)
- **Secondary**: #FF6B6B (코랄)
- **Background**: #F7FFF7 (연한 민트)
- **Text**: #2C3E50 (다크 네이비)
- **Accent**: #FFE66D (선샤인 옐로우)

### 8.3 UI 요소
- 둥근 모서리 (border-radius: 20px~40px)
- 부드러운 그림자 (soft shadow)
- 유기적 형태의 버튼과 카드
- 자연스러운 트랜지션 애니메이션

---

## 9. 텔레그램 봇 설정

### 9.1 봇 생성
1. Telegram에서 @BotFather 검색
2. `/newbot` 명령어로 봇 생성
3. 봇 토큰 발급 및 환경변수 저장

### 9.2 사용자 연동 방식
1. 웹에서 등록 시 고유 코드 발급
2. 사용자가 텔레그램 봇에 코드 입력
3. chat_id 저장하여 알림 발송에 사용

---

## 10. 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=

# OpenWeather (기존 스크립트에서 사용)
OPENWEATHER_API_KEY=
```

---

## 11. 추후 확장 가능 기능

- [ ] 주간 날씨 예보 및 옷차림 미리보기
- [ ] AI 기반 옷차림 스타일링 추천
- [ ] 소셜 로그인 (카카오, 네이버)
- [ ] PWA 지원 (푸시 알림)
- [ ] 옷장 통계 및 착용 빈도 분석

---

## 12. 참고 자료

- [OpenWeather API](https://openweathermap.org/api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
