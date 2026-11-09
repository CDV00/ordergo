#!/usr/bin/env bash
# Backup ngay (Mongo + ảnh upload) vào volume `backups`, rồi liệt kê các bản đang giữ.
#
#   ./deploy/backup-now.sh
#   ./deploy/backup-now.sh --copy-to ~/ordergo-backups   # copy bản mới nhất ra host (để scp đi nơi khác)
set -euo pipefail

# shellcheck source=deploy/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

COPY_TO=""
while (($#)); do
  case "$1" in
    --copy-to)
      COPY_TO="${2:?--copy-to cần thư mục}"
      shift 2
      ;;
    -h | --help)
      sed -n '2,5p' "$0"
      exit 0
      ;;
    *) die "Tham số không hợp lệ: $1" ;;
  esac
done

cd "$ROOT_DIR"
require_env_file

dc exec -T backup bash /opt/ordergo/backup-loop.sh --once
log "Các bản backup trong volume:"
dc exec -T backup ls -lht /backups

if [[ -n "$COPY_TO" ]]; then
  mkdir -p "$COPY_TO"
  db="$(env_get MONGODB_DB ordergo)"
  latest="$(dc exec -T backup bash -c "ls -1t /backups/ordergo-$db-*.archive.gz | head -n 1")"
  latest_up="$(dc exec -T backup bash -c 'ls -1t /backups/uploads-*.tar.gz 2>/dev/null | head -n 1' || true)"
  for f in $latest $latest_up; do
    dc cp "backup:$f" "$COPY_TO/"
    log "Đã copy $f → $COPY_TO/"
  done
fi
