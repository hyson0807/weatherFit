#!/bin/bash

# WeatherFit 알림 발송 스크립트
# crontab에 등록하여 사용
# 예: 0 6,7,8,9 * * * /path/to/send_notifications.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/notification_$(date +%Y%m%d).log"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

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

# API 호출 (로컬 개발 서버 또는 프로덕션 URL)
API_URL="${WEATHERFIT_API_URL:-http://localhost:3000}"

response=$(curl -s -X POST "$API_URL/api/notify?time=$CURRENT_TIME")

if [ $? -eq 0 ]; then
    log_info "API 응답: $response"
else
    log_error "API 호출 실패"
fi

log_info "========== 알림 발송 완료 =========="