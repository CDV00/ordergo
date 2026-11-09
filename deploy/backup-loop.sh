#!/usr/bin/env bash
# Chạy BÊN TRONG container `backup` (image mongo:7) — xem docker-compose.prod.yml.
#   (không tham số)  vòng lặp: backup mỗi ngày lúc BACKUP_HOUR_UTC:00 UTC
#   --once           backup ngay 1 lần rồi thoát (deploy/backup-now.sh gọi)
#
# Tạo trong /backups:
#   ordergo-<db>-<YYYYmmdd-HHMMSSZ>.archive.gz   mongodump --archive --gzip của DB app
#   uploads-<YYYYmmdd-HHMMSSZ>.tar.gz            ảnh upload (volume uploads-data)
# Giữ BACKUP_KEEP bản mới nhất mỗi loại.
set -euo pipefail

: "${MONGODB_URI:?MONGODB_URI trống}"
DB="${MONGODB_DB:-ordergo}"
KEEP="${BACKUP_KEEP:-14}"
HOUR="${BACKUP_HOUR_UTC:-20}"
DIR=/backups

log() { printf '[backup %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

prune() {
  local pattern="$1"
  # shellcheck disable=SC2012
  ls -1t $DIR/$pattern 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f --
}

do_backup() {
  local ts out
  ts="$(date -u +%Y%m%d-%H%M%SZ)"
  out="$DIR/ordergo-$DB-$ts.archive.gz"
  log "mongodump db=$DB → $out"
  mongodump --uri="$MONGODB_URI" --db="$DB" --archive="$out.tmp" --gzip --quiet
  mv "$out.tmp" "$out"

  if [[ -d /uploads ]]; then
    log "tar ảnh upload → $DIR/uploads-$ts.tar.gz"
    tar -czf "$DIR/uploads-$ts.tar.gz.tmp" -C /uploads .
    mv "$DIR/uploads-$ts.tar.gz.tmp" "$DIR/uploads-$ts.tar.gz"
  fi

  prune "ordergo-$DB-*.archive.gz"
  prune "uploads-*.tar.gz"
  log "xong — $(ls -1 "$DIR"/ordergo-"$DB"-*.archive.gz | wc -l) bản DB đang giữ"
}

mkdir -p "$DIR"

if [[ "${1-}" == "--once" ]]; then
  do_backup
  exit 0
fi

trap 'log "nhận tín hiệu dừng"; exit 0' TERM INT
rm -f "$DIR"/*.tmp # dọn file dở dang từ lần chạy bị ngắt
log "lịch: mỗi ngày ${HOUR}:00 UTC, giữ $KEEP bản"
while true; do
  now="$(date -u +%s)"
  next="$(date -u -d "today ${HOUR}:00" +%s)"
  if ((next <= now)); then
    next=$((next + 86400))
  fi
  log "backup kế tiếp: $(date -u -d "@$next" +%Y-%m-%dT%H:%M:%SZ)"
  sleep $((next - now)) &
  wait $!
  do_backup || log "LỖI backup (thử lại lần sau)"
done
