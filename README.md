# Monaco language client
NPM module to connect Monaco editor with language servers

- Look at [the example client](https://github.com/TypeFox/monaco-languageclient/blob/master/example/src/client.ts) to learn how to start Monaco langauge client.
- Look at [the example express app](https://github.com/TypeFox/monaco-languageclient/blob/master/example/src/server.ts) to learn how to open a web socket with an express app and launch a language server within the current process or as an external process.

## Getting started

```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm install
```

## Examples

The example node package is located under `monaco-languageclient/example` directory. All tasks below should be run from this directory.

From CLI:
- Run `npm install` and `npm run build` to install dependencies and build the example node package.
- Run `npm run start` to start the express server with the language server running in the same process.
- Run `npm run start:ext` to start the express erver with language server running in the external process.

After staring the express server go to `http://localhost:3000` to open the sample page.

You can as well run vscode tasks to start and debug the server in differnet modes.

## License
[MIT](https://github.com/TypeFox/monaco-languageclient/blob/master/License.txt)
