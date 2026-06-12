Write-Host "=== Khoi dong TheraHome Dev Environment ===" -ForegroundColor Cyan
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "NPM is not installed or not found in system environment PATH."
    Exit 1
}
npm run dev
