# Monaco Language Client Examples

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient-examples.svg)](https://www.npmjs.com/package/monaco-languageclient-examples)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient-examples.svg)](https://www.npmjs.com/package/monaco-languageclient-examples)

This package contains [all examples from the monaco-languageclient repository](https://github.com/TypeFox/monaco-languageclient/blob/main/README.md#examples).

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/CHANGELOG.md).

## Getting Started

This npm package is part of the <https://github.com/TypeFox/monaco-languageclient> monorepo. Please follow the main repository's [instructions](https://github.com/TypeFox/monaco-languageclient#getting-started) to get started with local development.

## Usage

The examples are normally run from the repository root. Install dependencies, build the workspace, download the resources required by some examples, and start the Vite development server:

```shell
npm install
npm run build
npm run init:examples
npm run dev
```

Open <http://localhost:20001/index.html> and select an example. The available browser examples include JSON, Python, Groovy, Java, Clangd, Langium, Statemachine, the application playground, and the browser language-service example.

The package also provides scripts for starting the server-backed examples directly:

```shell
npm run start:server:json
npm run start:server:python
npm run start:server:groovy
npm run start:server:jdtls
```

The compiled package exposes the example entry points `monaco-languageclient-examples`, `monaco-languageclient-examples/node`, `monaco-languageclient-examples/json-client`, `monaco-languageclient-examples/python-client`, `monaco-languageclient-examples/worker/langium`, and `monaco-languageclient-examples/worker/statemachine`.

See the repository's [Examples Overview](https://github.com/TypeFox/monaco-languageclient#examples-overview) for details about each example and its server requirements.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/LICENSE)
