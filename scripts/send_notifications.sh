#!/bin/bash

# WeatherFit 알림 발송 스크립트
# 맥미니 홈서버에서 crontab으로 실행
#
# 사용법:
#   chmod +x send_notifications.sh
#   crontab -e
#   0,30 6-9 * * * /path/to/scripts/send_notifications.sh
#
# 환경변수:
#   WEATHERFIT_API_URL - API 서버 URL (기본값: http://localhost:3000)
#   CRON_SECRET - API 인증 키 (선택사항)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/notification_$(date +%Y%m%d).log"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 현재 시간 (HH:MM 형식)
CURRENT_TIME=$(date +%H:%M)

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" | tee -a "$LOG_FILE"
}

log_info "========== 알림 발송 시작 =========="
log_info "대상 시간: $CURRENT_TIME"

# API URL 설정
API_URL="${WEATHERFIT_API_URL:-http://localhost:3000}"

# 인증 헤더 설정
AUTH_HEADER=""
if [ -n "$CRON_SECRET" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $CRON_SECRET\""
    log_info "인증 헤더 사용"
fi

# API 호출 (GET 요청)
log_info "API 호출: $API_URL/api/notify?time=$CURRENT_TIME"

if [ -n "$CRON_SECRET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL/api/notify?time=$CURRENT_TIME" \
        -H "Authorization: Bearer $CRON_SECRET")
else
    response=$(curl -s -w "\n%{http_code}" "$API_URL/api/notify?time=$CURRENT_TIME")
fi

# HTTP 상태 코드와 응답 본문 분리
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    log_info "API 응답 (HTTP $http_code): $body"
else
    log_error "API 호출 실패 (HTTP $http_code): $body"
fi

log_info "========== 알림 발송 완료 =========="

# 오래된 로그 파일 정리 (30일 이상)
find "$LOG_DIR" -name "notification_*.log" -mtime +30 -delete 2>/dev/null