$ErrorActionPreference = "Continue"
$base = "C:\Users\Arian\clothing-site"

$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "clothing-site[\\/]server.js" }
if ($running) {
    Write-Output "Site server already running (PID $($running.ProcessId))"
    exit 0
}

$logDir = "$base\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
Start-Process -FilePath "node.exe" -ArgumentList "$base\server.js" -WindowStyle Hidden `
    -RedirectStandardOutput "$logDir\site-out.log" -RedirectStandardError "$logDir\site-err.log"
Start-Sleep -Seconds 3
if (Test-NetConnection -ComputerName localhost -Port 4173 -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Output "Site server started: http://localhost:4173"
} else {
    Write-Output "Site server may have failed - check logs\site-err.log"
}
exit 0
