#!/usr/bin/env bash
# Khôi phục DB từ một bản mongodump --archive --gzip. XOÁ (--drop) các collection hiện có của DB app.
#
#   ./deploy/restore.sh ordergo-ordergo-20261110-200000Z.archive.gz   # tên file trong volume backups
#   ./deploy/restore.sh /home/deploy/ordergo-xxx.archive.gz            # hoặc file trên host
#
# Các bước: xác nhận (gõ tên DB) → backup an toàn bản hiện tại → dừng api → mongorestore --drop → bật api.
# Ảnh upload KHÔNG khôi phục ở đây — xem runbook (uploads-*.tar.gz).
set -euo pipefail

# shellcheck source=deploy/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

[[ $# -eq 1 && "$1" != "-h" && "$1" != "--help" ]] || {
  sed -n '2,8p' "$0"
  exit 1
}
SRC="$1"

cd "$ROOT_DIR"
require_env_file
DB="$(env_get MONGODB_DB ordergo)"

if [[ -f "$SRC" ]]; then
  MODE=host
  desc="file trên host: $SRC ($(du -h "$SRC" | cut -f1))"
else
  MODE=volume
  NAME="$(basename "$SRC")"
  dc exec -T backup test -f "/backups/$NAME" ||
    die "Không thấy '$SRC' trên host lẫn trong volume backups. Xem: docker compose -f docker-compose.prod.yml exec backup ls -lht /backups"
  desc="volume backups: /backups/$NAME"
fi

cat <<EOF

  !!! KHÔI PHỤC DỮ LIỆU — KHÔNG THỂ HOÀN TÁC !!!
  Nguồn : $desc
  Đích  : database '$DB' (mọi collection có trong bản backup sẽ bị DROP rồi ghi lại)
  API sẽ tạm dừng trong lúc khôi phục.

EOF
[[ -t 0 ]] || die "Cần terminal tương tác để xác nhận."
read -r -p "Gõ chính xác tên database ('$DB') để tiếp tục: " ans
[[ "$ans" == "$DB" ]] || die "Không khớp — đã huỷ, chưa thay đổi gì."

log "Backup an toàn trạng thái hiện tại trước khi khôi phục…"
dc exec -T backup bash /opt/ordergo/backup-loop.sh --once

log "Dừng api…"
dc stop api

archive_arg="--archive" # không kèm đường dẫn → đọc từ stdin
if [[ "$MODE" == volume ]]; then
  archive_arg="--archive=/backups/$NAME"
fi
restore_cmd="mongorestore --uri=\"\$MONGODB_URI\" $archive_arg --gzip --drop --nsInclude='$DB.*'"
log "mongorestore $archive_arg --gzip --drop --nsInclude='$DB.*'"
set +e
if [[ "$MODE" == host ]]; then
  dc exec -T backup bash -c "$restore_cmd" <"$SRC"
else
  dc exec -T backup bash -c "$restore_cmd"
fi
rc=$?
set -e

log "Bật lại api…"
dc start api
wait_healthy api 180 || warn "api chưa healthy — xem: docker compose -f docker-compose.prod.yml logs --tail 100 api"

((rc == 0)) || die "mongorestore lỗi (exit $rc). Bản backup an toàn vừa tạo nằm trong volume backups."
log "Khôi phục xong."
