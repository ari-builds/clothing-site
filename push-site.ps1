$ErrorActionPreference = "Stop"
$repo = "C:\Users\Arian\clothing-site"
Push-Location $repo
git add -A
$commit = git commit -m "new arrival: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>&1
Write-Output $commit
if ($LASTEXITCODE -eq 0) {
    git push
    Write-Output "Pushed - Vercel will rebuild. Live in ~1 min."
}
Pop-Location
