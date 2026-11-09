#!/usr/bin/env bash
# Deploy/cập nhật stack staging: git pull (kèm submodule) → build → up → chờ healthy → in trạng thái.
#
#   ./deploy/deploy.sh             # pull nhánh hiện tại rồi deploy
#   ./deploy/deploy.sh --no-pull   # deploy đúng commit đang checkout (dùng khi rollback)
set -euo pipefail

# shellcheck source=deploy/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PULL=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    -h | --help)
      sed -n '2,6p' "$0"
      exit 0
      ;;
    *) die "Tham số không hợp lệ: $arg" ;;
  esac
done

cd "$ROOT_DIR"
require_env_file

# Kiểm tra nhanh các giá trị chưa đổi từ file mẫu
if grep -qE '^(JWT_ACCESS_SECRET|JWT_REFRESH_SECRET)=change_me' "$ENV_FILE"; then
  die "JWT secrets trong .env vẫn là change_me… — sinh bằng: openssl rand -hex 48"
fi
if grep -qE '^WEB_DOMAIN=demo\.example\.com' "$ENV_FILE"; then
  die "WEB_DOMAIN vẫn là demo.example.com — đặt domain thật trong .env"
fi

if ((PULL)); then
  if ! git symbolic-ref -q HEAD >/dev/null; then
    die "HEAD đang detached (rollback?) — dùng --no-pull, hoặc 'git checkout <nhánh>' trước."
  fi
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    die "Workspace có thay đổi chưa commit — không pull được. Xem 'git status'."
  fi
  log "git pull ($(git rev-parse --abbrev-ref HEAD))…"
  git pull --ff-only
fi
log "Đồng bộ submodule…"
git submodule sync --recursive
git submodule update --init --recursive

SHA="$(git rev-parse --short HEAD)"
API_SHA="$(git -C ordergo-api rev-parse --short HEAD)"
WEB_SHA="$(git -C ordergo-web rev-parse --short HEAD)"
log "Workspace $SHA · api $API_SHA · web $WEB_SHA"

log "Build + khởi động (lần đầu ~5-10 phút trên VPS nhỏ)…"
dc up -d --build --remove-orphans --wait --wait-timeout 300 ||
  {
    dc ps
    die "Có service không healthy — xem: docker compose -f docker-compose.prod.yml logs --tail 100 <service>"
  }

# Dọn image cũ không còn tag (tiết kiệm đĩa VPS)
docker image prune -f >/dev/null || true

printf '%s\t%s\tapi=%s\tweb=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SHA" "$API_SHA" "$WEB_SHA" \
  >>"$ROOT_DIR/deploy/.deploy-history"

dc ps

API_DOMAIN="$(env_get API_DOMAIN)"
WEB_DOMAIN="$(env_get WEB_DOMAIN)"
if command -v curl >/dev/null; then
  log "Kiểm tra qua HTTPS (lần đầu Caddy cần ~30s để lấy chứng chỉ)…"
  for url in "https://$API_DOMAIN/v1/health/ready" "https://$WEB_DOMAIN/login"; do
    if curl -fsS -o /dev/null --max-time 15 --retry 5 --retry-delay 6 --retry-all-errors "$url"; then
      log "OK   $url"
    else
      warn "FAIL $url — xem: docker compose -f docker-compose.prod.yml logs caddy"
    fi
  done
fi
log "Xong. Lịch sử deploy: deploy/.deploy-history"
