MyPath=$(realpath $(dirname $0))

# yarn first, because it usually has the most problems
cd $MyPath/yarn; npm run verify:ci
cd $MyPath/vite; npm run verify:ci
cd $MyPath/webpack; npm run verify:ci
cd $MyPath/angular; npm run verify:ci
cd $MyPath/next; npm run verify:ci
cd $MyPath/pnpm; pnpm run verify:ci
