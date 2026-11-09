<#
.SYNOPSIS
  Chạy OrderGo trên máy dev: Mongo + Redis (Docker), API (Nest watch), Web (Next dev), nginx gateway.

.DESCRIPTION
  - Mongo (replica set rs0) ở cổng 27018, Redis 6379 — docker-compose.infra.yml
  - API  : http://localhost:4200  (log: .run/logs/api.log)
  - Web  : http://localhost:3200  (log: .run/logs/web.log)
  - Vào app qua nginx: http://ordergo.localhost  ·  LAN/điện thoại: http://<ip-may>:8083
  Tắt bằng scripts/off.ps1.

.EXAMPLE
  ./scripts/run.ps1                 # chạy tất cả
  ./scripts/run.ps1 -Seed           # chạy + nạp lại dữ liệu demo "Cà phê Góc Phố"
  ./scripts/run.ps1 -SkipNginx      # không đụng tới nginx gateway
#>
[CmdletBinding()]
param(
  [switch]$Seed,
  [switch]$SkipNginx,
  [string]$NginxDir = 'D:/Docker/nginx',
  [string]$NginxContainer = 'nginx-gateway'
)

$ErrorActionPreference = 'Stop'

# ─── Cấu hình cổng (đổi ở đây nếu trùng; nhớ sửa deploy/nginx-local/50-ordergo.conf) ───
$WebPort   = 3200
$ApiPort   = 4200
$MongoPort = 27018
$RedisPort = 6379
$Hostname  = 'ordergo.localhost'
$LanPort   = 8083

$Root   = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $Root '.run'
$LogDir = Join-Path $RunDir 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Step($msg) { Write-Host "▶ $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }

function Test-PortListening([int]$Port) {
  $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Wait-Http([string]$Url, [int]$TimeoutSec) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -lt 500) { return $true }
    } catch {
      if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) { return $true }
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Start-App([string]$Name, [string]$WorkDir, [string[]]$NodeArgs, [hashtable]$EnvVars) {
  $pidFile = Join-Path $RunDir "$Name.pid"
  if (Test-Path $pidFile) {
    $old = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($old -and (Get-Process -Id $old -ErrorAction SilentlyContinue)) {
      Write-Ok "$Name đang chạy (PID $old) — bỏ qua"
      return
    }
  }
  # Biến môi trường chỉ áp cho tiến trình con: đặt tạm rồi khôi phục
  $saved = @{}
  foreach ($k in $EnvVars.Keys) {
    $saved[$k] = [Environment]::GetEnvironmentVariable($k, 'Process')
    [Environment]::SetEnvironmentVariable($k, [string]$EnvVars[$k], 'Process')
  }
  try {
    $out = Join-Path $LogDir "$Name.log"
    $err = Join-Path $LogDir "$Name.err.log"
    $p = Start-Process -FilePath 'node' -ArgumentList $NodeArgs -WorkingDirectory $WorkDir `
      -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden -PassThru
    Set-Content -Path $pidFile -Value $p.Id
    Write-Ok "$Name khởi động (PID $($p.Id)) — log: .run/logs/$Name.log"
  } finally {
    foreach ($k in $saved.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k], 'Process') }
  }
}

# ─── 0. Kiểm tra ───
foreach ($dir in 'ordergo-api/node_modules', 'ordergo-web/node_modules') {
  if (-not (Test-Path (Join-Path $Root $dir))) {
    throw "Thiếu $dir — chạy: corepack enable; cd $($dir.Split('/')[0]); yarn install"
  }
}
foreach ($p in $WebPort, $ApiPort) {
  if ((Test-PortListening $p) -and -not (Test-Path (Join-Path $RunDir ($(if ($p -eq $WebPort) {'web'} else {'api'}) + '.pid')))) {
    throw "Cổng $p đang bị chương trình khác dùng. Đổi `$WebPort/`$ApiPort ở đầu scripts/run.ps1 (và trong deploy/nginx-local/50-ordergo.conf)."
  }
}

# ─── 1. Mongo + Redis ───
Write-Step "Mongo (cổng $MongoPort) + Redis (cổng $RedisPort)"
$env:MONGO_PORT = $MongoPort
$env:REDIS_PORT = $RedisPort
docker compose -f (Join-Path $Root 'docker-compose.infra.yml') up -d | Out-Null
$deadline = (Get-Date).AddSeconds(90)
do {
  $health = docker inspect -f '{{.State.Health.Status}}' ordergo-mongo 2>$null
  if ($health -eq 'healthy') { break }
  Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)
if ($health -ne 'healthy') { throw "Mongo chưa sẵn sàng (trạng thái: $health) — xem: docker logs ordergo-mongo" }
Write-Ok 'Mongo replica set sẵn sàng'

$mongoUri = "mongodb://localhost:$MongoPort/?replicaSet=rs0&directConnection=true"
$publicOrigins = "http://$Hostname,http://localhost:$WebPort"

# ─── 2. Dữ liệu demo (tuỳ chọn) ───
if ($Seed) {
  Write-Step 'Nạp dữ liệu demo (Cà phê Góc Phố)'
  Push-Location (Join-Path $Root 'ordergo-api')
  try {
    $env:MONGODB_URI = $mongoUri
    node node_modules/@nestjs/cli/bin/nest.js build | Out-Null
    node dist/scripts/seed-demo.js
    if ($LASTEXITCODE -ne 0) { throw 'Seed thất bại' }
  } finally {
    Remove-Item Env:MONGODB_URI -ErrorAction SilentlyContinue
    Pop-Location
  }
}

# ─── 3. API ───
Write-Step "API (cổng $ApiPort)"
Start-App -Name 'api' -WorkDir (Join-Path $Root 'ordergo-api') `
  -NodeArgs @('node_modules/@nestjs/cli/bin/nest.js', 'start', '--watch') `
  -EnvVars @{
    PORT         = $ApiPort
    MONGODB_URI  = $mongoUri
    REDIS_URL    = "redis://localhost:$RedisPort"
    CORS_ORIGINS = $publicOrigins
    TRUST_PROXY  = '1'               # đứng sau nginx → lấy IP thật của client
    UPLOAD_DIR   = (Join-Path $Root '.run/uploads')
  }

# ─── 4. Web ───
Write-Step "Web (cổng $WebPort)"
Start-App -Name 'web' -WorkDir (Join-Path $Root 'ordergo-web') `
  -NodeArgs @('node_modules/next/dist/bin/next', 'dev', '--turbopack', '-p', "$WebPort") `
  -EnvVars @{
    # Cùng origin qua nginx: /v1, /socket.io, /uploads đều đi qua ordergo.localhost
    NEXT_PUBLIC_API_URL     = '/v1'
    NEXT_TELEMETRY_DISABLED = '1'
  }

if (-not (Wait-Http "http://localhost:$ApiPort/v1/health" 120)) { Write-Warn2 'API chưa trả lời sau 120s — xem .run/logs/api.log' } else { Write-Ok 'API sẵn sàng' }
if (-not (Wait-Http "http://localhost:$WebPort/login" 120)) { Write-Warn2 'Web chưa trả lời sau 120s — xem .run/logs/web.log' } else { Write-Ok 'Web sẵn sàng' }

# ─── 5. nginx gateway ───
if (-not $SkipNginx) {
  Write-Step "nginx gateway ($NginxContainer)"
  $src = Join-Path $Root 'deploy/nginx-local/50-ordergo.conf'
  $dst = Join-Path $NginxDir 'conf.d/50-ordergo.conf'
  if (-not (Test-Path (Join-Path $NginxDir 'conf.d'))) {
    Write-Warn2 "Không thấy $NginxDir/conf.d — bỏ qua nginx (dùng -NginxDir để chỉ đường dẫn khác)"
  } else {
    $changed = -not (Test-Path $dst) -or ((Get-FileHash $src).Hash -ne (Get-FileHash $dst).Hash)
    if ($changed) { Copy-Item $src $dst -Force; Write-Ok "Đã chép cấu hình → $dst" }
    $running = docker inspect -f '{{.State.Running}}' $NginxContainer 2>$null
    if ($running -ne 'true') {
      Write-Warn2 "Container $NginxContainer không chạy — bật: docker compose -f $NginxDir/compose.yaml up -d"
    } else {
      docker exec $NginxContainer nginx -t 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        docker exec $NginxContainer nginx -t
        throw 'Cấu hình nginx lỗi — chưa reload'
      }
      docker exec $NginxContainer nginx -s reload | Out-Null
      Write-Ok 'nginx đã reload'
      $ports = docker port $NginxContainer 2>$null
      if (-not ($ports -match "^$LanPort/tcp")) {
        Write-Warn2 "Cổng LAN $LanPort chưa mở trên $NginxContainer — thêm `"${LanPort}:${LanPort}`" vào $NginxDir/compose.yaml rồi: docker compose -f $NginxDir/compose.yaml up -d"
      }
    }
  }
}

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -First 1).IPAddress

Write-Host ''
Write-Host 'OrderGo đang chạy:' -ForegroundColor Green
Write-Host "  App        : http://$Hostname"
if ($lanIp) { Write-Host "  Điện thoại : http://${lanIp}:$LanPort  (cùng mạng Wi-Fi)" }
Write-Host "  API trực tiếp: http://localhost:$ApiPort/v1/health  ·  Swagger: http://$Hostname/api-docs"
Write-Host "  Đăng nhập demo: 0900000001 / ordergo123 (chạy với -Seed để tạo dữ liệu)"
Write-Host '  Tắt: ./scripts/off.ps1   (thêm -Infra để tắt cả Mongo/Redis)'
