$MyPath = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

# yarn first, because it usually has the most problems
Set-Location $MyPath/peerYarn; npm run verify:ci
Set-Location $MyPath/peerNpm; npm run verify:ci
Set-Location $MyPath/peerPnpm; pnpm run verify:ci

Set-Location $MyPath
