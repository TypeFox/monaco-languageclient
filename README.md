# monaco-languageclient
NPM module to connect Monaco editor with language servers

## Getting started

Clone and build the following repositories from the same directory:
- an abstract (editor agnostic) language client:

```bash
git clone https://github.com/TypeFox/vscode-languageserver-node.git
cd vscode-languageserver-node
git checkout ak/vscode_independent_client
npm install
npm run compile
```

- Monaco language client:

```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm install
npm run compile
```

## Example

Run from `monaco-languageclient` directory:
- to link `example` package against local `monaco-languageclient` package:

```bash
npm run link:example
```

Run from `monaco-languageclient/example` directory:
- to build and start:

```bash
npm install
npm run start
```