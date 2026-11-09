<#
.SYNOPSIS
  Tắt OrderGo đã chạy bằng scripts/run.ps1 (API + Web). Thêm -Infra để tắt cả Mongo/Redis (giữ dữ liệu).

.EXAMPLE
  ./scripts/off.ps1          # tắt API + Web
  ./scripts/off.ps1 -Infra   # tắt thêm Mongo + Redis (docker compose down, KHÔNG xoá dữ liệu)
#>
[CmdletBinding()]
param([switch]$Infra)

$ErrorActionPreference = 'Continue'

$WebPort = 3200
$ApiPort = 4200

$Root   = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $Root '.run'

function Stop-Tree([int]$ProcessId, [string]$Name) {
  if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
    # /T: tắt cả tiến trình con (nest --watch, next dev sinh worker)
    taskkill /PID $ProcessId /T /F 2>&1 | Out-Null
    Write-Host "  ✓ Đã tắt $Name (PID $ProcessId)" -ForegroundColor Green
  }
}

foreach ($name in 'web', 'api') {
  $pidFile = Join-Path $RunDir "$name.pid"
  if (Test-Path $pidFile) {
    $id = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($id) { Stop-Tree -ProcessId ([int]$id) -Name $name }
    Remove-Item $pidFile -Force
  }
}

# Dự phòng: tiến trình node còn giữ cổng (vd chạy tay, hoặc PID file mất)
foreach ($port in $WebPort, $ApiPort) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') { Stop-Tree -ProcessId $proc.Id -Name "node :$port" }
  }
}

if ($Infra) {
  docker compose -f (Join-Path $Root 'docker-compose.infra.yml') stop | Out-Null
  Write-Host '  ✓ Đã dừng Mongo + Redis (dữ liệu vẫn giữ trong volume)' -ForegroundColor Green
}

Write-Host 'OrderGo đã tắt. Cấu hình nginx (50-ordergo.conf) vẫn giữ — ordergo.localhost sẽ báo 502 tới khi chạy lại.'
