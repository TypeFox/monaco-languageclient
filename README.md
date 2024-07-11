# Monaco Language Client, VSCode WebSocket Json RPC, Monaco-Editor-Wrapper, Monaco-Editor-React and examples

[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

This repository now host multiple npm packages under one roof:

- [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).
- [vscode-ws-jsonrpc](https://www.npmjs.com/package/vscode-ws-jsonrpc) which implements communication between a jsonrpc client and server over WebSocket.
- [monaco-editor-wrapper](https://www.npmjs.com/package/monaco-editor-wrapper) for building monaco editor application driven by configuration
- [monaco-editor-react](https://www.npmjs.com/package/@typefox/monaco-editor-react) puts a react cloack over `monaco-editor-wrapper`
- [monaco-languageclient-examples](https://www.npmjs.com/package/monaco-languageclient-examples) provides the examples which allows to use them externally.

Click [here](https://www.typefox.io/blog/teaching-the-language-server-protocol-to-microsofts-monaco-editor/) for a detail explanation how to connect the Monaco editor to your language server.

- [Monaco Language Client, VSCode WebSocket Json RPC, Monaco-Editor-Wrapper, Monaco-Editor-React and examples](#monaco-language-client-vscode-websocket-json-rpc-monaco-editor-wrapper-monaco-editor-react-and-examples)
  - [Changelogs, project history and compatibility](#changelogs-project-history-and-compatibility)
  - [Getting started](#getting-started)
    - [Vite dev server](#vite-dev-server)
  - [Usage](#usage)
  - [Examples Overview](#examples-overview)
    - [Main Examples](#main-examples)
    - [Example usage](#example-usage)
      - [Server processes](#server-processes)
        - [JSON Language Server](#json-language-server)
        - [Pyright Language Server](#pyright-language-server)
        - [Groovy Language Server](#groovy-language-server)
    - [Verification Examples \& Usage](#verification-examples--usage)
    - [VSCode integration](#vscode-integration)
  - [Featured projects](#featured-projects)
  - [Troubleshooting](#troubleshooting)
    - [General](#general)
    - [Dependency issues: monaco-editor / @codingame/monaco-vscode-api / @codingame/monaco-vscode-editor-api](#dependency-issues-monaco-editor--codingamemonaco-vscode-api--codingamemonaco-vscode-editor-api)
    - [Volta](#volta)
    - [Vite dev server troubleshooting](#vite-dev-server-troubleshooting)
    - [Serve all files required](#serve-all-files-required)
    - [Bad Polyfills](#bad-polyfills)
      - [buffer](#buffer)
    - [monaco-editor and react](#monaco-editor-and-react)
    - [pnpm](#pnpm)
  - [Licenses](#licenses)

## Changelogs, project history and compatibility

CHANGELOGs for each project are available from the linked location:

- CHANGELOG for `monaco-languageclient` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/CHANGELOG.md)
- CHANGELOG for `vscode-ws-jsonrpc` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/CHANGELOG.md)
- CHANGELOG for `monaco-editor-wrapper` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/CHANGELOG.md)
- CHANGELOG for `@typefox/monaco-editor-react` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md)
- CHANGELOG for `monaco-languageclient-examples` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/CHANGELOG.md)

Important Project changes and notes about the project's history are found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#important-project-changes).

You find the `monaco-editor`, `vscode`, `@codingame/monaco-vscode-api` and `@codingame/monaco-vscode-editor-api` compatibility table [here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table).

## Getting started

On your local machine you can prepare your dev environment as follows. At first it is advised to build everything. Or, use a fresh dev environment in [Gitpod](https://www.gitpod.io) by pressing the **code now** badge above.
Locally, from a terminal do:

```bash
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm i
# Cleans-up, compiles and builds everything
npm run build
```

### Vite dev server

Start the Vite dev server. It serves all client code at [localhost](http://localhost:20001). You can go to the [index.html](http://localhost:20001/index.html) and navigate to all client examples from there. You can edit the client example code directly (TypeScript) and Vite ensures it automatically made available:

```shell
npm run dev
# OR: this clears the cache and has debug output
npm run dev:debug
```

As this is a npm workspace the main [package.json](./package.json) contains script entries applicable to the whole workspace like `watch`, `build` and `lint`, but it also contains shortcuts for launching scripts from the childe packages like `npm run build:examples`.

If you want to change the libries and see this reflected directly, then you need to run the watch command that compiles all TypeScript files form both libraries and the examples:

```shell
npm run watch
```

## Usage

Please look at the respective section in the packages:

- Usage for `monaco-languageclient` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/README.md#usage)
- Usage for `vscode-ws-jsonrpc` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/README.md#usage)
- Usage for `monaco-editor-wrapper` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/README.md#usage)
- Usage for `@typefox/monaco-editor-react` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/README.md#usage)

## Examples Overview

The examples demonstrate mutliple things:

- How `monaco-languageclient` is use by `monaco-edtior-wrapper` or `@typefox/monaco-editor-react` to have an editor that is connected to a language server either running in the browser in a web worker or `vscode-ws-jsonrpc`. is used to an external process via web-socket.
- How different language servers can be intergrated in a common way, so they can communicate via web-socket to the front-end running in the browser.

### Main Examples

- [JSON Language client and language server example](./packages/examples/src/json):
  - The **json-server** runs an external Node.js [Express app](./packages/examples/src/json/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [JSON Language Server](#json-language-server)).
  - The **json-client** contains the [monaco-editor-wrapper app](./packages/examples/src/json/client/wrapperWs.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

- [Python Language client and pyright language server example](./packages/examples/src/python):
  - The **python-server** runs an external Node.js [Express app](./packages/examples/src/python/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [Pyright Language Server](#pyright-language-server)).
  - The **python-client** contains the [monaco-editor-wrapper app](./packages/examples/src/python/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

- [Groovy Language client and language server example](./packages/examples/src/groovy):
  - The **groovy-server** runs an external [Java app](./packages/examples/src/groovy/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application ([Groovy Language Server](#groovy-language-server)).
  - The **groovy-client** contains the [monaco-editor-wrapper app](./packages/examples/src/python/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.
  - It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/python/client/reactPython.tsx) to connect to the server.

- Langium examples (here client and server communicate via `vscode-languageserver-protocol/browser` instead of a web socket used in the three examples above:
  - [Langium grammar DSL](./packages/examples/src/langium/langium-dsl): It contains both the [language client](./packages/examples/src/langium/langium-dsl/wrapperLangium.ts) and the [langauge server (web worker)](./packages/examples/src/langium/langium-dsl/worker/langium-server.ts). Here you can chose beforehand if the wrapper should be started in classic or extended mode.
  - [Statemachine DSL (created with Langium)](./packages/examples/src/langium/statemachine): It contains both the [language client](./packages/examples/src/langium/statemachine/main.ts) and the [langauge server (web worker)](./packages/examples/src/langium/statemachine/worker/statemachine-server.ts).
    - It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/langium/statemachine/main-react.tsx) to connect to the server.

- [bare monaco-languageclient](./packages/examples/src/bare) It demostrate how the `JSON Language client and language server example` can be realised without `monaco-editor-wrapper`. You find the implementation [here](./packages/examples/src/bare/client.ts).

- [browser example](./packages/examples/src/browser) demonstrates how a [monaco-editor-wrapper can be combined with a language service written in JavaScript](./packages/examples/src/browser/main.ts). This example can now be considered legacy as the web worker option eases client side language server implementation and separation, but it still shows a valid way to achieve the desired outcome.

- monaco-editor related examples
  - [Typescript Language support](./packages/examples/src/ts/wrapperTs.ts)
  - [Multi-editor usage](./packages/examples/src/ts/wrapperAdvanced.ts)

### Example usage

#### Server processes

##### JSON Language Server

For the **json-client**, **react-client** or the **client-webpack** examples you need to ensure the **json-server** example is running:

```shell
# start the express server with the language server running in the same process.
npm run start:example:server:json
```

##### Pyright Language Server

For the **python-client** example you need to ensure the **python-server** example is running:

```shell
# start the express server with the language server running as external node process.
npm run start:example:server:python
```

##### Groovy Language Server

For the **groovy-client** example you need to ensure the **groovy-server** example is running. There are two options available:

- **Preferred option**: Use **docker-compose** which does not require any manual setup (Java/Gradle). From the project root run `docker-compose -f ./packages/examples/resources/groovy/docker-compose.yml up -d`. First start up will take longer as the container is built. Use `docker-compose -f ./packages/examples/resources/groovy/docker-compose.yml down` to stop it.

- **Secondary option** (not recommended): [Groovy Language Server self-built instructions](./packages/examples/src/groovy/server/README.md)

### Verification Examples & Usage

None of the verification examples is part of the npm workspace. Some bring substantial amount of npm dependencies that pollute the main node_modules dependencies and therefore these examples need to be build and started independently. All verifaction examples re-uses the code form the json client example and therefore require the json server to be started.

- [angular verification example](./verify/angular): Before March 2024 this was located in [a separate repository](https://github.com/TypeFox/monaco-languageclient-ng-example). If you want to test it, Please do: `cd verify/angular && npm run verify`. It serves the client here: <http://localhost:4200>.

- [webpack verification example](./verify/webpack) demonstrates how bundling can be achieved with webpack. You find the configuration here: [webpack.config.js](./verify/webpack/webpack.config.js). Please do: `cd verify/webpack && npm run verify`. It serves the client here: <http://localhost:8081>.

- [vite verification example](./verify/vite) demonstrates how bundling can be achieved with vite. There is no configuration required Please do: `cd verify/vite && npm run verify`. It serves the client here: <http://localhost:8082>.

- [pnpm verification example](./verify/pnpm) demonstrates that the project can be build with vite, but pnpm is used instead of npm. Please do: `cd verify/pnpm && pnpm run verify`. It serves the client here: <http://localhost:8083>.

- [yarn verification example](./verify/yarn)demonstrates that the project can be build with vite, but yarn is used instead of npm. Please do: `cd verify/yarn && yarn run verify`. It serves the client here: <http://localhost:8083>.

### VSCode integration

You can as well run [vscode tasks](./.vscode/launch.json) to start and debug the server in different modes and the client.

## Featured projects

- JSONA Editor: [Showcase](https://jsona.github.io/editor/schema) ([GitHub](https://github.com/jsona/editor))
- Clangd in Browser: [Showcase](https://clangd.guyutongxue.site/) ([GitHub](https://github.com/Guyutongxue/clangd-in-browser))
- Langium minilogo using monaco-editor-wrapper: [Showcase](https://langium.org/showcase/minilogo/) ([GitHub](https://github.com/TypeFox/monaco-components))

## Troubleshooting

### General

Whenever you used `monaco-editor`, `vscode`, `monaco-languageclient`, `monaco-editor-wrapper` or `@typefox/monaco-editor-react` ensure they are imported before you do any `monaco-editor` or `vscode` api related intialization work or start using it. Please check the [our python language client example](./packages/examples/src/python/client/main.ts) to see how it should be done.

### Dependency issues: monaco-editor / @codingame/monaco-vscode-api / @codingame/monaco-vscode-editor-api

If you have mutiple, possibly hundreds of compile errors resulting from missing functions deep in `monaco-editor` or `vscode` then it is very likely your `package-lock.json` or `node_modules` are dirty. Remove both and do a fresh `npm install`. Always `npm list monaco-editor` is very useful. If you see different or errornous versions, then this is an indicator something is wrong.

### Volta

There are [Volta](https://volta.sh/) instructions in the `package.json` files. When you have Volta available it will ensure the exactly specified `node` and `npm` versions are used.

### Vite dev server troubleshooting

When you are using vite for development please be aware of [this recommendation](https://github.com/CodinGame/monaco-vscode-api#if-you-use-vite).

If you see the problem *Assertion failed (There is already an extension with this id)* you likely have mismatching dependencies defined for `vscode` / `@codingame/monaco-vscode-api`. You should fix this or add the following entry to your vite config:

```javascript
resolve: {
  dedupe: ['vscode']
}
```

### Serve all files required

 `@codingame/monaco-vscode-api` requires json and other files to be served. In your project's web-server configuration you have to ensure you don't prevent this.

### Bad Polyfills

#### buffer

If you see an error similar to the one below:

```yaml
Uncaught Error: Unexpected non—whitespace character after JSON at position 2

SyntaxError: Unexpected non—whitespace character after JSON at position 2
    at JSON. parse («anonymous>)
```

It is very likely you have an old version of `buffer` interfering (see [#538](https://github.com/TypeFox/monaco-languageclient/issues/538) and [#546](https://github.com/TypeFox/monaco-languageclient/issues/546)). You can enforce a current version by adding a `resolution` as shown below to your projects' `package.json`.

```yaml
"resolutions": {
  "buffer": "~6.0.3",
}
```

### monaco-editor and react

We recommend you now use `typefox/monaco-editor-react`.

But if you need to use `@monaco-editor/react`, then add the `monaco-editor` import at the top of your editor component file [source](https://github.com/suren-atoyan/monaco-react#use-monaco-editor-as-an-npm-package):

```javascript
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

loader.config({ monaco });
```

### pnpm

If you use pnpm, you have to add `vscode` / `@codingame/monaco-vscode-api` as direct dependency (you find the [compatibility table here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table), otherwise the installation will fail.

```json
"vscode": "npm:@codingame/monaco-vscode-api@~7.0.3"
```

## Licenses

- monaco-languageclient: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/LICENSE)
- vscode-ws-jsonrpc: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/LICENSE)
- monaco-editor-wrapper: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/LICENSE)
- @typefox/monaco-editor-react: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
- monaco-languageclient-examples: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/LICENSE)
