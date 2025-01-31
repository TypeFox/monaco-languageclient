MyPath=$(realpath $(dirname $0))

cd $MyPath/peerNpm; npm run verify:ci
cd $MyPath/peerPnpm; pnpm run verify:ci
cd $MyPath/peerYarn; npm run verify:ci

cd $MyPath
