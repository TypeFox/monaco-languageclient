# Changelog

All notable changes to this npm module are documented in this file.

## [6.6.1] - 2023-10-20

- Updated to `monaco-vscode-api` `1.83.3` which adds l10n suppport.

## [6.6.0] - 2023-10-16

- Updated to `monaco-editor` `0.44.0` and `monaco-vscode-api` `1.83.2`.

## [6.5.3] - 2023-10-11

- Updated to `monaco-vscode-api` `1.82.5`. Fixes requirung `"skipLibCheck": true` with previous versions of 1.82.x.

## [6.5.2] - 2023-10-07

- Updated to `monaco-vscode-api` `1.82.4`

## [6.5.1] - 2023-10-04

- Issue with v6.5.0 (There is already an extension with this id error) on inputFactories [#546](https://github.com/TypeFox/monaco-languageclient/issues/546)
  - Fixed dependency defintion of `@codingame/monaco-vscode-api` and updated to `1.82.3`

## [6.5.0] - 2023-09-29

- Updated to `monaco-editor` `0.43.0` and `monaco-vscode-api` `1.82.2`
- Only keep user services in`initServices`. It requires to specifically import and use services provided by [monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api#monaco-standalone-services)
  - All *enable...* and *configure* type parameters have been removed from `monaco-languagclient`
  - languages and model services are always added by `monaco-languagclient`
  - layout, environment, extension, files and quickAccess servies are always added by `monaco-vscode-api`
  - Additional services need to be added to the package dependencies and imported and configured as shown in the [examples](https://github.com/TypeFox/monaco-languageclient#examples)

## [6.4.6] - 2023-09-05

- Updated to `monaco-vscode-api` `1.81.7`

## [6.4.5] - 2023-08-30

- Use direct `monaco-editor` imports
- Make examples publicly available

## [6.4.4] - 2023-08-24

- Updated to `monaco-vscode-api` `1.81.5`
- Added python language client and language server (pyright) examples

## [6.4.3] - 2023-08-22

- Updated to `monaco-vscode-api` `1.81.3`

## [6.4.2] - 2023-08-19

- Updated to `monaco-vscode-api` `1.81.2`

## [6.4.1] - 2023-08-18

- `monaco-vscode-api` `1.81.1` [#523](https://github.com/TypeFox/monaco-languageclient/pull/523)
  - Removed `enableQuickaccessService` as it is always loaded now as default
  - Aligned naming of properties in `InitializeServiceConfig`

## [6.4.0] - 2023-08-10

- Updated to `monaco-editor` `0.41.0` and `monaco-vscode-api` `1.81.0` [#520](https://github.com/TypeFox/monaco-languageclient/pull/520)

## [6.3.0] - 2023-08-04

- Updated to `monaco-editor` `0.40.0` and `monaco-vscode-api` `1.80.2` [#513](https://github.com/TypeFox/monaco-languageclient/pull/513)
  - vscode api services have been cleaned-up and fully aligned with `monaco-vscode-api

## [6.2.0] - 2023-06-16

- Updated `monaco-vscode-api` to version `1.79.3`, `monaco-editor` to version `0.39.0` and `monaco-editor-workers` to version `0.39.1` [#503](https://github.com/TypeFox/monaco-languageclient/pull/503)

## [6.1.0] - 2023-06-12

- Updated to `monaco-vscode-api` version `1.79.0` and `monaco-editor` version `0.38.0` [#493](https://github.com/TypeFox/monaco-languageclient/issues/493)
- Updated to `monaco-vscode-api` version `1.79.1` [#501](https://github.com/TypeFox/monaco-languageclient/pull/501)
- `initService` creates `window.MonacoEnvironment` if not yet available

## [6.0.3] - 2023-05-31

- Updated to `monaco-vscode-api` version `1.78.8` fixing treemending patch issues [#491](https://github.com/TypeFox/monaco-languageclient/issues/491) / [monaco-vscode-api #116](https://github.com/CodinGame/monaco-vscode-api/pull/116) / [monaco-vscode-api #119](https://github.com/CodinGame/monaco-vscode-api/pull/119)

## [6.0.2] - 2023-05-24

- Dependencies to `monaco-editor` and `monaco-vscode-api` are now explicitly declared due to problems with yarn (see external issue: https://github.com/TypeFox/monaco-components/issues/21)

## [6.0.1] - 2023-05-12

- Updated to `monaco-vscode-api` version `1.78.6` fixing Macintosh related monaco-editor problems

## [6.0.0] - 2023-05-04

- **BREAKING CHANGE**: Updated to `monaco-vscode-api` `1.78.5` and therefore retired `MonacoServices`. It is replaced by `initServices` that makes configration of services exposed by `monaco-vscode-api` handy and still allows the definition of own services as [outlined here](https://github.com/CodinGame/monaco-vscode-api#monaco-standalone-services) and these can be passed as `userServices` in `initServices`.
- Most client examples now share [common code](./packages/examples/main/src/common.ts) to reduce the amount of redundant code.
- The angular-client example is now found in [its own repository](https://github.com/TypeFox/monaco-languageclient-ng-example.git)

## [5.0.1] - 2023-04-04

- Bugfix: textDocument/didChange message is doubled [#479](https://github.com/TypeFox/monaco-languageclient/issues/479)

## [5.0.0] - 2023-04-04

- **BREAKING CHANGE**: Update to monaco-vscode-api 1.76 [#470](https://github.com/TypeFox/monaco-languageclient/pull/470)
  - More services from `monaco-vscode-api` are used in the langium example (language config, text mate, keyboard bindings)
  - Updates to `monaco-editor` version `0.36.1` and vscode api compatibility to `1.76.0`
- **BREAKING CHANGE**: Do not reexport code of imported libraries (e.g. vscode-languageclient) [#459](https://github.com/TypeFox/monaco-languageclient/pull/459)
  - Content of `vscode-jsonrpc`,`vscode-languageclient` and `vscode-languageserver-protocol` is no longer re-exported
  - Restructures example into less packages. It reduces maintenace efforts
  - Web worker language server example is replaced with Langium Statemachine

## [4.0.3] - 2022-12-01

- Fixed compile target configuration

## [4.0.2] - 2022-12-01

- Changed the compile target and module to ES2022. Applied linting. Code was functionally not changed.
- Updated to `monaco-vscode-api@1.69.13`
- Added [react-client](../../packages/examples/react-client) and [angular-client](../../packages/examples/angular-client)

## [4.0.1] - 2022-10-19

- Update to monaco-editor 0.34.1 [#373](https://github.com/TypeFox/monaco-languageclient/pull/373)
  - Update to `monaco-vscode-api@1.69.12`
  - Update exmaple dependencies (which don't affect the library)

## [4.0.0] - 2022-09-08

- **BREAKING CHANGE**: Transform to package of type module and switch to TypeScript ECMAScript Module Support in Node.js.
- **BREAKING CHANGE**: All cjs exports have been removed.
- **BREAKING CHANGE**: The old `monaco-converter` has been removed. If you still rely on it, please take a look at the example [language service written in JavaScript](../examples/browser/src/client.ts) and adapt to the converters usage available since v2.0.0.
- Added verification examples for webpack and vite that shall ensure the libs work in dependent projects and the give you an idea how to use `monaco-languageclient` and `vscode-ws-jsonrpc` with common bundlers.
- Revised all READMEs

## [3.0.1] - 2022-08-24

- Update `monaco-vscode-api` to version `1.69.9`

## [3.0.0] - 2022-08-15

- Update to monaco 0.34/vscode 1.69 [#409](https://github.com/TypeFox/monaco-languageclient/pull/409)

## 2.x.x BREAKING CHANGES

v2+ of this library is dependant on [monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api) which removed all vscode-api/-compatibility related code. The change has mostly no effect on end users code, but there are two things that need to be taken into account:

- If you use Webpack or vite for bundling, you have to remove the `vscode` alias entry from the configuration
- If you customized monaco services, then you have to adjust them to the changed interface

The npm packages exports the following:

- `monaco-languagclient`
- `monaco-languagclient/monaco-converters`
- `monaco-languagclient/monaco-converters/cjs`

## [2.1.0] - 2022-07-21

- Update vscode api [#399](https://github.com/TypeFox/monaco-languageclient/pull/399)
- Updated `vite` to `3.0.2`

## [2.0.2] - 2022-06-22

- Align all tsconfigs and vscode-ws-jsonrpc provides esm/cjs [#390](https://github.com/TypeFox/monaco-languageclient/pull/390)
  - Use `typesVersions` in **package.json*- for proper TypeScript import support (used in node example)
  - Remove AMD and CJS builds adn exports of the main library. Only `monaco-converters` and `monaco-converters/cjs` are left

## [2.0.1] - 2022-06-21

- No cjs fragments to export [#388](https://github.com/TypeFox/monaco-languageclient/issues/388)

## [2.0.0] - 2022-06-21

- Use monaco vscode api [#373](https://github.com/TypeFox/monaco-languageclient/pull/373)
- Merge monaco-jsonrpc and vscode-ws-jsonrpc into new sub package [#383](https://github.com/TypeFox/monaco-languageclient/pull/383)
- Integrate eslint with eslint-config-standard [#385](https://github.com/TypeFox/monaco-languageclient/pull/385)
- Add example with client and server both running in the browser [#386](https://github.com/TypeFox/monaco-languageclient/pull/386)

## [1.1.0] - 2022-06-08

- feat(package.json): export monaco-converter [#376](https://github.com/TypeFox/monaco-languageclient/pull/376)
- Clean unregistered featured from registration requests [#372](https://github.com/TypeFox/monaco-languageclient/pull/372)
- Introduce global engines entries for node and npm [#370](https://github.com/TypeFox/monaco-languageclient/pull/370)
- Implement missing 3.17 api [#364](https://github.com/TypeFox/monaco-languageclient/pull/364)
- Remove unsupported features [#362](https://github.com/TypeFox/monaco-languageclient/pull/362)
- Do not include node code [#361](https://github.com/TypeFox/monaco-languageclient/pull/361)

## [1.0.1] - 2022-05-21

- Add some typing on the code/proto converters [#359](https://github.com/TypeFox/monaco-languageclient/pull/359)
- Fix to vite 2.9.6 for now

## [1.0.0] - 2022-05-20

- Switch to npm workspace and vite and thereby drop yarn, lerna and webpack [#340](https://github.com/TypeFox/monaco-languageclient/pull/340)
  - Restructure project: All code is moved to packages directory
  - Update and clean-up all dependencies
  - Use monaco-editor in examples instead of monaco-editor-core
  - README was fully revised
  - Bugfixes resulting from this:
    - fix: Fix vscode-compatibility using webpack [#342](https://github.com/TypeFox/monaco-languageclient/pull/342)
    - Use ts-node for example [#344](https://github.com/TypeFox/monaco-languageclient/pull/344)
    - Update README.md  [#345](https://github.com/TypeFox/monaco-languageclient/pull/345)
    - Integrate webpack client example as second option [#353](https://github.com/TypeFox/monaco-languageclient/pull/353)
- Make monaco workspace disposable [#330](https://github.com/TypeFox/monaco-languageclient/pull/330)
- Update the protocol to version 3.17 [#350](https://github.com/TypeFox/monaco-languageclient/pull/350)
- Fix code action diagnostics [#352](https://github.com/TypeFox/monaco-languageclient/pull/352)
- Fix resolving, never overwrite by undefined [#354](https://github.com/TypeFox/monaco-languageclient/pull/354)
- The `connectionProvider` now expects a `MessageTransports` instead of a `MessageConnection`
- Bump version to 1.0.0

## [0.18.1] - 2022-03-21

- Fix vscode api enum [#333](https://github.com/TypeFox/monaco-languageclient/pull/333)

## [0.18.0] - 2022-03-15

- Update to monaco 0.33 & vscode 1.65 [#329](https://github.com/TypeFox/monaco-languageclient/pull/329)
- Updated minor versions of vscode-languageserver-textdocument and vscode-uri and removed engines entry from client

## [0.17.4] - 2022-02-22 (2022-03-08)

- First released as @codingame/monaco-languageclient@0.17.4 on specified date
- Release of monaco-languageclient@0.17.4 was made available on date in brackets
- Register providers using the document selector directly [#317](https://github.com/TypeFox/monaco-languageclient/pull/317)

## [0.17.3] - 2021-12-21 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.17.3 on specified date
- Release of monaco-languageclient@0.17.3 was made available on date in brackets
- Releases `0.17.1` and `0.17.2` were mistakes
- Fix various issues: outdated api, missing stuff in compatibility-api... [#309](https://github.com/TypeFox/monaco-languageclient/pull/309)

## [0.17.0] - 2021-11-10 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.17.0 on specified date
- Release of monaco-languageclient@0.17.0 was made available on date in brackets
- Update to monaco 0.30.1 [#301](https://github.com/TypeFox/monaco-languageclient/pull/301)

## [0.16.1] - 2021-11-03 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.16.1 on specified date
- Release of monaco-languageclient@0.16.1 was made available on date in brackets
- Fix dropped tags in Diagnostic -> IMarkerData [#297](https://github.com/TypeFox/monaco-languageclient/pull/297)
- Missing protocol convention [#298](https://github.com/TypeFox/monaco-languageclient/pull/298)

## [0.16.0] - 2021-10-11 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.16.0 on specified date
- Release of monaco-languageclient@0.15.1 was made available on date in brackets
- Updated `monaco-editor-core` version to `0.29.0`
- Async resolve code actions [#294](https://github.com/TypeFox/monaco-languageclient/pull/294)

## [0.15.1] - 2021-09-20 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.15.1 on specified date
- Release of monaco-languageclient@0.15.1 was made available on date in brackets
- Resolve code actions [#290](https://github.com/TypeFox/monaco-languageclient/pull/290)
- Release `0.15.0` was skipped

## [0.14.0] - 2021-08-05 (2022-02-23)

- First released as @codingame/monaco-languageclient@0.14.0 on specified date
- Release of monaco-languageclient@0.14.0 was made available on date in brackets
- Upgraded to Monaco 0.22.3

### Breaking changes

- `MonacoServices` now takes the `monaco` object instead of the `CommandRegistry`

before:

```typescript
MonacoServices.install(require('monaco-editor-core/esm/vs/platform/commands/common/commands').CommandsRegistry);
```

after:

```typescript
import - as monaco from 'monaco-editor-core'

MonacoServices.install(monaco);
```

- `MonacoServices` should now be installed using the command registry instead of the editor

before:

```typescript
const editor = monaco.editor.create(...);
MonacoServices.install(editor);
```

after:

```typescript
MonacoServices.install(require('monaco-editor-core/esm/vs/platform/commands/common/commands').CommandsRegistry);
```

## [0.13.0] - 2020-04-06

- Upgraded to vscode-uri 2.x [741a3df](https://github.com/TypeFox/monaco-languageclient/commit/741a3dfb865eff55c3dcc4a51f74759921d3f2a5)

## [0.12.0] - 2020-03-19

- Upgraded to Monaco 0.19.1 [#199](https://github.com/TypeFox/monaco-languageclient/pull/199)

## [0.11.0] - 2020-01-23

- Upgraded to Monaco 0.18.1 [#178](https://github.com/TypeFox/monaco-languageclient/pull/178)

## [0.10.2] - 2019-09-10

- register language features regardless whether a language is registered (<https://github.com/TypeFox/monaco-languageclient/commit/0559be6c20744182ede699f594fdbe6d9f3d7145>)

## [0.10.1] - 2019-09-04

- aligned CompletionItemKind with Monaco 0.17.0 [#174](https://github.com/TypeFox/monaco-languageclient/pull/174)

## [0.10.0] - 2019-08-26

- upgraded to LSP 5.3.0 and Monaco 0.17.0

### Breaking changes

Switch to es6 from es5. For clients who cannot migrate to es6 please use babel to transpile Monaco and LSP to es5.

- to configure babel wit webpack:

```js
    {
        test: /\\.js$/,
        // include only es6 dependencies to transpile them to es5 classes
        include: /monaco-languageclient|monaco-jsonrpc|vscode-jsonrpc|vscode-languageserver-protocol|vscode-languageserver-types|vscode-languageclient/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env'],
                plugins: [
                    // reuse runtime babel lib instead of generating it in each js file
                    '@babel/plugin-transform-runtime',
                    // ensure that classes are transpiled
                    '@babel/plugin-transform-classes'
                ],
                // see https://github.com/babel/babel/issues/8900#issuecomment-431240426
                sourceType: 'unambiguous',
                cacheDirectory: true
            }
        }
    }
```

## [0.9.0] - 2018-09-06

- use monaco-editor-core as a dev dependency to allow alternative implementations [#119](https://github.com/TypeFox/monaco-languageclient/pull/119)

### Breaking changes

Clients have to explicitly declare a dependency to `monaco-editor-core` or another package providing Monaco:

- `monaco-editor-core` is tree shaked to get rid of unused VS Code's code.
- [@typefox/monaco-editor-core](https://www.npmjs.com/package/@typefox/monaco-editor-core) is a not tree-shaked alternative.

## [0.8.0] - 2018-09-04

- updated dependency to Monaco 0.14.x, with adaptation for breaking changes from monaco [#107](https://github.com/TypeFox/monaco-languageclient/pull/107) - thanks to [@Twinside](https://github.com/Twinside)
- ensure that SignatureHelp and SignatureHelp has non-null arrays [#112](https://github.com/TypeFox/monaco-languageclient/pull/112) - thanks to [@rcjsuen](https://github.com/rcjsuen)

## [0.7.3] - 2018-08-30

- fixed folding ranges conversion - [12d8c91](https://github.com/TypeFox/monaco-languageclient/commit/12d8c91cf1676061c44d43e745b7500c77ea4a14)
- implement `toJSON` for workspace configurations - [9e50a48](https://github.com/TypeFox/monaco-languageclient/commit/9e50a48addb474be66fa317684461976eda45192)
- fixed markdown conversion [#103](https://github.com/TypeFox/monaco-languageclient/pull/103)

## [0.7.2] - 2018-08-02

- amd distribution ([#97](https://github.com/TypeFox/monaco-languageclient/pull/97)) - thanks to [@zewa666](https://github.com/zewa666)
- updated dependency to Monaco 0.13.2 ([#100](https://github.com/TypeFox/monaco-languageclient/pull/100))
- register providers only for languages matching the documentSelector ([#101](https://github.com/TypeFox/monaco-languageclient/pull/101)) - thanks to [@gins3000](https://github.com/gins3000)

## [0.7.0] - 2018-07-31

Updated to `vscode-languageclient` 4.4.0 to support LSP 3.10.0 features like hierarchical document symbols, go to type defition/implementation, workspace folders and document color provider ([#89](https://github.com/TypeFox/monaco-languageclient/pull/89)).

### Breaking changes

In order to use `vscode-languageclient` directly the compatibility layer was implemented for subset of `vscode` APIs used by the client:

- `vscode-compatibility` should be used as an implementation of `vscode` module at the runtime
  - to adjust module resolution with `webpack`:

  ```js
      resolve: {
          alias: {
              'vscode': require.resolve('monaco-languageclient/lib/vscode-compatibility')
          }
      }
  ```

  - `register-vscode` should be required once to adjust module resolution with `Node.js`, for example to stub `vscode` APIs for Mocha tests:

  ```
  --require monaco-languageclient/lib/register-vscode
  ```

- `MonacoLanguageClient` should be used instead of `BaseLanguageClient`
- `MonacoServices` should be installed globally to be accessible for `vscode-compatibility` module, not per a language client
  - for the use case with a single standalone editor:

  ```ts
  import { MonacoServices } from 'monaco-languageclient';

  MonacoServices.install(editor);
  ```

  - to support sophisticated use cases one can install custom Monaco services:

  ```ts
  import { MonacoServices, Services } from 'monaco-languageclient';

  const services: MonacoServices = {
      worspace, languages, commands, window
  };
  Services.install(services);
  ```

## [0.6.0] - 2018-04-18

- updated dependency to Monaco 0.12 ([#70](https://github.com/TypeFox/monaco-languageclient/pull/70))
- support `CompletionItem`'s `additionalTextEdits` property ([#39](https://github.com/TypeFox/monaco-languageclient/issues/39))
- convert `monaco.MarkerSeverity.Hint` values to `DiagnosticSeverity.Hint` ([#71](https://github.com/TypeFox/monaco-languageclient/pull/71))

## [0.4.0] - 2018-02-13

- add support for `textDocument/documentLink` and `documentLink/resolve` ([#53](https://github.com/TypeFox/monaco-languageclient/issues/53))
- state that `workspace/applyEdit` is supported in the capabilities ([#55](https://github.com/TypeFox/monaco-languageclient/pull/55))
- state that versioned changes are supported in a `WorkspaceEdit` ([#56](https://github.com/TypeFox/monaco-languageclient/pull/56))
- replaced `monaco-editor` with `monaco-editor-core` ([#58](https://github.com/TypeFox/monaco-languageclient/pull/58))

## [0.3.0] - 2018-02-08

- fix handling of `codeLens/resolve` if no provider exists ([#46](https://github.com/TypeFox/monaco-languageclient/pull/46))
- removed `monaco-editor-core` dependency, keeping only `monaco-editor` ([#42](https://github.com/TypeFox/monaco-languageclient/issues/42))
- fix typings in `glob-to-regexp`([#49](https://github.com/TypeFox/monaco-languageclient/pull/49))

## [0.2.1] - 2018-01-14

- allow a `rootUri` to be set with `createMonacoServices` ([#31](https://github.com/TypeFox/monaco-languageclient/issues/31))

## [0.2.0] - 2017-08-30

- handle `number` value of zero in a `Diagnostic`'s `code` ([#14](https://github.com/TypeFox/monaco-languageclient/pull/14))
- add support to lazily load Monaco ([#19](https://github.com/TypeFox/monaco-languageclient/pull/19))
- add support for `textDocument/codeActions` and `workspace/executeCommand` ([#21](https://github.com/TypeFox/monaco-languageclient/pull/21))
- updated dependency to Monaco 0.10 ([#29](https://github.com/TypeFox/monaco-languageclient/pull/29))

## 0.1.0 - 2017-0

- initial 0.1.0 release, depends on Monaco 0.9.0

[0.13.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.10.2...v0.11.0
[0.10.2]: https://github.com/TypeFox/monaco-languageclient/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/TypeFox/monaco-languageclient/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.7.3...v0.8.0
[0.7.3]: https://github.com/TypeFox/monaco-languageclient/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/TypeFox/monaco-languageclient/compare/v0.7.0...v0.7.2
[0.7.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.6.3...v0.7.0
[0.6.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.4.0...v0.6.1
[0.4.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/TypeFox/monaco-languageclient/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/TypeFox/monaco-languageclient/compare/v0.1.0...v0.2.0
