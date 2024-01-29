# Monaco Editor and Monaco Languageclient Wrapper

This packages provides a wrapped `monaco-editor` with or without language support (main package export). The `monaco-languageclient` can be activated to connect to a language server either via jsonrpc over a websocket to an external server process or via language server protocol for browser where the language server runs in a web worker.

## Getting Started

We recommend using [Volta](https://volta.sh/) to ensure your node & npm are on known good versions.

If you have node.js LTS available, then from the root of the project run:

```bash
npm i
npm run build
```

This will clean, compile and build a bundle of the `monaco-editor-wrapper`, which you can reference in your own projects. For examples, you can see the top-level [README](../../README.md#getting-started) with details on running a local dev instance.

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
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';

// no top-level await
const run = async () => {
  const wrapper = new MonacoEditorLanguageClientWrapper();
  const code: `function sayHello(): string {
  return "Hello";
};`,
  const userConfig = {
    wrapperConfig: {
      editorAppConfig: {
        $type: 'classic',
        languageId: 'typescript',
        code,
        useDiffEditor: false,
      }
    }
  };

  const htmlElement = document.getElementById('monaco-editor-root');
  await wrapper.initAndStart(userConfig, htmlElement);
}
```

## Examples

These are the examples specifically for `monaco-editor-wrapper` you find in the repository:

- TypeScript editor worker using classic mode, [see](../examples/wrapper_ts.html)
- Language client & web socket language server example using extended mode [see](../examples/wrapper_ws.html) It requires the json language server to run. Use `start:server:json` from [here](../examples/package.json)
- Multiple editors using classic mode [see](../examples/wrapper_adv.html)
- Langium statemachine language client and web worker based language server using extended mode [see](../examples/wrapper_statemachine.html)
- Langium grammar language client and web worker based language server allowing to choose classic or extended mode [see](../examples/wrapper_langium.html)
