$MyPath = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

Set-Location $MyPath/peerNpm; npm run verify:ci
Set-Location $MyPath/peerPnpm; pnpm run verify:ci
Set-Location $MyPath/peerYarn; npm run verify:ci
