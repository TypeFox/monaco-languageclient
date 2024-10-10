MyPath=$(realpath $(dirname $0))

cd $MyPath/vite; npm run verify:ci
cd $MyPath/webpack; npm run verify:ci
cd $MyPath/angular; npm run verify:ci
cd $MyPath/pnpm; pnpm run verify:ci

# yarn example is instable because we can't refence local file based dependencies
cd $MyPath/yarn; yarn run verify:ci
