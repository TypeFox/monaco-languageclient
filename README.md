# Monaco Language Client, VSCode WebSocket Json RPC, Monaco Editor React and examples

[![Github Pages](https://img.shields.io/badge/GitHub-Pages-blue?logo=github)](https://typefox.github.io/monaco-languageclient)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
<br>
[![monaco-languageclient Version](https://img.shields.io/npm/v/monaco-languageclient?logo=npm&label=monaco-languageclient)](https://www.npmjs.com/package/monaco-languageclient)
[![monaco-languageclient Downloads](https://img.shields.io/npm/dt/monaco-languageclient)](https://www.npmjs.com/package/monaco-languageclient)
[![vscode-ws-jsonrpc Version](https://img.shields.io/npm/v/vscode-ws-jsonrpc?logo=npm&label=vscode-ws-jsonrpc)](https://www.npmjs.com/package/vscode-ws-jsonrpc)
[![vscode-ws-jsonrpc Downloads](https://img.shields.io/npm/dt/vscode-ws-jsonrpc)](https://www.npmjs.com/package/vscode-ws-jsonrpc)
[![monaco-editor-react Version](https://img.shields.io/npm/v/@typefox/monaco-editor-react?logo=npm&label=@typefox/monaco-editor-react)](https://www.npmjs.com/package/@typefox/monaco-editor-react)
[![monaco-editor-react Downloads](https://img.shields.io/npm/dt/@typefox/monaco-editor-react)](https://www.npmjs.com/package/@typefox/monaco-editor-react)

This repository now host multiple npm packages under one roof:

- [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient) to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).
- [vscode-ws-jsonrpc](https://www.npmjs.com/package/vscode-ws-jsonrpc) which implements communication between a jsonrpc client and server over WebSocket.
- [monaco-editor-react](https://www.npmjs.com/package/@typefox/monaco-editor-react) makes editor and languageclient available within a react component.
- [monaco-languageclient-examples](https://www.npmjs.com/package/monaco-languageclient-examples) provides the examples which allows to use them externally.

The examples not requiring a backend are now available [via GitHub Pages](https://typefox.github.io/monaco-languageclient).<br>

- [Monaco Language Client, VSCode WebSocket Json RPC, Monaco Editor React and examples](#monaco-language-client-vscode-websocket-json-rpc-monaco-editor-react-and-examples)
  - [Official Documentation](#official-documentation)
    - [Migration Guide](#migration-guide)
  - [Changelogs, current versions and compatibility table](#changelogs-current-versions-and-compatibility-table)
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
  - [Licenses](#licenses)

## Official Documentation

Since `monaco-languageclient` version 10 we started to build an [official documentation](./docs/index.md). This will be continuously extended.

### Migration Guide

We added a [migration guide](./docs/migration.md) with the release of `monaco-languageclient` version `10`.

## Changelogs, current versions and compatibility table

CHANGELOGs for each project are available from the linked location:

- CHANGELOG for `monaco-languageclient` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/CHANGELOG.md)
- CHANGELOG for `vscode-ws-jsonrpc` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/CHANGELOG.md)
- CHANGELOG for `@typefox/monaco-editor-react` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md)
- CHANGELOG for `monaco-languageclient-examples` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/CHANGELOG.md)

Important Project changes and notes about the project's history are found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#important-project-changes).

These are the current versions of packages from this repository and their alignment with **@codingame/monaco-vscode-api** **monaco-editor** and **vscode**:

- **monaco-languageclient**: `10.7.0` (release date: unreleased)
- **@typefox/monaco-editor-react**: `7.7.0` (release date: unreleased)
- Aligned with:
  - **@codingame/monaco-vscode-[editor]-api**: `25.0.1`
  - **vscode**: `1.108.1`
  - **monaco-editor**: `0.55.1`
- **vscode-ws-jsonrpc**: `3.5.0` (release date: 2025-08-11)

Check find the [full compatibility table](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) with all previous versions.

## Getting started

We recommend [mise-en-place](https://mise.jdx.dev/) to setup corrects version of required tools like `node` and `npm` (described [here](./docs/guides/troubleshooting.md#mise-en-place)). If you have `mise` installed use the optional isntruction below.

On your local machine you can prepare your dev environment as follows. At first it is advised to build everything. Locally, from a terminal do:

```bash
# clone the git repository
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
# optional: if you have mise installed
mise upgrade
# install npm dependencies
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
- Usage for `@typefox/monaco-editor-react` is found [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/README.md#usage)

## Examples Overview

The examples demonstrate mutliple things:

- How `monaco-languageclient` is use by `monaco-edtior-wrapper` or `@typefox/monaco-editor-react` to have an editor that is connected to a language server either running in the browser in a web worker or `vscode-ws-jsonrpc`. is used to an external process via web-socket.
- How different language servers can be intergrated in a common way, so they can communicate via web-socket to the front-end running in the browser.

### Main Examples

#### JSON Language client and language server example ([Location](./packages/examples/src/json))

The **json-server** runs an external Node.js [Express app](./packages/examples/src/json/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [JSON Language Server](#json-language-server)).
The **json-client using extended mode** as [editor app](./packages/examples/src/json/client/extended.ts) which connects to the language server and therefore requires the node server app to be run in parallel.
The **json-client using classic mode** as [editor app](./packages/examples/src/json/client/classic.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

#### Python Language client and pyright language server example ([Location](./packages/examples/src/python))

The **python-server** runs an external Node.js [Express app](./packages/examples/src/python/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application (see [Pyright Language Server](#pyright-language-server)).
The **python-client** contains the [editor app](./packages/examples/src/python/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.
   It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/python/client/reactPython.tsx) to connect to the server. Both versions now feature a debugger, see [here](#graalpy-debugger).

#### Groovy Language client and language server example ([Location](./packages/examples/src/groovy))

The **groovy-server** runs an external [Java app](./packages/examples/src/groovy/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application ([Groovy Language Server](#groovy-language-server)).
The **groovy-client** contains the [editor app](./packages/examples/src/groovy/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

#### Java Language client and language server example ([Location](./packages/examples/src/eclipse.jdt.ls))

The **java-server** runs an external [Java app](./packages/examples/src/eclipse.jdt.ls/server/main.ts) where web sockets are used to enable communication between the language server process and the client web application ([Java Language Server](#java-language-server)).
The **java-client** contains the [editor app](./packages/examples/src/eclipse.jdt.ls/client/main.ts) which connects to the language server and therefore requires the node server app to be run in parallel.

Langium examples (here client and server communicate via `vscode-languageserver-protocol/browser` instead of a web socket used in the three examples above

#### Cpp / Clangd ([Location](./packages/examples/src/clangd))

It contains both the [language client](./packages/examples/src/clangd/client/main.ts) and the [langauge server (web worker)](./packages/examples/src/clangd/worker/clangd-server.ts). The clangd language server is compiled to wasm so it can be executed in the browser. <b>Heads up:</b> This is a prototype and still evolving.

#### Application Playground ([Location](./packages/examples/src/appPlayground))

This [example](./packages/examples/src/appPlayground/launcher.ts) uses the view service provider from `@codingame/monaco-vscode-editor-api` to build an application that utilizes more vscode features. Alternatively, it is possible to use a [react version of the app](./packages/examples/src/appPlayground/reactLauncher.ts) <b>Heads up:</b> This is a prototype and still evolving.

#### Langium grammar DSL ([Location](./packages/examples/src/langium/langium-dsl))

It contains both the [language client](./packages/examples/src/langium/langium-dsl/wrapperLangium.ts) and the [langauge server (web worker)](./packages/examples/src/langium/langium-dsl/worker/langium-server.ts). Here you can chose beforehand if the wrapper should be started in classic or extended mode.

#### Statemachine DSL (created with Langium) ([Location](./packages/examples/src/langium/statemachine))

It contains both the [language client](./packages/examples/src/langium/statemachine/main.ts) and the [langauge server (web worker)](./packages/examples/src/langium/statemachine/worker/statemachine-server.ts).
It is also possible to use a [@typefox/monaco-editor-react app](./packages/examples/src/langium/statemachine/main-react.tsx) to connect to the server.

#### Browser example ([Location](./packages/examples/src/browser))

This demonstrates how an [editor app can be combined with a language service written in JavaScript](./packages/examples/src/browser/main.ts). This example can now be considered legacy as the web worker option eases client side language server implementation and separation, but it still shows a valid way to achieve the desired outcome.

#### Purely monaco-editor related examples

See [Typescript Language support](./packages/examples/src/ts/clientTs.ts).

#### Server processes

##### JSON Language Server

For all **json** client related examples you need to ensure the **json-server** example is running:

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

- [vite verification example](./verify/vite) demonstrates how bundling can be achieved with vite. There is no configuration required Please do: `cd verify/vite && npm run verify`. It serves the client here: <http://localhost:8081>.

- [webpack verification example](./verify/webpack) demonstrates how bundling can be achieved with webpack. You find the configuration here: [webpack.config.js](./verify/webpack/webpack.config.js). Please do: `cd verify/webpack && npm run verify`. It serves the client here: <http://localhost:8082>.

- [Next.js verification example](./verify/next): demonstrates how to use `@typefox/monaco-editor-react` with Next.js, Please do: `cd verify/next && npm run verify`. It serves the client here: <http://localhost:8083>.

- [Angular verification example](./verify/angular): If you want to test it, Please do: `cd verify/angular && npm run verify`. It serves the client here: <http://localhost:8084>. **Important**: `monaco-languageclient` currently does not support the angular build as it breaks the development and produstion build. We therefore use `@analogjs/vite-plugin-angular` which relies on vite.

### VSCode integration

You can as well run [vscode tasks](./.vscode/launch.json) to start and debug the server in different modes and the client.

## Featured projects

- JSONA Editor: [Showcase](https://jsona.github.io/editor/schema) ([GitHub](https://github.com/jsona/editor))
- Clangd in Browser: [Showcase](https://clangd.guyutongxue.site/) ([GitHub](https://github.com/Guyutongxue/clangd-in-browser))
- Langium minilogo using monaco-editor-wrapper: [Showcase](https://langium.org/showcase/minilogo/) ([GitHub](https://github.com/TypeFox/monaco-components))

## Troubleshooting

For troubleshooting, please also see the [Troubleshooting Guide](./docs/guides/troubleshooting.md).

## Licenses

- monaco-languageclient: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/LICENSE)
- vscode-ws-jsonrpc: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/vscode-ws-jsonrpc/LICENSE)
- @typefox/monaco-editor-react: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
- monaco-languageclient-examples: [MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/LICENSE)
