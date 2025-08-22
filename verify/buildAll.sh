MyPath=$(realpath $(dirname $0))

cd $MyPath/webpack; npm run verify:ci
cd $MyPath/next; npm run verify:ci
# currently broken
# cd $MyPath/angular; npm run verify:ci

cd $MyPath
