# Monaco language client
NPM module to connect Monaco editor with language servers

## Getting started

Clone and build the following repositories from the same directory:
- jsonrpc over web socket:

```
git clone https://github.com/TypeFox/vscode-ws-jsonrpc
cd vscode-ws-jsonrpc
npm install
```

- an abstract (editor agnostic) language client:

```bash
git clone https://github.com/TypeFox/vscode-languageserver-node.git
cd vscode-languageserver-node
npm install
```

- Monaco language client:

```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm install
```

## Example

Run from `monaco-languageclient/example` directory:
- to build and start:

```bash
npm install
npm run start
```

## License
[MIT](https://github.com/TypeFox/monaco-languageclient/blob/master/License.txt)
