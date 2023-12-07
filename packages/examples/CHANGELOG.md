# Changelog

All notable changes to this npm module are documented in this file.

## [7.2.0] - 2023-12-07

- Updated to `monaco-languageclient@7.2.0`.
- Volta now uses Node 20 (current LTS).

## [7.1.0] - 2023-11-27

- Updated to `monaco-languageclient@7.1.0` and aligned the usage of the configuration service to `monaco-vscode-api@1.83.12`.
  - BREAKING: If you want to use `getConfigurationServiceOverride` you need to provide a `workspaceConfig` along the `userServices` in `initServices`.

## [7.0.2] - 2023-11-15

- Updated to `monaco-languageclient@7.0.2`.

## [7.0.1] - 2023-11-10

- Updated to `monaco-languageclient@7.0.1`. Statemachine example uses init multiple times.

## [7.0.0] - 2023-11-02

- Updated to `monaco-languageclient@7.0.0` and `vscode-ws-jsonrpc@3.1.0`
- **BREAKING:** Changed the treemending approach Package `@codingame/monaco-editor-treemended` is used instead of `monaco-editor`. Please see the [following explanation](https://github.com/TypeFox/monaco-languageclient/blob/main/README.md#new-with-v7-treemended-monaco-editor)

## [6.6.1] - 2023-10-20

- Updated to `monaco-languageclient@6.6.1`
- Allows to run the Statemachine example in four different languages.

## [6.6.0] - 2023-10-16

- Updated to `monaco-languageclient@6.6.0`

## [6.5.3] - 2023-10-11

- Updated to `monaco-languageclient@6.5.3`
- Unify python and json language server. Extract common function.

## [6.5.2] - 2023-10-07

- Updated to `monaco-languageclient@6.5.2`

## [6.5.1] - 2023-10-04

- Updated to `monaco-languageclient@6.5.1`

## [6.5.0] - 2023-09-29

- Now use `userServices` for service initialization (alignment with `@codingame/monaco-vscode-api@1.82.x`)

## [6.4.6] - 2023-09-05

- Move examples from `packages/examples/main` to `packages/examples`
- Moved langium grammer langugae client and server to [monaco-components](https://github.com/TypeFox/monaco-components)

## [6.4.5] - 2023-08-30

- First release of the `monaco-languageclient-examples` package
