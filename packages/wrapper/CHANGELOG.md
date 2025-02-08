# CHANGELOG

All notable changes to npm module [monaco-editor-wrapper](https://www.npmjs.com/package/monaco-editor-wrapper) are documented in this file.

## [6.2.5] - 2025-02-08

- Updated all `@codingame/monaco-vscode` packages to `13.1.6`.
- Updated to `monaco-languageclient@9.2.5`.

## [6.2.4] - 2025-02-06

- Fix non dynamic import of @codingame/monaco-vscode-views-service-override [#844](https://github.com/TypeFox/monaco-languageclient/pull/844)
- Updated all `@codingame/monaco-vscode` packages to `13.1.4`.
- Updated to `monaco-languageclient@9.2.4`.

## [6.2.3] - 2025-02-04

- Updated all `@codingame/monaco-vscode` packages to `13.1.3`
- Updated to `monaco-languageclient@9.2.3`.

## [6.2.2] - 2025-02-03

- Updated all `@codingame/monaco-vscode` packages to `13.1.2`
- Updated to `monaco-languageclient@9.2.2`.

## [6.2.1] - 2025-01-31

- Moved workerFactory from `monaco-editor-wrapper` to `monaco-languageclient`
- Updated to `monaco-languageclient@9.2.1`.

## [6.2.0] - 2025-01-31

- Update to monaco-vscode-api v13 [#836](https://github.com/TypeFox/monaco-languageclient/pull/836)
  - Updated all `@codingame/monaco-vscode` packages to `13.1.1`.
  - Breaking changes not in this API, but when using `@monaco-vscode-api`:
    - `@codingame/monaco-vscode-api` should not be installed as vscode anymore
    - `@codingame/monaco-vscode-extension-api` can optionally be installed as `vscode` to use the extension api from the main thread
    - Some imports should be updated:
      - `vscode/*` => `@codingame/monaco-vscode-api/*`
      - `vscode/services` => `@codingame/monaco-vscode-api`
- Updated to `monaco-languageclient@9.2.0`.
- Removed the pre-bundled workers and the corresponding export `monaco-editor-wrapper/workers/module/*`. You have to define your own imports as done [here](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/examples/src/common/client/utils.ts#L19).

## [6.1.1] - 2025-01-20

- View service related imports are made dynamically [#829](https://github.com/TypeFox/monaco-languageclient/pull/829)

## [6.1.0] - 2025-01-10

- `@typefox/monaco-editor-react` now works with views service [#823](https://github.com/TypeFox/monaco-languageclient/pull/823)
- Ensure configuration is init before service init [#820](https://github.com/TypeFox/monaco-languageclient/pull/820)

## [6.0.0] - 2024-12-18

- Only `monaco-languageclient` and `vscode-ws-jsonrpc` are `peerDependencies`.
- Updated to `monaco-languageclient@9.0.0` and `vscode-ws-jsonrpc@3.4.0`. Updated all `@codingame/monaco-vscode` packages to `11.1.2`.
- Updated engine engine requirements for node to (`>=18.19.0`) and for npm to (`>=10.2.3`)
- Bugfix: Wrapper: Text model content is not properly updated with updateCodeResource [#808](https://github.com/TypeFox/monaco-languageclient/pull/808)
- Fixed WebSocket type checking error [#800](https://github.com/TypeFox/monaco-languageclient/pull/800)
- Workaround for `@codingame/monaco-vscode-chat-extensions-notebook-task-terminal-testing-common` dependency problem
- Run language clients independent of wrapper lifecycle [#784](https://github.com/TypeFox/monaco-languageclient/pull/784)
  - API and internal functions clean-up
  - Re-combination of `EditorAppClassic` and `EditorAppClassic`
  - Moved `$type` to mandatory top-level element in `WrapperConfig`
  - Reduced minimally mandatory configuration
  - Exposed vscodeApi init functions
- Moved `createUrl` to `monaco-languageclient/tools`, moved editor app specific utils to editorAppbase and create function `didModelContentChange`.
- Updated to eslint 9
- Clean-up and allow registering a registerModelUpdate callback
- Support all arguments for monaco-vscode-api `initialize` [#756](https://github.com/TypeFox/monaco-languageclient/pull/756)
  - This also allows to configure editor-, view- or workspace-service. This is a preparation for further enhancements.
- Update to monaco-vscode-api 9.0.x [#749](https://github.com/TypeFox/monaco-languageclient/pull/749)
  - Enhancements to logging, worker factory and start order. The worker factory only accepts direct worker loading instructions from now on
- monaco-languageclient config improvement, wrapper+languageclientwrapper improvements [#741](https://github.com/TypeFox/monaco-languageclient/pull/741)
  - Allows to configure more than one language client
  - `UserConfig` is renamed to `WrapperConfig` and one level less deep
  - Restart options are now intergrated into the configuration
- You can now pass a URL to `initLocaleLoader` for module import

## [5.5.3] - 2024-08-26

- Updated to `monaco-languageclient@8.8.3`. Updated all `@codingame/monaco-vscode` packages to `8.0.4`.
- Fixed Remove unnecessary rejections in updateCodeResources

## [5.5.2] - 2024-08-21

- Updated to `monaco-languageclient@8.8.2`. Updated all `@codingame/monaco-vscode` packages to `8.0.2`.
- Fixed Remove unnecessary rejections in updateCodeResources

## [5.5.1] - 2024-08-12

- Updated to `monaco-languageclient@8.8.1`. Updated all `@codingame/monaco-vscode` packages to `8.0.1`.

## [5.5.0] - 2024-08-08

- isRestarting is only checked and awaited at the beginning of handleReInit [#723](https://github.com/TypeFox/monaco-languageclient/pull/723)
- Open default workspace [#14](https://github.com/TypeFox/monaco-languageclient/pull/714)
- Update to monaco-vscode-api 8.0.0 [#722](https://github.com/TypeFox/monaco-languageclient/pull/722)
  - Updated to `monaco-languageclient@8.8.0`, `8.0.0` of `@codingame/monaco-vscode` packages

## [5.4.0] - 2024-07-16

- Update to latest monaco-vscode-api [#707](https://github.com/TypeFox/monaco-languageclient/pull/707)
  - Updated to `monaco-languageclient@8.7.0`, `7.0.7` of `@codingame/monaco-vscode` packages
- Test "Dispose extension files in EditorAppExtended" [#688](https://github.com/TypeFox/monaco-languageclient/pull/688)
  - Test is disabled again as it is not working in headless Linux environment / CI

## [5.3.1] - 2024-07-02

- Fix Diff Editor Model Refs [#696](https://github.com/TypeFox/monaco-languageclient/pull/696)

## [5.3.0] - 2024-06-29

- Update to latest monaco-vscode-api [#691](https://github.com/TypeFox/monaco-languageclient/pull/691)
  - Updated to `monaco-languageclient@8.6.0`, `6.0.3` of `@codingame/monaco-vscode` packages
- Dispose extension files in EditorAppExtended [#680](https://github.com/TypeFox/monaco-languageclient/pull/680)

## [5.2.0] - 2024-06-04

- Updated to `monaco-languageclient@8.5.0`, `vscode-ws-jsonrpc@3.3.2` and version `5.2.0` of `@codingame/monaco-vscode` packages
- Wrapper: Make codeResources and useDiffEditor optional in EditorAppConfig [#670](https://github.com/TypeFox/monaco-languageclient/pull/670)
  - Additional code adjustments to eslint rule expansion
- chore: localeLoader: allow manually select which locale to load [#669](https://github.com/TypeFox/monaco-languageclient/pull/669)

## [5.1.2] - 2024-05-17

- Aded `getUserConfiguration` to `EditorAppBase`, so one does not need to use another import.
- Removed sub-exports that were forgotton to be removed before.

## [5.1.1] - 2024-05-15

- Integrated `localLoader.js` from examples and make it available as sub-export `monaco-editor-wrapper/vscode/locale`

## [5.1.0] - 2024-05-15

- Feature: If present `connectionProvider` from the languageclient section in the `UserConfig` is now driving the MessageTransports configuration. Previously the MessageTransports were always created indepently leading to inconsistent configuration of the `LanguageClientWrapper`.

## [5.0.0] - 2024-05-15

- BREAKING: `UserConfig` changes:
  - text is now supplied as `codeResources`. It is no longer required to supply a `languageId` and it is not required to supply any text to start the editor.
  - `languageDef` used in the classic config is now an object that contains `monarchLanguage` and `languageExtensionConfig`
  - The `languageId` is automatically derived from the uri, but can also be optionally enforced
- BREAKING: changes to `MonacoEditorLanguageClientWrapper`:
  - `updateCodeResources` or `updateEditorModels` allow to update the text content or editor model
- Internal code handling model and text updates has been reworked. Different code paths for regualr and diff editors have been unified.
- Updated to `monaco-languageclient@8.4.0` and version `5.1.1` of `@codingame/monaco-vscode` packages
  - Started using `@codingame/monaco-vscode-monarch-service-override` in classic editor
- Remove the main bundle from the package. One should do this at application level.

## [4.2.1] - 2024-04-17

- Updated to `monaco-languageclient@8.3.1` and version `4.3.2` of `@codingame/monaco-vscode` packages

## [4.2.0] - 2024-04-12

- Updated to `monaco-languageclient@8.3.0` and version `4.2.1` of `@codingame/monaco-vscode` packages
- @typefox/monaco-editor-react works in strict mode [#634](https://github.com/TypeFox/monaco-languageclient/pull/634)
  - Moved wrapper related functions to `isReInitRequired` and introduced a new unit test

## [4.1.0] - 2024-04-10

- Updated to `monaco-languageclient@8.2.0`

## [4.0.2] - 2024-04-03

- Updated to `monaco-languageclient@8.1.1`

## [4.0.1] - 2024-03-22

- `workerFactory` now uses `@codingame/monaco-vscode-standalone` packages available since `3.2.0` to build the workers. Therefore it is now independent of the MS package.
- Updated to `monaco-languageclient@8.1.0`

## [4.0.0] - 2024-03-18

- Moved code to [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) repository.
- Aligned LICENSE usage throughout the repository
- Introduce new export `vscode/services`
  - Extends functions `monaco-languageclient/vscode/services` provides
- Introduce new export `workerFactory`
  - Replaces `monaco-editor-workers` and allows to fully override the default definiton
- Vite & monaco-editor-workers [monaco-components #67](https://github.com/TypeFox/monaco-components/issues/67)
- Selective applicance of wrappers css [monaco-components #65](https://github.com/TypeFox/monaco-components/issues/65)
- Having the component twice on a page [monaco-components #64](https://github.com/TypeFox/monaco-components/issues/64)

## [3.6.0] - 2024-01-04

- Updated to `monaco-languageclient@7.3.0` and `@codingame/monaco-vscode-api@1.85.0` / `@codingame/monaco-editor-treemended@1.85.0` (=`monaco-editor@0.45.0`).
- How to modify client's capabilities? [#61](https://github.com/TypeFox/monaco-components/issues/61)
  - It is now possible to provide and fully override both monaco-languageclient's clientOptions and connectionProvider

## [3.5.0] - 2023-11-07

- Updated to `monaco-languageclient@7.2.0` and `monaco-vscode-api@1.83.16`.
- Introduce capability to use a `MessagePort` as end-point for a languageclient
- Use vitest v1 for tests
- Move `initServices` from `MonacoEditorLanguageClientWrapper` to `LanguageClientWrapper`

## [3.4.0] - 2023-11-27

- Updated to `monaco-languageclient@7.1.0` and `monaco-vscode-api@1.83.12`.
  - BREAKING: The postinstall step is removed. `monaco-languageclient` no longer patches an existing `monaco-editor` instead the package `@codingame/monaco-editor-treemended` is used. This requires that projects using this lib to enforce the correct `monaco-editor` with overrides (npm/pnpm) or resolutions (yarn) in the `package.json`.
    - Please see the [following explanation](https://github.com/TypeFox/monaco-languageclient/blob/main/README.md#new-with-v7-treemended-monaco-editor)
  - BREAKING: If you want to use `getConfigurationServiceOverride` you need to provide a `workspaceConfig` along the `userServices` in `initServices`.
- Make subclassing MonacoEditorReactComp more easy [#58](https://github.com/TypeFox/monaco-components/issues/58)
- Allow to init and start separately [#59](https://github.com/TypeFox/monaco-components/issues/59)
  - BREAKING: `start` no longer calls `init`. You need to call both or you use `initAndStart`.

## [3.3.0] - 2023-10-17

- Properly separate and define classic and extended editor [#54](https://github.com/TypeFox/monaco-components/pull/54)
  - Renamed `EditorAppVscodeApi` to `EditorAppExtended` and `EditorAppConfigVscodeApi` to `EditorAppConfigExtended`
  - BREAKING: `$type` of `EditorAppConfigExtended` was changed from `vscodeApi` to `extended`
- Updated to `monaco-languageclient@6.6.0` and `@codingame/monaco-vscode-api@1.83.2` and `monaco-editor@0.44.0`
- Include all direct dependencies that the code uses in the `package.json`.

## [3.2.5] - 2023-10-13

- New Problem in vite [#55](https://github.com/TypeFox/monaco-components/issues/55)
  - Fixed wrong imports

## [3.2.4] - 2023-10-05

- Fixed/Implemented multiple `extensionRegisterResults` handling.

## [3.2.3] - 2023-10-04

- Updated to `monaco-languageclient@6.5.1`.

## [3.2.2] - 2023-10-04

- Fixed broken dependency definition

## [3.2.1] - 2023-09-29

- Fixed `awaitExtensionReadiness` was not added to the base configuration during init.

## [3.2.0] - 2023-09-29

- Updated to `monaco-languageclient@6.5.0`. Service init now relies on specific imports from `monaco-vscode-api` or user defined services.
  - Bundle sizes and content are reduced as unneeded dynamic imports are no longer contained.
  - Only keep user services in`initServices`. It requires to specifically import and use services provided by [monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api#monaco-standalone-services)
    - All *enable...* and *configure* type parameters have been removed from `monaco-languagclient`
    - languages and model services are always added by `monaco-languagclient`
    - layout, environment, extension, files and quickAccess servies are always added by `monaco-vscode-api`
    - Additional services need to be added to the package dependencies and imported and configured as shown in the [examples](https://github.com/TypeFox/monaco-languageclient#examples)
- htmlElement is no longer part of UserConfig. Must be passed at start [#51](https://github.com/TypeFox/monaco-components/pull/51)
  - The HTMLElement must now be passed at `wrapper.start`. It is no longer part of the UserConfig.

## [3.1.0] - 2023-09-21

- Make the extension register result accessible [#48](https://github.com/TypeFox/monaco-components/pull/48)
- Improve configuration change detection [#47](https://github.com/TypeFox/monaco-components/pull/47)
- semantic highlighting works with classic editor [#45](https://github.com/TypeFox/monaco-components/pull/45)

## [3.0.1] - 2023-09-07

- Introduce `logger.ts` which allows to centrally enable / disable console logging of the library
- Updated to `monaco-languageclient` `6.4.6` using `monaco-vscode-api` `1.81.7`
- Ensure LanguageClientWrapper Cleans up Worker [#42](https://github.com/TypeFox/monaco-components/pull/42)

## [3.0.0] - 2023-08-31

- New example and config changes [#37](https://github.com/TypeFox/monaco-components/pull/37)
- languageClientWrapper: Reject start with unreachable web socket or web worker url [#34](https://github.com/TypeFox/monaco-components/pull/34)
- Improve naming and improve api usage [#31](https://github.com/TypeFox/monaco-components/pull/31)
- createUrl now allows web socket urls without port and path [#30](https://github.com/TypeFox/monaco-components/pull/30)
- Updated to `monaco-languageclient` `6.4.5` using `monaco-vscode-api` `1.81.5` and `monaco-editor` `0.41.0`
- languageClientWrapper: Reject start with unreachable web socket or web worker url [#34](https://github.com/TypeFox/monaco-components/pull/34)
- Re-introduce `addMonacoStyles` via `monaco-editor-wrapper/styles`

## [2.1.1] - 2023-07-27

- Allow to pass a uri via editor config and model update [#29](https://github.com/TypeFox/monaco-components/pull/29)

## [2.1.0] - 2023-06-16

- Make worker handling more flexible [#27](https://github.com/TypeFox/monaco-components/pull/27)
- Updated to `monaco-languageclient` `6.2.0` using `monaco-vscode-api` `1.79.3` and `monaco-editor` `0.39.0`

## [2.0.1] - 2023-06-12

- Updated to `monaco-languageclient` `6.1.0` using `monaco-vscode-api` `1.79.1` and `monaco-editor` `0.38.0`

## [2.0.0] - 2023-06-02

- Move away from "property" based configuration. `UserConfig` drives the complete monaco-editor configuration
  - Use global configuration object that is passed to the wrapper on start
  - The `monaco-editor-wrapper` and the new `@typefox/monaco-editor-react` component use the same configuration
- The underlying monaco-editor can be configured in two ways now (wrapperConfig):
  - Classic: As before, but with one config object
  - Extension like: Using the extension based mechanism supplied by `monaco-vscode-api`
- `monaco-languageclient` no longer exposes its own service. Now, we fully rely on services supplied by `monaco-vscode-api`
  - This means even if you decide to configure monaco-editor the classical way, you still require some basic services. This configuration is made inside `MonacoEditorLanguageClientWrapper`. Potential serviceConfig supplied when using vscode-api extension config is taken into account and combined then.
- Re-configuration without full editor restart:
  - Updating the text model(s) is possible
  - Updating the monaco-editor options is possible
  - Restarting the languageclient is possible independently
- Everything else requires a restart of the editor!

## [1.6.1] - 2023-03-23

- Enable to update/restart the language client [#18](https://github.com/TypeFox/monaco-components/pull/18)
- Add language client initialization options [#17](https://github.com/TypeFox/monaco-components/pull/17)

## [1.6.0] - 2022-12-21

- Fix error in `disposeLanguageClient` preventing proper editor disposal
- Expose `MessageTransports` configuration for accessing `MessageReader` and `MessageWriter`
- Polish wrapper examples and add web socket example

## [1.5.0] - 2022-12-09

- Remove `swapEditors` function. `startEditor` disposes old (diff)editor and starts a freshly configured one.

## [1.4.1] - 2022-12-01

- Update to `monaco-languageclient@4.0.3`

## [1.4.0] - 2022-12-01

- Export `vscode` (monaco-vscode-api) and `monaco` and remove getters
- `automaticLayout` is configured as default
- Fixed full configuration of editor and diff editor via `monacoEditorOptions` and `monacoDiffEditorOptions`
- Changed the compile target and module to ES2022.
- Update to `monaco-languageclient@4.0.2`
- Update to `vscode-ws-jsonrpc@2.0.1`

## [1.3.2] - 2022-11-25

- Merged css and ttf helper functions. Now ttf is included in css removing unknown path errors.

## [1.3.1] - 2022-11-03

- Added get function to access `monaco-vscode-api` via `getVscode()`

## [1.3.0] - 2022-10-28

- Bundling issues with imported workers from wrapper #[14](https://github.com/TypeFox/monaco-components/issues/14)
  - The new default is that no additional language support is contained. You can use another export to obtain them. The same applies to the bundles:
    - `monaco-editor-wrapper/allLanguages`
    - `monaco-editor-wrapper/bundle`
    - `monaco-editor-wrapper/bundle/allLanguages`

## [1.2.0] - 2022-09-22

- Fix model URI path #[13](https://github.com/TypeFox/monaco-components/pull/13)
- Added inmemory uri to diff editor as well
- Re-worked the start/dispose/restart of the editor
- Ensure model uris are unique for different languages and across multiple editor instances

## [1.1.0] - 2022-09-20

- Allows to set `MessageReader` and `MessageWriter` for the web worker. This opens the possibility to emit and intercept messages.
- It is now possible to configure and use a full language extension configuration
- Added get functions to access to monaco, editor, diffEditor and languageClient or quickly get the editor content:
  - `getMonaco()`
  - `getEditor()`
  - `getDiffEditor()`
  - `getLanguageClient()`
  - `getMainCode()`
  - `getDiffCode()`

## [1.0.0] - 2022-09-08

- Separated `monaco-editor-wrapper` from `monaco-editor-comp`
