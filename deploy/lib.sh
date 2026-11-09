#!/usr/bin/env bash
# Hàm dùng chung cho các script deploy/*.sh — được `source`, không chạy trực tiếp.
# shellcheck shell=bash

# Gốc workspace (thư mục chứa docker-compose.prod.yml)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
MONGO_AUTH_FILE="$ROOT_DIR/deploy/docker-compose.mongo-auth.yml"

log() { printf '\033[1;34m[ordergo]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[cảnh báo]\033[0m %s\n' "$*" >&2; }
die() {
  printf '\033[1;31m[lỗi]\033[0m %s\n' "$*" >&2
  exit 1
}

require_env_file() {
  [[ -f "$ENV_FILE" ]] || die "Không thấy $ENV_FILE — chạy: cp deploy/.env.staging.example .env rồi điền giá trị."
}

# env_get KEY [default] — đọc giá trị từ .env (không `source` để tránh chạy lệnh trong file).
env_get() {
  local key="$1" def="${2-}" line val
  line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    printf '%s' "$def"
    return
  fi
  val="${line#*=}"
  # bỏ dấu nháy bao ngoài nếu có
  if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
    val="${BASH_REMATCH[1]}"
  fi
  printf '%s' "$val"
}

# dc ... — docker compose với đúng file + env (tự thêm override Mongo auth khi .env có MONGO_ROOT_USER)
dc() {
  local files=(-f "$COMPOSE_FILE")
  if [[ -n "$(env_get MONGO_ROOT_USER)" ]]; then
    files+=(-f "$MONGO_AUTH_FILE")
  fi
  docker compose "${files[@]}" --env-file "$ENV_FILE" "$@"
}

# confirm "câu hỏi" — y/N, bắt buộc có terminal
confirm() {
  local ans
  [[ -t 0 ]] || die "Cần terminal tương tác để xác nhận."
  read -r -p "$1 [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

# wait_healthy SERVICE [timeout_giây]
wait_healthy() {
  local svc="$1" timeout="${2:-180}" waited=0 cid status
  while ((waited < timeout)); do
    cid="$(dc ps -q "$svc" 2>/dev/null || true)"
    if [[ -n "$cid" ]]; then
      status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo unknown)"
      if [[ "$status" == "healthy" ]]; then
        return 0
      fi
    fi
    sleep 3
    waited=$((waited + 3))
  done
  return 1
}
