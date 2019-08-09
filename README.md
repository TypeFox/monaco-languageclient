# Monaco language client
[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![Build Status](https://travis-ci.org/TypeFox/monaco-languageclient.svg?branch=master)](https://travis-ci.org/TypeFox/monaco-languageclient)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

[NPM module](https://www.npmjs.com/) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/)

- Look at [the example client](https://github.com/TypeFox/monaco-languageclient/blob/master/example/src/client.ts) to learn how to start Monaco language client.
- Look at [the example express app](https://github.com/TypeFox/monaco-languageclient/blob/master/example/src/server.ts) to learn how to open a web socket with an express app and launch a language server within the current process or as an external process.
- Look at [the browser example](https://github.com/TypeFox/monaco-languageclient/blob/master/examples/browser/src/client.ts) to learn how to use a language service written in JavaScript in a simple HTML page.

Click [here](http://typefox.io/teaching-the-language-server-protocol-to-microsofts-monaco-editor) for a detail explanation how to connect the Monaco editor to your language server.

- [**Getting started**](#getting-started)
   - [Local dev env](#local-dev-env)
  - [Gitpod](#gitpod)
- [**Examples**](#examples)
  - [Node.js](#nodejs)
  - [Browser](#browser)
- [**History**](CHANGELOG.md)
- [**License**](#license)

## Getting started

### Local dev env

```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
yarn
```

### Gitpod

Just start a fresh dev environment in Gitpod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)

[Gitpod](https://www.gitpod.io) is a one-click online IDE for GitHub. It is based on [Theia IDE framework](http://www.theia-ide.org) and make use of Monaco and the language server protocol by means of monaco-languageclient.

## Examples

There are two different examples that demonstrate how the `monaco-languageclient` can be used. The Node.js example uses Express and WebSockets to enable communication between the language server process and the web application. The browser example shows how a language service written in JavaScript can be used in a Monaco Editor contained in a simple HTML page.

### Node.js

The example node package is located under the `monaco-languageclient/example` directory. All tasks below should be run from this directory.

From CLI:
- Run `yarn` and `yarn run build` to install dependencies and build the example node package.
- Run `yarn run start` to start the express server with the language server running in the same process.
- Run `yarn run start:ext` to start the express server with language server running in the external process.

After staring the express server go to http://localhost:3000 to open the sample page.

You can as well run vscode tasks to start and debug the server in different modes.

### Browser

The example browser package is located under the `monaco-languageclient/examples/browser` directory. All tasks below should be run from this directory.

From CLI:
- Run `yarn` and `yarn run build` to install dependencies and build the example HTML and JavaScript files.

After the example has been built, open `monaco-languageclient/examples/browser/lib/index.html` in a browser to open the sample page.

## License
[MIT](https://github.com/TypeFox/monaco-languageclient/blob/master/License.txt)
