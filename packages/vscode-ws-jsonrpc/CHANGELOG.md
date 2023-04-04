# Changelog

All notable changes to this npm module are documented in this file.

## [3.0.0] - 2023-04-04

- **BREAKING CHANGE**: Do not reexport code of imported libraries (e.g. vscode-languageclient) #[459](https://github.com/TypeFox/monaco-languageclient/pull/459)
  - Content of `vscode-jsonrpc` is no longer re-exported

## [2.0.2] - 2022-01-24

- Gracefully handle JSON.parse errors #[455](https://github.com/TypeFox/monaco-languageclient/pull/455)

## [2.0.1] - 2022-12-01

- Changed the compile target and module to ES2022. Applied linting. Code was functionally not changed.

## [2.0.0] - 2022-09-08

- **BREAKING**: Transform to package of type module and switch to TypeScript ECMAScript Module Support in Node.js.
- **BREAKING**: All cjs exports have been removed.
- - Added verification examples for webpack and vite that shall ensure the libs work in dependent projects and the give you an idea how to use `monaco-languageclient` and `vscode-ws-jsonrpc` with common bundlers.
- Revised all READMEs

## 1.x.x BREAKING CHANGES

The default export now provides esm code. If you require CommonJS modules you can use the additional exports.
The npm packages exports the following:

- `vscode-ws-jsonrpc`
- `vscode-ws-jsonrpc/server`
- `vscode-ws-jsonrpc/socket`
- `vscode-ws-jsonrpc/cjs`
- `vscode-ws-jsonrpc/cjs/server`
- `vscode-ws-jsonrpc/cjs/socket`

## [1.0.2] - 2022-07-21

- Update `vscode-jsonrpc` to `8.0.2`
- Updated `vite` to `3.0.2`

## [1.0.1] - 2022-06-22

- Library ships as src, esm and cjs builds. Use `typesVersions` in **package.json** for proper TypeScript import support

## [1.0.0] - 2022-06-21

- Merged npm packages `@codingame/monaco-jsonrpc` and `vscode-ws-jsonrpc` into this package.
- Integrate eslint with eslint-config-standard #[385](https://github.com/TypeFox/monaco-languageclient/pull/385)

There was no CHANGELOG available in the previous repositories.
