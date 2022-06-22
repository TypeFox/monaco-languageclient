# Monaco language client

[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

[NPM module](https://www.npmjs.com/) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).<br>Click [here](http://typefox.io/teaching-the-language-server-protocol-to-microsofts-monaco-editor) for a detail explanation how to connect the Monaco editor to your language server.

- [**Introduction**](#introduction)
  - [Project Modernization](#project-modernization)
- [**Getting started**](#getting-started)
  - [Development environments](#development-environments)
  - [Scripts Overview](#scripts-overview)
- [**Examples**](#examples)
  - [ Node.js Language Server + web client example](#nodejs-language-server-plus-web-client-example)
  - [Browser-LSP](#browser-language-client-and-server)
  - [Browser](#browser-example)
  - [VSCode integration](#vscode-integration)
- [**History**](CHANGELOG.md)
- [**License**](#license)

## Introduction

### Project Modernization

From release 1.0.0 onward the project switched to npm workspaces. We no longer require yarn, lerna and webpack. Mostly therefore the list of `devDependencies` is substantially shorter. All code has been moved to [./packages](./packages) directory.

As before the library code is just compiled with the TypeScript compiler and the library is now packaged with npm. The need for bundling does no longer exist for the example. The compiled code is either executed by node or the web/client related code/pages are served with [vite.js](https://vitejs.dev/). We added a [second build option]( #optional-webpack-build-for-client-example) for the web client example using WebPack.

The default and protected branch is now `main`.

## Getting started

### Development environments

On your local machine you can prepare your dev environment as follows. From CLI in root of the project run:
```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm i
# Cleans-up and compiles everything
npm run build
```

Or you use a fresh dev environment in [Gitpod](https://www.gitpod.io) which is a one-click online IDE for GitHub.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)

### Scripts Overview

The main [package.json](./package.json) contains script entries applicable to the whole workspace like `clean` and `compile`, but it also has entries for launching script from the packages (lib and examples).

For example if you want to rebuild the library you can do it in different ways. From CLI run one of:
```bash
# from the root
npm run build:client
npm --prefix packages/client run build
npm --workspace packages/client run build
# or from packages/client
cd packages/client && npm run build
```

## Examples

There are three examples different examples that demonstrate how the `monaco-languageclient` can be used. The Node.js example uses Express and WebSockets to enable communication between the language server process and the web application.

The Browser Language Client & Server examples does the same, but the server runs in a web worker and communication is via direct LSP message exchange.

The browser example shows how a language service written in JavaScript can be used in a Monaco
Editor contained in a simple HTML page.

All example packages now are now located under [./packages/examples](./packages/examples):

- Node.js Language Server example: [./packages/examples/node](./packages/examples/node): - Look at the [example express app](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/node/src/server.ts) to learn how to open a web socket with an express app and launch a language server within the current process or as an external process.
- Web Client for Node.js Language Server: [./packages/examples/client](./packages/examples/client): Look at the [example client](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/client/src/client.ts) to learn how to start Monaco language client.
- Browser Language Client and Server: [./packages/examples/browser-lsp](./packages/examples/browser-lsp): Look at the [client](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/browser-lsp/src/client.ts) and the [web worker](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/browser-lsp/src/serverWorker.ts) implementing the language server. They communicate via `vscode-languageserver-protocol/browser` instead of a web socket used in the first example.
- Browser example: [./packages/examples/browser](./packages/examples/browser): Look at the [browser example](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/browser/src/client.ts) to learn how to use a language service written in JavaScript in a simple HTML page ([here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/browser-old/src/client.ts) you find the old now deprecated implementation using the [monaco converters](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/src/monaco-converters.ts).)

### Node.js Language Server plus web client example

From CLI in root of the project run:

```bash
# optionally: we assume everything is build as stated above
npm run build
# start the express server with the language server running in the same process.
npm run start-example-node
# alternative: start the express server with language server running in the external process.
npm run start-example-node:ext
# launches vite development server
npm run dev
```

After launching vite development server go to [client example](http://localhost:8080/packages/examples/client/index.html)

**Hints for all examples:** Vite serves all client code from [localhost](http://localhost:8080). You can go to the [index.html](http://localhost:8080/index.html) and navigate to all client examples from there. You can edit the client example code directly (TypeScript) and vite ensures it automatically made available.

### Browser Language Client and Server

If you have build all packages or the specific package `packages/examples/browser-lsp` before you just need to run the vite development server:

```bash
# Optional: Build all packages
npm run build
# Launch vite development server if not already done
npm run dev
```

After launching vite development an go to the [example](http://localhost:8080/packages/examples/browser-lsp/index.html)

**Hint:** If you change the worker code, you have to re-create it (use `npm run build:worker` from the within the example [directory](./packages/examples/browser-lsp)!

### Browser example

From CLI in root of the project you just need to run. If it is already running there is nothing more to do beforehand:

```bash
# launches vite development server
npm run dev
```

After launching vite development an go to the [example](http://localhost:8080/packages/examples/browser/index.html)

You can also [go to](http://localhost:8080/packages/examples/browser-old/index.html) for the old implementation using the deprecated monaco converters.

### Optional webpack build for client example

The web client example can alternatively build with webpack. We recently switched to vite, but webpack is still the most popular bundler out there.

```bash
# optionally: we assume everything is build as stated above
npm run build
# start the express server with the language server running in the same process.
npm run start-example-node
# alternative: start the express server with language server running in the external process.
npm run start-example-node:ext
# build the webpack code
npm run webpack:example-client-build
# start http-server
npm run webpack:example-client-start
```

### VSCode integration

You can as well run vscode tasks to start and debug the server in different modes and the client.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/master/License.txt)
