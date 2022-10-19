# Monaco Language Client & VSCode WebSocket Json RPC

[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

Repository for [NPM module](https://www.npmjs.com/package/monaco-languageclient) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/) and [NPM module](https://www.npmjs.com/package/vscode-ws-jsonrpc) which implements communication between a jsonrpc client and server over WebSocket.

Click [here](http://typefox.io/teaching-the-language-server-protocol-to-microsofts-monaco-editor) for a detail explanation how to connect the Monaco editor to your language server.

- [Monaco Language Client & VSCode WebSocket Json RPC](#monaco-language-client--vscode-websocket-json-rpc)
  - [Latest Important Project Changes](#latest-important-project-changes)
    - [September 2022](#september-2022)
    - [June 2022](#june-2022)
    - [May 2022](#may-2022)
  - [Getting started](#getting-started)
    - [Dev environment: Local machine](#dev-environment-local-machine)
    - [Dev environment: Gitpod](#dev-environment-gitpod)
    - [Scripts Overview](#scripts-overview)
  - [Examples](#examples)
  - [Verification](#verification)
  - [Example usage](#example-usage)
  - [VSCode integration](#vscode-integration)
  - [Troubleshooting](#troubleshooting)
    - [General](#general)
    - [Volta](#volta)
    - [monaco-ediotor-core](#monaco-ediotor-core)
    - [@monaco-editor/react](#monaco-editorreact)
  - [License](#license)

## Latest Important Project Changes

### September 2022

All code has been transformed to esm and npm packages are now of type module. cjs bundles are no longer available.
The `monaco-converter` has been removed.

### June 2022

[monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api) was created by [CGNonofr](https://github.com/CGNonofr) and this library is now based on it and the old [implementation was removed](https://github.com/CodinGame/monaco-vscode-api#history).

We added the independent **vscode-ws-jsonrpc** as sub-package into this repository.

### May 2022

From release 1.0.0 onward the project switched to npm workspaces. We no longer require yarn, lerna and webpack. Mostly therefore the list of `devDependencies` is substantially shorter. All code has been moved to [./packages](./packages) directory.

As before the library code is just compiled with the TypeScript compiler and the library is now packaged with npm. The need for bundling does no longer exist for the example. The compiled code is either executed by node or the web/client related code/pages are served with [vite.js](https://vitejs.dev/). We added a [verification example](#verification) for the web client example using webpack.

The default and protected branch is now `main`.

## Getting started

### Dev environment: Local machine

On your local machine you can prepare your dev environment as follows. From CLI in root of the project run:
```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm i
# Cleans-up, compiles and builds everything
npm run build
```

### Dev environment: Gitpod

Use a fresh dev environment in [Gitpod](https://www.gitpod.io) which is a one-click online IDE for GitHub.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)

### Scripts Overview

The main [package.json](./package.json) contains script entries applicable to the whole workspace like `clean` and `compile`, but it also has entries for launching script from the packages (lib and examples).

For example if you want to rebuild the **monaco-languageclient** or **vscode-ws-jsonrpc** library you can do it in different ways. From CLI run one of:
```bash
# from the root
npm run build:client
# it performs the following what you could execute manually as well
npm --workspace packages/client run build
# instruct npm to execute in different directory
npm --prefix packages/client run build
# or manually got to packages/client and run th build there
cd packages/client && npm run build
```
**Hint**: Use *vscode-ws-jsonrpc* instead of *client* for the other lib.

## Examples

There are a couple of different examples that demonstrate how the `monaco-languageclient` can be used:

- The **server** example located in [./packages/examples/server](./packages/examples/server) runs a Node.js [Express app](./packages/examples/server/src/server.ts) where web sockets are used to enable communication between the language server process and the client web application. The language server can be started as internal or external process.

- The **client** example located in [./packages/examples/client](./packages/examples/client) contains the [client web app](./packages/examples/client/src/client.ts) which connects to the language server therefore requires the node server app to be run in parallel.

- The **browser-lsp** example located in [./packages/examples/browser-lsp](./packages/examples/browser-lsp) contains both the [language client](./packages/examples/browser-lsp/src/client.ts) and the [langauge server implementation running in a web worker](./packages/examples/browser-lsp/src/serverWorker.ts). They communicate via `vscode-languageserver-protocol/browser` instead of a web socket used in the **server/client** examples.

- The **browser** example located in [./packages/examples/browser](./packages/examples/browser) demonstrates how a [language service written in JavaScript](./packages/examples/browser/src/client.ts) can be used in a Monaco Editor contained in a simple HTML page. This example can now be considered legacy as the web worker option eases client side language server implementation and separation.

## Verification

- The **webpack** verification example located in [./packages/verify/webpack](./packages/verify/webpack) demonstrates how bundling can be achieved with webpack. You find the configuration here: [webpack.config.js](./packages/verify/webpack/webpack.config.js).

- The **vite** verification example located in [./packages/verify/vite](./packages/verify/vite) demonstrates how bundling can be achieved with vite. There is no configuration required

## Example usage

Start the Vite dev server. It is assumed you ran the build as described in [Getting Started](#getting-started):

```shell
npm run dev
```

Vite serves all client code at [localhost](http://localhost:8080). You can go to the [index.html](http://localhost:8080/index.html) and navigate to all client examples from there. You can edit the client example code directly (TypeScript) and Vite ensures it automatically made available.

For the **client** or the **client-webpack** examples you need to ensure the **server** example is running:

```shell
# start the express server with the language server running in the same process.
npm run start:example:server
# alternative: start the express server with language server running in the external process.
npm run start:example:server:ext
```

For everything else Vite is sufficient. If you want to reach the verification examples from the vite dev server index page you need to run the following additional http-servers beforehand (this is also indicated on the page itself):
```shell
# Serve the webpack verification example on http://localhost:8081
npm run start:verify:webpack
# Serve the vite verification example on http://localhost:8082
npm run start:verify:vite
```

## VSCode integration

You can as well run vscode tasks to start and debug the server in different modes and the client.

## Troubleshooting

### General

If you use **monaco-languageclient** make sure you have a version of **monaco-editor** installed in your project that is compliant with **monaco-languageclient** and its peer dependency [monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api).

Ensure **monaco-editor** and **monaco-languageclient** are imported before you do any **monaco-editor** intialization. This ensures `monaco` and `vscode` (from **monaco-vscode-api**) are imported beforehand. This is for example done like this in all examples contained in this repository.

### Volta

There are [Volta](https://volta.sh/) instructions in the `package.json` files. When you have Volta available it will ensure the exactly specified `node` and `npm` versions are used.

### monaco-ediotor-core

Originally **monaco-languageclient** was dependent on **monaco-editor-core**, but we changed this with version **1.0.0**. If your project requires to use **monaco-editor-core** and you want to stay compatible with **1.0.0** of **monaco-languageclient** you can install **monaco-editor-core** as **monaco-editor**:

```shell
npm install monaco-editor@npm:monaco-editor-core
```

Or if you are using **Webpack** you can alternatively add this alias to its config:

```javascript
resolve: {
  alias: {
    // This doesn't pull any languages into bundles and works as monaco-editor-core was installed
    'monaco-editor$': 'monaco-editor-core$',
    'monaco-editor/': 'monaco-editor-core/',
  }
}
```

If you use **monaco-editor** as dependency, but only want to have the content of **monaco-editor-core** than just only import:

```javascript
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
```

### @monaco-editor/react

Add the **monaco-editor** import at the top of your editor component file [source](https://github.com/suren-atoyan/monaco-react#use-monaco-editor-as-an-npm-package):

```javascript
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

loader.config({ monaco });
```

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/master/License.txt)
