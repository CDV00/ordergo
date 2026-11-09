#!/usr/bin/env bash
# Seed dữ liệu demo "Cà phê Góc Phố" vào stack đang chạy (chạy trong container api).
# Chỉ xoá/tạo lại dữ liệu của tenant demo, nhưng tạo tài khoản 0900000001…0900000005 với
# mật khẩu CÔNG KHAI "ordergo123" nếu không đặt DEMO_PASSWORD. KHÔNG chạy trên server có dữ liệu
# khách hàng thật.
#
#   ./deploy/seed-demo.sh          # hỏi xác nhận
#   ./deploy/seed-demo.sh --yes    # không hỏi
set -euo pipefail

# shellcheck source=deploy/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

YES=0
for arg in "$@"; do
  case "$arg" in
    -y | --yes) YES=1 ;;
    -h | --help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
    *) die "Tham số không hợp lệ: $arg" ;;
  esac
done

cd "$ROOT_DIR"
require_env_file

# Chỉ truyền DEMO_* có giá trị (DEMO_PASSWORD rỗng sẽ thành mật khẩu rỗng).
exec_env=()
for key in DEMO_PASSWORD DEMO_BANK_BIN DEMO_BANK_NAME DEMO_BANK_ACCOUNT DEMO_BANK_ACCOUNT_NAME; do
  val="$(env_get "$key")"
  if [[ -n "$val" ]]; then
    exec_env+=(-e "$key=$val")
  fi
done

if grep -qE '^[[:space:]]*DEMO_PASSWORD=[[:space:]]*$' "$ENV_FILE"; then
  die "DEMO_PASSWORD trong .env đang rỗng — điền mật khẩu hoặc comment dòng đó."
fi
if [[ -z "$(env_get DEMO_PASSWORD)" ]]; then
  warn "Chưa đặt DEMO_PASSWORD → tài khoản demo dùng mật khẩu công khai 'ordergo123'."
fi

if ((!YES)); then
  confirm "Seed demo vào DB '$(env_get MONGODB_DB ordergo)' trên $(env_get API_DOMAIN '?')? (reset tenant demo)" ||
    die "Đã huỷ."
fi

wait_healthy api 60 || die "Container api chưa healthy — chạy ./deploy/deploy.sh trước."
dc exec -T ${exec_env[@]+"${exec_env[@]}"} api node dist/scripts/seed-demo.js --force
log "Xong. Đăng nhập https://$(env_get WEB_DOMAIN)/login bằng 0900000001 (owner)."
