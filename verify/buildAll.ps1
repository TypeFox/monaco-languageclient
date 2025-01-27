$MyPath = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

# peer tests first
Set-Location $MyPath/peerNpm; npm run verify:ci
Set-Location $MyPath/peerPnpm; pnpm run verify:ci
Set-Location $MyPath/peerYarn; yarn run verify:ci

# yarn first, because it usually has the most problems
Set-Location $MyPath/yarn; npm run verify:ci
Set-Location $MyPath/vite; npm run verify:ci
Set-Location $MyPath/webpack; npm run verify:ci
Set-Location $MyPath/angular; npm run verify:ci
Set-Location $MyPath/next; npm run verify:ci
Set-Location $MyPath/pnpm; pnpm run verify:ci
