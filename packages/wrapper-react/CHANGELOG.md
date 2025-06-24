# CHANGELOG

All notable changes to npm module [@typefox/monaco-editor-react](https://www.npmjs.com/package/@typefox/monaco-editor-react) are documented in this file.

## [6.9.0] - 2025-06-24

- Updated to `monaco-languageclient@9.8.0` and `monaco-editor-wrapper@6.9.0`.
- Updated all `@codingame/monaco-vscode` packages to `18.1.0`.

## [6.8.1] - 2025-06-17

- Updated to `monaco-languageclient@9.7.1` and `monaco-editor-wrapper@6.8.1`.
- Updated all `@codingame/monaco-vscode` packages to `17.2.1`.

## [6.8.0] - 2025-05-25

- Updated to `monaco-languageclient@9.7.0` and `monaco-editor-wrapper@6.8.0`.
- Updated all `@codingame/monaco-vscode` packages to `17.1.2`.

## [6.7.0] - 2025-05-06

- Updated to `monaco-languageclient@9.6.0` and `monaco-editor-wrapper@6.7.0`.
- Update monaco-editor-react README for WorkFactory Usage [#914](https://github.com/TypeFox/monaco-languageclient/pull/914)
- Update complete uri and model handling in EditorApp [#904](https://github.com/TypeFox/monaco-languageclient/pull/904)

## [6.6.0] - 2025-03-13

- Model handling improvements [#891](https://github.com/TypeFox/monaco-languageclient/pull/891)
  - Updated to `monaco-languageclient@9.5.0` and `monaco-editor-wrapper@6.6.0`.
  - Updated all `@codingame/monaco-vscode` packages to `15.0.2`.

## [6.5.0] - 2025-03-06

- Update dependencies, fix tests, language clients config changes [#889](https://github.com/TypeFox/monaco-languageclient/pull/889)
- fix: old monaco editor instance is not destroyed before a new one init [#873](https://github.com/TypeFox/monaco-languageclient/pull/873)
- Updated all `@codingame/monaco-vscode` packages to `14.0.6`.
- Updated to `monaco-languageclient@9.4.1` and `monaco-editor-wrapper@6.5.0`.

## [6.4.0] - 2025-02-18

- refactor: replace all useEffect and useCallback with one useEffect [#862](https://github.com/TypeFox/monaco-languageclient/pull/862)
- Handle languageclient errors cases more robustly [#859](https://github.com/TypeFox/monaco-languageclient/pull/859)
- Updated to `monaco-languageclient@9.4.0` and `monaco-editor-wrapper@6.4.0`.
- Updated all `@codingame/monaco-vscode` packages to `14.0.4`.

## [6.3.0] - 2025-02-12

- Move text changes handling from react component to the wrapper [#849](https://github.com/TypeFox/monaco-languageclient/pull/849)
- Updated to `monaco-languageclient@9.3.0` and `monaco-editor-wrapper@6.3.0`.
- Updated all `@codingame/monaco-vscode` packages to `14.0.2`.

## [6.2.5] - 2025-02-08

- Updated to `monaco-languageclient@9.2.5` and `monaco-editor-wrapper@6.2.5`.
- Updated all `@codingame/monaco-vscode` packages to `13.1.6`.

## [6.2.4] - 2025-02-06

- Fix non dynamic import of @codingame/monaco-vscode-views-service-override [#844](https://github.com/TypeFox/monaco-languageclient/pull/844)
- Updated to `monaco-languageclient@9.2.4` and `monaco-editor-wrapper@6.2.4`.
- Updated all `@codingame/monaco-vscode` packages to `13.1.4`.

## [6.2.3] - 2025-02-04

- clean subscriptions in react [#839](https://github.com/TypeFox/monaco-languageclient/pull/839)
- Updated to `monaco-languageclient@9.2.3` and `monaco-editor-wrapper@6.2.3`.
- Updated all `@codingame/monaco-vscode` packages to `13.1.3`.

## [6.2.2] - 2025-02-03

- Updated to `monaco-languageclient@9.2.2` and `monaco-editor-wrapper@6.2.2`.
- Updated all `@codingame/monaco-vscode` packages to `13.1.2`.

## [6.2.1] - 2025-01-31

- Moved workerFactory from `monaco-editor-wrapper` to `monaco-languageclient`
- Updated to `monaco-languageclient@9.2.1` and `monaco-editor-wrapper@6.2.1`.

## [6.2.0] - 2025-01-31

- Update to monaco-vscode-api v13 [#836](https://github.com/TypeFox/monaco-languageclient/pull/836)
  - Updated all `@codingame/monaco-vscode` packages to `13.1.1`.
  - Breaking changes not in this API, but when using `@monaco-vscode-api`:
    - `@codingame/monaco-vscode-api` should not be installed as vscode anymore
    - `@codingame/monaco-vscode-extension-api` can optionally be installed as `vscode` to use the extension api from the main thread
    - Some imports should be updated:
      - `vscode/*` => `@codingame/monaco-vscode-api/*`
      - `vscode/services` => `@codingame/monaco-vscode-api`
- Updated to `monaco-languageclient@9.2.0` and `monaco-editor-wrapper@6.2.0`.

## [6.1.1] - 2025-01-20

- View service related imports are made dynamically [#829](https://github.com/TypeFox/monaco-languageclient/pull/829)

## [6.1.0] - 2025-01-10

- `@typefox/monaco-editor-react` now works with views service [#823](https://github.com/TypeFox/monaco-languageclient/pull/823)
- Ensure configuration is init before service init [#820](https://github.com/TypeFox/monaco-languageclient/pull/820)

## [6.0.0] - 2024-12-18

- Only `monaco-editor-wrapper` is a `peerDependencies`
- Updated engine engine requirements for node to (`>=18.19.0`) and for npm to (`>=10.2.3`)
- Updated to `monaco-editor-wrapper@9.0.0` and `monaco-languageclient@6.0.0`. Updated all `@codingame/monaco-vscode` packages to `11.1.2`.
- Bugfix: Wrapper: Text model content is not properly updated with updateCodeResource [#808](https://github.com/TypeFox/monaco-languageclient/pull/808)
- Workaround for `@codingame/monaco-vscode-chat-extensions-notebook-task-terminal-testing-common` dependency problem
- Run language clients independent of wrapper lifecycle [#784](https://github.com/TypeFox/monaco-languageclient/pull/784)
  - Internal functions clean-up. `containerRef.current` is directly passed to editor start.
- Use `didModelContentChange` from `monaco-editor-wrapper` for model content verifications.
- Updated to eslint 9
- Clean-up and allow registering a registerModelUpdate callback. This is used to properly handle `onTextChanged`
- Support all arguments for monaco-vscode-api `initialize` [#756](https://github.com/TypeFox/monaco-languageclient/pull/756)
  - On startup the current containerRef is passed to the interal editor app/monaco-editor
- Update to monaco-vscode-api 9.0.x [#749](https://github.com/TypeFox/monaco-languageclient/pull/749)
  - Enhancements to logging
- monaco-languageclient config improvement, wrapper+languageclientwrapper improvements [#741](https://github.com/TypeFox/monaco-languageclient/pull/741)
- Turned react component from class to function [#739](https://github.com/TypeFox/monaco-languageclient/pull/739)

## [4.5.3] - 2024-08-26

- Updated to `monaco-editor-wrapper@5.5.3` and `monaco-languageclient@8.8.3`. Updated all `@codingame/monaco-vscode` packages to `8.0.4`.

## [4.5.2] - 2024-08-21

- Updated to `monaco-editor-wrapper@5.5.2` and `monaco-languageclient@8.8.2`. Updated all `@codingame/monaco-vscode` packages to `8.0.2`.

## [4.5.1] - 2024-08-12

- Updated to `monaco-editor-wrapper@5.5.1` and `monaco-languageclient@8.8.1`. Updated all `@codingame/monaco-vscode` packages to `8.0.1`.

## [4.5.0] - 2024-08-08

- isRestarting is only checked and awaited at the beginning of handleReInit [#723](https://github.com/TypeFox/monaco-languageclient/pull/723)
- Open default workspace [#714](https://github.com/TypeFox/monaco-languageclient/pull/714)
- Update to monaco-vscode-api 8.0.0 [#722](https://github.com/TypeFox/monaco-languageclient/pull/722)
  - Updated to `monaco-editor-wrapper@5.5.0`, `monaco-languageclient@8.8.0` and version `8.0.0` of `@codingame/monaco-vscode` packages

## [4.4.0] - 2024-07-16

- Update to latest monaco-vscode-api [#707](https://github.com/TypeFox/monaco-languageclient/pull/707)
  - Updated to `monaco-editor-wrapper@5.4.0`, `monaco-languageclient@8.7.0` and version `7.0.7` of `@codingame/monaco-vscode` packages

## [4.3.2] - 2024-07-02

- Updated to `monaco-editor-wrapper@5.3.1`

## [4.3.1] - 2024-07-02

- Fix Diff Editor Model Refs [#696](https://github.com/TypeFox/monaco-languageclient/pull/696)

## [4.3.0] - 2024-06-29

- Update to latest monaco-vscode-api [#691](https://github.com/TypeFox/monaco-languageclient/pull/691)
  - Updated to `monaco-editor-wrapper@5.3.0`, `monaco-languageclient@8.6.0` and version `6.0.3` of `@codingame/monaco-vscode` packages
- Update onTextChanged in MonacoEditorReactComp [#684](https://github.com/TypeFox/monaco-languageclient/pull/684)
- Wait for Monaco to initialize when MonacoEditorReactComp props are updated [#682](https://github.com/TypeFox/monaco-languageclient/pull/682)
- Dispose extension files in EditorAppExtended [#680](https://github.com/TypeFox/monaco-languageclient/pull/680)

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
