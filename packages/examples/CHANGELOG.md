# Changelog

All notable changes to this npm module are documented in this file.

## [2024.8.4] - 2024-08-26

- Updated to `monaco-languageclient@8.8.3`, `monaco-editor-wrapper@5.5.3` and `@typefox/monaco-editor-react@4.5.3`. Updated all `@codingame/monaco-vscode` packages to `8.0.4`.

## [2024.8.3] - 2024-08-21

- Updated to `monaco-languageclient@8.8.2`, `monaco-editor-wrapper@5.5.2` and `@typefox/monaco-editor-react@4.5.2`. Updated all `@codingame/monaco-vscode` packages to `8.0.2`.

## [2024.8.2] - 2024-08-12

- Updated to `monaco-languageclient@8.8.1`, `monaco-editor-wrapper@5.5.1` and `@typefox/monaco-editor-react@4.5.1`. Updated all `@codingame/monaco-vscode` packages to `8.0.1`.

## [2024.8.1] - 2024-08-08

- Update to monaco-vscode-api 8.0.0 [#722](https://github.com/TypeFox/monaco-languageclient/pull/722)
  - Updated to `monaco-languageclient@8.8.0`, `monaco-editor-wrapper@5.5.0` and `@typefox/monaco-editor-react@4.5.0`. Updated all `@codingame/monaco-vscode` packages to `8.0.0`.

## [2024.7.3] - 2024-07-16

- Update to latest monaco-vscode-api [#707](https://github.com/TypeFox/monaco-languageclient/pull/707)
  - Updated to `monaco-languageclient@8.7.0`, `monaco-editor-wrapper@5.4.0` and `@typefox/monaco-editor-react@4.4.0`. Updated all `@codingame/monaco-vscode` packages to `7.0.7`.
- Add Eclipse JDT Language Server example [#708](https://github.com/TypeFox/monaco-languageclient/pull/708)
  - Harmonize the Groovy Language Server configuration and execution, both are container based
- Updated all verification examples and checked they are properly working

## [2024.7.2] - 2024-07-02

- Updated to `monaco-editor-wrapper@5.3.1` and `@typefox/monaco-editor-react@4.3.2`.

## [2024.7.1] - 2024-07-02

- Updated to `@typefox/monaco-editor-react@4.3.1`.

## [2024.6.2] - 2024-06-29

- Update to latest monaco-vscode-api [#691](https://github.com/TypeFox/monaco-languageclient/pull/691)
  - Updated to `monaco-languageclient@8.6.0`, `monaco-editor-wrapper@5.3.0` and `@typefox/monaco-editor-react@4.3.0`. Updated all `@codingame/monaco-vscode` packages to `6.0.3`.

## [2024.6.1] - 2024-06-04

- Updated to `monaco-languageclient@8.5.0`, `vscode-ws-jsonrpc@3.3.2`, `monaco-editor-wrapper@5.2.0` and `@typefox/monaco-editor-react@4.2.0`. Updated all `@codingame/monaco-vscode` packages to `5.2.0`.
- Fix: Multiple Monaco editor issue [#666](https://github.com/TypeFox/monaco-languageclient/pull/666)

## [2024.5.17] - 2024-05-17

- All example now work with vite/rollup production build (lessons learned for me :-)
  - static site approach (relative files) does not work for `useWorkerFactory` in this scenario
- Apply independent version scheme
- Drop `utils/app-utils.ts`

## [8.4.2] - 2024-05-15

- Moved `localeLoader` to `monaco-editor-wrapper/vscode/locale`

## [8.4.1] - 2024-05-15

- Updated to `monaco-editor-wrapper@5.1.0` and `@typefox/monaco-editor-react@4.1.0`. Demostrate ConnectionProvider usage in `LangiumClientExtended`.

## [8.4.0] - 2024-05-15

- Updated to `monaco-languageclient@8.4.0`, `monaco-editor-wrapper@5.0.0` and `@typefox/monaco-editor-react@4.0.0`. Updated all `@codingame/monaco-vscode` packages to `5.1.1`.
- Aligned all examples to API changes
- Updated python examples to load text content from files
- Updated Langium Statemachine Example to supply a model instead of `codeResources`
- Clean-up / code re-organization:
  - Removed the need for `common/example-apps-common.ts`. The only two independent helper functions moved to `utils/app-utils.ts`
  - Moved all common node functions to sub-directory `common/node`.
  - Moved all common client functions to sub-directory `common/client`.

## [8.3.1] - 2024-04-17

- Added `@codingame/monaco-vscode-rollup-vsix-plugin` and make Langium example with extended editor use github themes
- Updated to `monaco-languageclient@8.3.1`, `monaco-editor-wrapper@4.2.1` and `@typefox/monaco-editor-react@3.2.1`. Updated all `@codingame/monaco-vscode` packages to `4.3.2`.

## [8.3.0] - 2024-04-12

- Updated to `monaco-languageclient@8.3.0`, `monaco-editor-wrapper@4.2.0` and `@typefox/monaco-editor-react@3.2.0`. Updated all `@codingame/monaco-vscode` packages to `4.2.1`.

## [8.2.0] - 2024-04-10

- Updated to `monaco-languageclient@8.2.0`, `monaco-editor-wrapper@4.1.0`, `@typefox/monaco-editor-react@3.1.0` and `vscode-ws-jsonrpc@3.1.1`. Updated all `@codingame/monaco-vscode` packages to `4.1.2`.

## [8.1.1] - 2023-04-03

- Updated to `monaco-languageclient@8.1.1`.

## [8.1.0] - 2024-03-22

- Single Editor TypeScript example now make used of extHostWorker
- Multiple editor TypeScript example now make use of `@codingame/monaco-vscode-standalone` packages

## [8.0.0] - 2024-03-18

- Repository now includes `monaco-editor-wrapper` and `@typefox/monaco-editor-react`
  - Unified examples. Make use of `monaco-editor-wrapper` or `@typefox/monaco-editor-react` in all client applications
- Aligned LICENSE usage throughout the repository
- Updated to `monaco-languageclient@8.0.0`, `vscode-ws-jsonrpc@3.3.0`, `monaco-editor-wrapper@4.0.0` and `@typefox/monaco-editor-react@3.0.0`
- feat: add LanguageServerRunConfig and groovy example [#591](https://github.com/TypeFox/monaco-languageclient/pull/591)

## [7.3.0] - 2023-01-04

- Updated to `monaco-languageclient@7.3.0`.

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
- Moved langium grammer language client and server to [monaco-components](https://github.com/TypeFox/monaco-components)

## [6.4.5] - 2023-08-30

- First release of the `monaco-languageclient-examples` package
