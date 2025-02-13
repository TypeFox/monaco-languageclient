$MyPath = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

Set-Location $MyPath/vite; npm run verify:ci
Set-Location $MyPath/webpack; npm run verify:ci
Set-Location $MyPath/angular; npm run verify:ci
Set-Location $MyPath/next; npm run verify:ci

Set-Location $MyPath
