MyPath=$(realpath $(dirname $0))

cd $MyPath/vite; npm run verify:ci
cd $MyPath/webpack; npm run verify:ci
cd $MyPath/angular; npm run verify:ci
cd $MyPath/next; npm run verify:ci

cd $MyPath
