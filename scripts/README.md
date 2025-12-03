# WeatherFit 홈서버 배포 가이드

## 필수 조건

- Node.js 18+
- npm
- pm2 (`npm install -g pm2`)
- curl

## 1. 앱 실행 (pm2)

```bash
cd /path/to/gui

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# pm2로 실행
pm2 start npm --name "weatherfit" -- start

# 재부팅 시 자동 시작 설정
pm2 startup
pm2 save
```

## 2. 환경변수 설정

`.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENWEATHER_API_KEY=your_openweather_api_key
CRON_SECRET=your_random_secret  # 선택사항
```

## 3. 알림 스케줄링 (crontab)

```bash
# 스크립트 실행 권한 부여
chmod +x /path/to/gui/scripts/send_notifications.sh

# crontab 편집
crontab -e
```

### crontab 예시

```cron
# 매일 06:00 ~ 09:00, 30분 간격으로 실행
0 6 * * * /path/to/gui/scripts/send_notifications.sh
30 6 * * * /path/to/gui/scripts/send_notifications.sh
0 7 * * * /path/to/gui/scripts/send_notifications.sh
30 7 * * * /path/to/gui/scripts/send_notifications.sh
0 8 * * * /path/to/gui/scripts/send_notifications.sh
30 8 * * * /path/to/gui/scripts/send_notifications.sh
0 9 * * * /path/to/gui/scripts/send_notifications.sh
```

또는 간단하게:

```cron
# 06:00 ~ 09:00 매 30분마다
0,30 6-9 * * * /path/to/gui/scripts/send_notifications.sh
```

## 4. 로그 확인

```bash
# 오늘 로그 확인
cat /path/to/gui/logs/notification_$(date +%Y%m%d).log

# 실시간 로그 모니터링
tail -f /path/to/gui/logs/notification_*.log

# pm2 로그
pm2 logs weatherfit
```

## 5. 텔레그램 Webhook 설정

서버 도메인이 `https://example.com`인 경우:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://example.com/api/telegram/webhook"
```

## 6. 유용한 명령어

```bash
# pm2 상태 확인
pm2 status

# 앱 재시작
pm2 restart weatherfit

# 앱 중지
pm2 stop weatherfit

# 로그 삭제
pm2 flush

# cron 작업 확인
crontab -l

# 수동 알림 테스트
curl "http://localhost:3000/api/notify?time=07:00"
```