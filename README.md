# Monaco Language Client, VSCode WebSocket Json RPC, Monaco-Editor-Wrapper, Monaco-Editor-React and examples

[![Github Pages](https://img.shields.io/badge/GitHub-Pages-blue?logo=github)](https://typefox.github.io/monaco-languageclient)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
<br>
[![monaco-languageclient Version](https://img.shields.io/npm/v/monaco-languageclient?logo=npm&label=monaco-languageclient)](https://www.npmjs.com/package/monaco-languageclient)
[![monaco-languageclient Downloads](https://img.shields.io/npm/dt/monaco-languageclient)](https://www.npmjs.com/package/monaco-languageclient)
[![vscode-ws-jsonrpc Version](https://img.shields.io/npm/v/vscode-ws-jsonrpc?logo=npm&label=vscode-ws-jsonrpc)](https://www.npmjs.com/package/vscode-ws-jsonrpc)
[![vscode-ws-jsonrpc Downloads](https://img.shields.io/npm/dt/vscode-ws-jsonrpc)](https://www.npmjs.com/package/vscode-ws-jsonrpc)
[![monaco-editor-wrapper Version](https://img.shields.io/npm/v/monaco-editor-wrapper?logo=npm&label=monaco-editor-wrapper)](https://www.npmjs.com/package/monaco-editor-wrapper)
[![monaco-editor-wrapper Downloads](https://img.shields.io/npm/dt/monaco-editor-wrapper)](https://www.npmjs.com/package/monaco-editor-wrapper)
[![monaco-editor-react Version](https://img.shields.io/npm/v/@typefox/monaco-editor-react?logo=npm&label=@typefox/monaco-editor-react)](https://www.npmjs.com/package/@typefox/monaco-editor-react)
[![monaco-editor-react Downloads](https://img.shields.io/npm/dt/@typefox/monaco-editor-react)](https://www.npmjs.com/package/@typefox/monaco-editor-react)

This repository now host multiple npm packages under one roof:

- [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).
- [vscode-ws-jsonrpc](https://www.npmjs.com/package/vscode-ws-jsonrpc) which implements communication between a jsonrpc client and server over WebSocket.
- [monaco-editor-wrapper](https://www.npmjs.com/package/monaco-editor-wrapper) for building monaco editor application driven by configuration
- [monaco-editor-react](https://www.npmjs.com/package/@typefox/monaco-editor-react) puts a react cloack over `monaco-editor-wrapper`
- [monaco-languageclient-examples](https://www.npmjs.com/package/monaco-languageclient-examples) provides the examples which allows to use them externally.

The examples not requiring a backend are now available [via GitHub Pages](https://typefox.github.io/monaco-languageclient).<br>

- [Monaco Language Client, VSCode WebSocket Json RPC, Monaco-Editor-Wrapper, Monaco-Editor-React and examples](#monaco-language-client-vscode-websocket-json-rpc-monaco-editor-wrapper-monaco-editor-react-and-examples)
  - [Changelogs, project history and compatibility](#changelogs-project-history-and-compatibility)
  - [Getting started](#getting-started)
    - [Vite dev server](#vite-dev-server)
  - [Usage](#usage)
  - [Examples Overview](#examples-overview)
    - [Main Examples](#main-examples)
      - [JSON Language client and language server example (Location)](#json-language-client-and-language-server-example-location)
      - [Python Language client and pyright language server example (Location)](#python-language-client-and-pyright-language-server-example-location)
      - [Groovy Language client and language server example (Location)](#groovy-language-client-and-language-server-example-location)
      - [Java Language client and language server example (Location)](#java-language-client-and-language-server-example-location)
      - [Cpp / Clangd (Location)](#cpp--clangd-location)
      - [Application Playground (Location)](#application-playground-location)
      - [Langium grammar DSL (Location)](#langium-grammar-dsl-location)
      - [Statemachine DSL (created with Langium) (Location)](#statemachine-dsl-created-with-langium-location)
      - [bare monaco-languageclient (Location)](#bare-monaco-languageclient-location)
      - [Browser example (Location)](#browser-example-location)
      - [Purely monaco-editor related examples](#purely-monaco-editor-related-examples)
      - [Server processes](#server-processes)
        - [JSON Language Server](#json-language-server)
        - [Pyright Language Server](#pyright-language-server)
        - [Graalpy Debugger](#graalpy-debugger)
        - [Groovy Language Server](#groovy-language-server)
        - [Java Language Server](#java-language-server)
    - [Verification Examples \& Usage](#verification-examples--usage)
    - [VSCode integration](#vscode-integration)
  - [Featured projects](#featured-projects)
  - [Troubleshooting](#troubleshooting)
    - [General](#general)
    - [@codingame/monaco-vscode-editor-api / monaco-editor usage](#codingamemonaco-vscode-editor-api--monaco-editor-usage)
    - [Dependency issues: monaco-editor / @codingame/monaco-vscode-api / @codingame/monaco-vscode-editor-api](#dependency-issues-monaco-editor--codingamemonaco-vscode-api--codingamemonaco-vscode-editor-api)
    - [Volta](#volta)
    - [Vite dev server troubleshooting](#vite-dev-server-troubleshooting)
    - [SSR frameworks](#ssr-frameworks)
    - [Serve all files required](#serve-all-files-required)
    - [Bad Polyfills](#bad-polyfills)
      - [buffer](#buffer)
    - [monaco-editor and react](#monaco-editor-and-react)
    - [webpack worker issues](#webpack-worker-issues)
  - [Licenses](#licenses)

## Changelogs, project history and compatibility

CHANGELOGs for each project are available from the linked location:

- CHANGELOG for `monaco-languageclient` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/CHANGELOG.md)
- CHANGELOG for `vscode-ws-jsonrpc` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/CHANGELOG.md)
- CHANGELOG for `monaco-editor-wrapper` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/CHANGELOG.md)
- CHANGELOG for `@typefox/monaco-editor-react` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md)
- CHANGELOG for `monaco-languageclient-examples` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/CHANGELOG.md)

Important Project changes and notes about the project's history are found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#important-project-changes).

These are the current versions of packages from this repository and their alignment with **@codingame/monaco-vscode-api** **monaco-editor** and **vscode**:

- **monaco-languageclient**: `9.9.0` (release date: 2025-08-11)
- **monaco-editor-wrapper**: `6.10.0` (release date: 2025-08-11)
- **@typefox/monaco-editor-react**: `6.10.0` (release date: 2025-08-11)
- Aligned with:
  - **@codingame/monaco-vscode-[editor]-api**: `19.1.4`
  - **vscode**: `1.102.3`
  - **monaco-editor**: `0.52.2`
- **vscode-ws-jsonrpc**: `3.5.0` (release date: 2025-08-11)

You find the full compatibility table with all previous versions [here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table).

[This article](https://www.typefox.io/blog/teaching-the-language-server-protocol-to-microsofts-monaco-editor/) describes the initial motivation for starting monaco-languageclient.

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

#### JSON Language client and language server example ([Location](./packages/examples/src/json))

The **json-server** runs an external Node.js [Express app](./packages/examples/src/json/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [JSON Language Server](#json-language-server)).
The **json-client** contains the [monaco-editor-wrapper app](./packages/examples/src/json/client/wrapperWs.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

#### Python Language client and pyright language server example ([Location](./packages/examples/src/python))

The **python-server** runs an external Node.js [Express app](./packages/examples/src/python/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [Pyright Language Server](#pyright-language-server)).
The **python-client** contains the [monaco-editor-wrapper app](./packages/examples/src/python/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.
   It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/python/client/reactPython.tsx) to connect to the server. Both versions now feature a debugger, see [here](#graalpy-debugger).

#### Groovy Language client and language server example ([Location](./packages/examples/src/groovy))

The **groovy-server** runs an external [Java app](./packages/examples/src/groovy/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application ([Groovy Language Server](#groovy-language-server)).
The **groovy-client** contains the [monaco-editor-wrapper app](./packages/examples/src/groovy/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

#### Java Language client and language server example ([Location](./packages/examples/src/eclipse.jdt.ls))

The **java-server** runs an external [Java app](./packages/examples/src/eclipse.jdt.ls/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application ([Java Language Server](#java-language-server)).
The **java-client** contains the [monaco-editor-wrapper app](./packages/examples/src/eclipse.jdt.ls/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

Langium examples (here client and server communicate via `vscode-languageserver-protocol/browser` instead of a web socket used in the three examples above

#### Cpp / Clangd ([Location](./packages/examples/src/clangd))

It contains both the [language client](./packages/examples/src/clangd/client/main.ts) and the [langauge server (web worker)](./packages/examples/src/clangd/worker/clangd-server.ts). The clangd language server is compiled to wasm so it can be executed in the browser. <b>Heads up:</b> This is a prototype and still evolving.

#### Application Playground ([Location](./packages/examples/src/appPlayground))

This [example](./packages/examples/src/appPlayground/main.ts) uses the view service provider from `@codingame/monaco-vscode-editor-api` to build an application that utilizes more vscode features. <b>Heads up:</b> This is a prototype and still evolving.

#### Langium grammar DSL ([Location](./packages/examples/src/langium/langium-dsl))

It contains both the [language client](./packages/examples/src/langium/langium-dsl/wrapperLangium.ts) and the [langauge server (web worker)](./packages/examples/src/langium/langium-dsl/worker/langium-server.ts). Here you can chose beforehand if the wrapper should be started in classic or extended mode.

#### Statemachine DSL (created with Langium) ([Location](./packages/examples/src/langium/statemachine))

It contains both the [language client](./packages/examples/src/langium/statemachine/main.ts) and the [langauge server (web worker)](./packages/examples/src/langium/statemachine/worker/statemachine-server.ts).
It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/langium/statemachine/main-react.tsx) to connect to the server.

#### bare monaco-languageclient ([Location](./packages/examples/src/bare))

It demostrate how the `JSON Language client and language server example` can be realised without `monaco-editor-wrapper`. You find the implementation [here](./packages/examples/src/bare/client.ts).

#### Browser example ([Location](./packages/examples/src/browser))

It demonstrates how a [monaco-editor-wrapper can be combined with a language service written in JavaScript](./packages/examples/src/browser/main.ts). This example can now be considered legacy as the web worker option eases client side language server implementation and separation, but it still shows a valid way to achieve the desired outcome.

#### Purely monaco-editor related examples

See [Typescript Language support](./packages/examples/src/ts/wrapperTs.ts).

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

##### Graalpy Debugger

If you want to use the debugger in the **python-client** example you need to the debugger is running. You require **docker-compose** to run it. From the project root run `docker-compose -f ./packages/examples/resources/debugger/docker-compose.yml up -d`. First start up will take longer as the container is downloaded from GitHub's container registry. Use `docker-compose -f ./packages/examples/resources/debugger/docker-compose.yml down` to stop it.

##### Groovy Language Server

For the **groovy-client** example you need to ensure the **groovy-server** example is running. You require **docker-compose** which does not require any manual setup (OpenJDK / Gradle). From the project root run `docker-compose -f ./packages/examples/resources/groovy/docker-compose.yml up -d`. First start up will take longer as the container is downloaded from GitHub's container registry. Use `docker-compose -f ./packages/examples/resources/groovy/docker-compose.yml down` to stop it.

##### Java Language Server

For the **java-client** example you need to ensure the **java-server** example is running. You require **docker-compose** which does not require any manual setup (OpenJDK / Eclipse JDT LS). From the project root run `docker-compose -f ./packages/examples/resources/eclipse.jdt.ls/docker-compose.yml up -d`. First start up will take longer as the container is downloaded from GitHub's container registry. Use `docker-compose -f ./packages/examples/resources/eclipse.jdt.ls/docker-compose.yml down` to stop it.

### Verification Examples & Usage

None of the verification examples is part of the npm workspace. Some bring substantial amount of npm dependencies that pollute the main node_modules dependencies and therefore these examples need to be build and started independently. All verifaction examples re-uses the code form the json client example and therefore require the json server to be started.

- [Angular verification example](./verify/angular): Before March 2024 this was located in [a separate repository](https://github.com/TypeFox/monaco-languageclient-ng-example). If you want to test it, Please do: `cd verify/angular && npm run verify`. It serves the client here: <http://localhost:4200>.

- [Next.js verification example](./verify/next): demonstrates how to use `@typefox/monaco-editor-react` with Next.js, Please do: `cd verify/next && npm run verify`. It serves the client here: <http://localhost:8081>.

- [webpack verification example](./verify/webpack) demonstrates how bundling can be achieved with webpack. You find the configuration here: [webpack.config.js](./verify/webpack/webpack.config.js). Please do: `cd verify/webpack && npm run verify`. It serves the client here: <http://localhost:8082>.

- [vite verification example](./verify/vite) demonstrates how bundling can be achieved with vite. There is no configuration required Please do: `cd verify/vite && npm run verify`. It serves the client here: <http://localhost:8083>.

### VSCode integration

You can as well run [vscode tasks](./.vscode/launch.json) to start and debug the server in different modes and the client.

## Featured projects

- JSONA Editor: [Showcase](https://jsona.github.io/editor/schema) ([GitHub](https://github.com/jsona/editor))
- Clangd in Browser: [Showcase](https://clangd.guyutongxue.site/) ([GitHub](https://github.com/Guyutongxue/clangd-in-browser))
- Langium minilogo using monaco-editor-wrapper: [Showcase](https://langium.org/showcase/minilogo/) ([GitHub](https://github.com/TypeFox/monaco-components))

## Troubleshooting

### General

Whenever you used `monaco-editor`/`@codingame/monaco-vscode-editor-api` `vscode`/`@codingame/monaco-vscode-extension-api`, `monaco-languageclient`, `monaco-editor-wrapper` or `@typefox/monaco-editor-react` ensure they are imported before you do any `monaco-editor` or `vscode` api related intialization work or start using it.

If you use pnpm or yarn, you have to add `vscode` / `@codingame/monaco-vscode-api` as direct dependency, otherwise the installation will fail:

```json
"vscode": "npm:@codingame/monaco-vscode-extension-api@~19.1.4"
```

### @codingame/monaco-vscode-editor-api / monaco-editor usage

When you use the libraries from this project you are no longer are required to proxy `monaco-editor` like `"monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~19.1.4"` in you `package.json`. You can directly use it like this:

```js
import * as monaco from '@codingame/monaco-vscode-editor-api';
```

If your dependency stack already contains a reference `monaco-editor` you must enforce the correct reference to `@codingame/monaco-vscode-editor-api` or you will have problems with mismatching code. Use`overrides` (npm/pnpm) or `resolutions` (yarn) to do so:

```json
"overrides": {
  "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~19.1.4"
}
```

### Dependency issues: monaco-editor / @codingame/monaco-vscode-api / @codingame/monaco-vscode-editor-api

If you have mutiple, possibly hundreds of compile errors resulting from missing functions deep in `monaco-editor` or `vscode` then it is very likely you have a mismatching dependency definition somewhere in your dependency definitions:

1. Use `npm list @codingame/monaco-vscode-api` to see if there are two different versions are listed in the dependency tree.
2. If you see a message in the browser console starting with `Another version of monaco-vscode-api has already been loaded. Trying to load` then definetly a version mismatch was detected by `@codingame/monaco-vscode-api`. This error is reported since v14.

If one of the two is true, fix you dependencies, remove `package-lock.json` and `node_modules` and perform a fresh `npm install`.

### Volta

There are [Volta](https://volta.sh/) instructions in the `package.json` files. When you have Volta available it will ensure the exactly specified `node` and `npm` versions are used.

### Vite dev server troubleshooting

When you are using the vite dev server there are some issues with imports, please [read this recommendation](https://github.com/CodinGame/monaco-vscode-api/wiki/Troubleshooting#if-you-use-vite).

If you see the problem *Assertion failed (There is already an extension with this id)* you likely have mismatching dependencies defined for `vscode` / `@codingame/monaco-vscode-extension-api`. You should fix this or add the following entry to your vite config:

```javascript
resolve: {
  dedupe: ['vscode']
}
```

### SSR frameworks

**Important:** Due to its reliance on `@codingame/monaco-vscode-api` this stack will not directly work with Server-Side Rendering (SSR) frameworks like Next.js. They client code has to be run in a browser environment. Take a look at the [Next.js verification example](./verify/next) to see how to dynamically load the code.

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

### webpack worker issues

When webpack is used as bundler there are issues with utilizing the undbundled workers from `@codingame/monaco-vscode-api`. [jhk-mjolner](https://github.com/jhk-mjolner) provided a solution in the context of issue #853 [here](https://github.com/TypeFox/monaco-languageclient/issues/853#issuecomment-2709959822):

1. Npm install `webpack-cli` (or webpack will do it for you when you try running this later).
2. Create a `bundle-monaco-workers.js` file with this content:

    ```js
    // solve: __dirname is not defined in ES module scope
    import { fileURLToPath } from 'url';
    import { dirname, resolve } from 'path';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    export default {
      entry: {
        editor: './node_modules/@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js',
        textmate: './node_modules/@codingame/monaco-vscode-textmate-service-override/worker.js'
      },
      output: {
        filename: '[name].js',
        path: resolve(__dirname, './src/assets/monaco-workers'),
        // if this is true (default), webpack will produce code trying to access global `document` variable for the textmate worker, which will fail at runtime due to being a worker
        chunkLoading: false
      },
      mode: 'production',
      performance: {
        hints: false
      }
    };
    ```

3. Add this line to your `packages.json` scripts section: `"bundle monaco workers": "webpack --config bundle-monaco-workers.js"`
4. Run the script `npm run 'bundle monaco workers'`
5. Configure the `workerLoaders` parameter for `useWorkerFactory` to point to the pre-bundled workers:

    ```js
    'TextEditorWorker': () => new Worker('/assets/monaco-workers/editor.js', {type: 'module'}),
    'TextMateWorker': () => new Worker('/assets/monaco-workers/textmate.js', {type: 'module'}),
    ```

6. Enable `editor.experimental.asyncTokenization` in the monaco-wrapper config, if you want to use the textmate worker.

## Licenses

- monaco-languageclient: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/LICENSE)
- vscode-ws-jsonrpc: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/LICENSE)
- monaco-editor-wrapper: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/LICENSE)
- @typefox/monaco-editor-react: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
- monaco-languageclient-examples: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/LICENSE)
