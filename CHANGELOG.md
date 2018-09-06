# Changelog
All notable changes to this project will be documented in this file.

## [0.9.0] - 2018-09.06

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
