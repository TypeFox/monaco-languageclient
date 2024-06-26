# CHANGELOG

All notable changes to npm module [@typefox/monaco-editor-react](https://www.npmjs.com/package/@typefox/monaco-editor-react) are documented in this file.

## [4.3.0] - 2024-06-2x

- Updated to `monaco-editor-wrapper@5.3.0`, `monaco-languageclient@8.6.0` and version `6.0.3` of `@codingame/monaco-vscode` packages

## [4.2.0] - 2024-06-04

- Updated to `monaco-editor-wrapper@5.2.0`, `monaco-languageclient@8.5.0` and version `5.2.0` of `@codingame/monaco-vscode` packages
- Wrapper: Make codeResources and useDiffEditor optional in EditorAppConfig [#670](https://github.com/TypeFox/monaco-languageclient/pull/670)
  - Additional code adjustments to eslint rule expansion
- chore: localeLoader: allow manually select which locale to load [#669](https://github.com/TypeFox/monaco-languageclient/pull/669)

## [4.1.2] - 2024-05-17

- Updated to `monaco-editor-wrapper@5.1.2`

## [4.1.1] - 2024-05-15

- Updated to `monaco-editor-wrapper@5.1.1`

## [4.1.0] - 2024-05-15

- Updated to `monaco-editor-wrapper@5.1.0`
- Feature: If present `connectionProvider` from the languageclient section in the `UserConfig` is now driving the MessageTransports configuration. Previously the MessageTransports were always created indepently leading to inconsistent configuration of the `LanguageClientWrapper`.

## [4.0.0] - 2024-05-15

- BREAKING:
  - All `UserConfig` changes from `monaco-editor-wrapper@5.0.0`
  - `onTextChanged` now expects an object and contains main plus original texts
- Updated to `monaco-editor-wrapper@5.0.0`, `monaco-languageclient@8.4.0` and version `5.1.1` of `@codingame/monaco-vscode` packages
- Remove the main bundle from the package. One should do this at application level.

## [3.2.1] - 2024-04-17

- Updated to `monaco-editor-wrapper@4.2.1`, `monaco-languageclient@8.3.1` and version `4.3.2` of `@codingame/monaco-vscode` packages

## [3.2.0] - 2024-04-12

- Updated to `monaco-editor-wrapper@4.2.0`, `monaco-languageclient@8.3.0` and version `4.2.1` of `@codingame/monaco-vscode` packages
- @typefox/monaco-editor-react works in strict mode [#634](https://github.com/TypeFox/monaco-languageclient/pull/634)
- Using own `Logger` instance where implementation is provided by `monaco-languageclient`

## [3.1.0] - 2024-04-10

- Updated to `monaco-editor-wrapper@4.1.0`
- [MonacoEditorReactComp] onLoad() should expose editor refrence [#612](https://github.com/TypeFox/monaco-languageclient/issues/612)

## [3.0.2] - 2024-04-03

- Updated to `monaco-editor-wrapper@4.0.2`

## [3.0.1] - 2024-03-22

- Updated to `monaco-editor-wrapper@4.0.1`

## [3.0.0] - 2024-03-18

- Moved code to [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) repository.
- Vite & monaco-editor-workers [monaco-components #67](https://github.com/TypeFox/monaco-components/issues/67)
- Selective applicance of wrappers css [monaco-components #65](https://github.com/TypeFox/monaco-components/issues/65)
- Having the component twice on a page [monaco-components #64](https://github.com/TypeFox/monaco-components/issues/64)
- [Monaco Editor React Component] unavailable language server throws unhandled error [monaco-components #62](https://github.com/TypeFox/monaco-components/issues/62)

## [2.6.0] - 2024-01-04

- Updated to `monaco-editor-wrapper` `3.6.0`

## [2.5.0] - 2023-12-07

- Updated to `monaco-editor-wrapper` `3.5.0`

## [2.4.0] - 2023-11-27

- Updated to `monaco-editor-wrapper` `3.4.0`
- Make subclassing MonacoEditorReactComp more easy [#58](https://github.com/TypeFox/monaco-components/issues/58)
- Allow to init and start separately [#59](https://github.com/TypeFox/monaco-components/issues/59)

## [2.3.0] - 2023-10-17

- Properly separate and define classic and extended editor [#54](https://github.com/TypeFox/monaco-components/pull/54)
  - Renamed `EditorAppVscodeApi` to `EditorAppExtended` and `EditorAppConfigVscodeApi` to `EditorAppConfigExtended`
  - BREAKING: `$type` of `EditorAppConfigExtended` was changed from `vscodeApi` to `extended`
- Updated to `monaco-editor-wrapper` `3.3.0`
- Include all direct dependencies that the code uses in the `package.json`.

## [2.2.5] - 2023-10-13

- Updated to `monaco-editor-wrapper` `3.2.5`

## [2.2.4] - 2023-10-05

- Updated to `monaco-editor-wrapper` `3.2.4`

## [2.2.3] - 2023-10-04

- Updated to `monaco-editor-wrapper` `3.2.3`

## [2.2.2] - 2023-10-04

- Updated to `monaco-editor-wrapper` `3.2.2`

## [2.2.1] - 2023-09-29

- Updated to `monaco-editor-wrapper` `3.2.1`

## [2.2.0] - 2023-09-29

- Updated to `monaco-editor-wrapper` `3.2.0`
- htmlElement is no longer part of UserConfig. Must be passed at start [#51](https://github.com/TypeFox/monaco-components/pull/51)
  - The HTMLElement it is no longer part of the UserConfig. The component just uses its root.

## [2.1.0] - 2023-09-21

- Improve configuration change detection [#47](https://github.com/TypeFox/monaco-components/pull/47)
- semantic highlighting works with classic editor [#45](https://github.com/TypeFox/monaco-components/pull/45)
- Updated to `monaco-editor-wrapper` `3.1.0`

## [2.0.1] - 2023-09-07

- Updated to `monaco-editor-wrapper` `3.0.1`

## [2.0.0] - 2023-08-31

- Updated to `monaco-editor-wrapper` `3.0.0`
- Removed `onLoading` as the current implemetation made no difference to `onLoad`

## [1.1.1] - 2023-07-27

- Updated to `monaco-editor-wrapper` `2.1.1`

## [1.1.0] - 2023-06-16

- Make worker handling more flexible [#27](https://github.com/TypeFox/monaco-components/pull/27)
- Updated to `monaco-editor-wrapper` `2.1.0`

## [1.0.1] - 2023-06-12

- Updated to `monaco-editor-wrapper` `2.0.1` using `monaco-languageclient` `6.1.0` / `monaco-vscode-api` `1.79.1` and `monaco-editor` `0.38.0`

## [1.0.0] - 2023-06-02

- Initial release
- React component that easily allows to use `monaco-editor-wrapper` and all its underlying features within the react world
