$ErrorActionPreference = "Stop"
$repo = "C:\Users\Arian\clothing-site"
Push-Location $repo
git add -A
$commit = git commit -m "update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1
Write-Output $commit
if ($LASTEXITCODE -eq 0) {
    git push
    Write-Output "Pushed - GitHub updated."
    $envPath = "$repo\.env.local"
    if (Test-Path $envPath) {
        $tok = Get-Content $envPath | Where-Object { $_ -match '^VERCEL_TOKEN=' } | Select-Object -First 1
        if ($tok) {
            $token = ($tok -replace '^VERCEL_TOKEN=', '').Trim()
            $env:VERCEL_TOKEN = $token
            vercel --prod --yes --token $env:VERCEL_TOKEN
            Write-Output "Vercel redeployed."
        } else {
            Write-Output "No VERCEL_TOKEN in .env.local - skipping Vercel."
        }
    } else {
        Write-Output "No .env.local - skipping Vercel."
    }
}
Pop-Location
