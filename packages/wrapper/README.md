# Monaco Editor and Monaco Languageclient Wrapper

This packages provides a wrapped `monaco-editor` with or without language support (main package export). The `monaco-languageclient` can be activated to connect to a language server either via jsonrpc over a websocket to an external server process or via language server protocol for browser where the language server runs in a web worker.

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/CHANGELOG.md).

## Getting Started

This is npm package is part of the [monaco-languageclient mono repo](https://github.com/TypeFox/monaco-languageclient). Please follow the main repositories [instructions](https://github.com/TypeFox/monaco-languageclient#getting-started) to get started with local development.

## Configuration

With release >2.0.0, the configuration approach is completely revised.

The `UserConfig` now contains everything and is passed to the `start` function of the wrapper along with the HTML element `monaco-editor` is bound to.

[@codingame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api) implements the VSCode api and redirects calls to `monaco-editor`. It allows to add serivccs that are usually only available in VSCode and not with pure `monaco-editor`.
 `UserConfig` allows two possible configuration modes:

- **Classic**: Configure `monaco-editor` as you would when using it directly, [see](./src/editorAppClassic.ts)
- **Extended**: Configure `monaco-editor` like a VSCode extension, [see](./src/editorAppExtended.ts)

[This](https://github.com/CodinGame/monaco-vscode-api#monaco-standalone-services) is the list of services defined by [@codingame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api).
The following services are enabled by default in both editor modes:

- layout
- environment
- extension
- files
- quickAccess
- languages
- model
- configuration

**Extended** mode adds the following and thereby disables monarch grammars:

- theme
- textmate

If you want any further services than the ones initialized by default, you should use the **extended** mode as some service (like *theme* and *textmate*) are incompatible with the **classic** mode.

Monarch grammars and themes can only be used in **classic** mode and textmate grammars and themes can only be used in **extended** mode.

## Usage

Monaco Editor with TypeScript language support in web worker and relying on classic mode:

```ts
import '@codingame/monaco-vscode-python-default-extension';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';

// no top-level await
const run = async () => {
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const userConfig = {
    wrapperConfig: {
      editorAppConfig: {
        $type: 'extendend',
        codeResources: {
          main: {
            text: 'print("Hello, World!")',
            uri: '/workspace/hello.py'
          }
        }
      }
    }
  };

  const htmlElement = document.getElementById('monaco-editor-root');
  await wrapper.initAndStart(userConfig, htmlElement);
}
```

## Examples

For a detailed list of examples please look at [this section](<https://github.com/TypeFox/monaco-languageclient#examples-overview>) in the main repository.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper/LICENSE)
