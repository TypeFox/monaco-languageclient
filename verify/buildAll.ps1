$MyPath = Split-Path -Path $MyInvocation.MyCommand.Path -Parent

cd $MyPath/vite; npm run verify:ci
cd $MyPath/webpack; npm run verify:ci
cd $MyPath/angular; npm run verify:ci
cd $MyPath/pnpm; pnpm run verify:ci
# cd $MyPath/yarn; yarn run verify:ci
