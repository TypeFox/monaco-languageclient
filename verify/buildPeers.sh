MyPath=$(realpath $(dirname $0))

# yarn first, because it usually has the most problems
cd $MyPath/peerYarn; npm run verify:ci
cd $MyPath/peerNpm; npm run verify:ci
cd $MyPath/peerPnpm; pnpm run verify:ci

cd $MyPath
