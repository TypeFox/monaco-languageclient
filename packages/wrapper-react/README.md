# React component for Monaco-Editor and Monaco Languageclient

This packages provides a React component that it based on the [monaco-editor-wrapper](https://www.npmjs.com/package/monaco-editor-wrapper). It behaves nearly the same way as the monaco editor, with the primary difference being that you interact with it through a React component.

The [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) can be activated to connect to a language server either via jsonrpc over a websocket to an exernal server process, or via the Language Server Protocol for the browser where the language server runs in a web worker.

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md).

## Getting Started

This is npm package is part of the [monaco-languageclient mono repo](https://github.com/TypeFox/monaco-languageclient). Please follow the main repositories [instructions](https://github.com/TypeFox/monaco-languageclient#getting-started) to get started with local development.

## Usage

You can import the monaco react component for easy use in an existing React project. Below you can see a quick example of a fully functional implementation in TypeScript. The react component uses the same `UserConfig` approach which is then applied to `monaco-editor-wrapper`.

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@codingame/monaco-vscode-python-default-extension';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';

const wrapperConfig: WrapperConfig = {
  $type: 'extended',
  htmlContainer: document.getElementById('monaco-editor-root')!,
  editorAppConfig: {
    codeResources: {
      modified: {
              uri: '/workspace/hello.py',
              text: 'print("Hello, World!")'
      }
    }
  }
};

const comp = <MonacoEditorReactComp
    wrapperConfig={wrapperConfig}
    style={{ 'height': '100%' }}
    onLoad={(wrapper: MonacoEditorLanguageClientWrapper) => {
        // use the wrapper to get access to monaco-editor or the languageclient
    }}
/>;
ReactDOM.createRoot(document.getElementById('react-root')!).render(comp);

```

## Examples

For a detailed list of examples please look at [this section](<https://github.com/TypeFox/monaco-languageclient#examples-overview>) in the main repository.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
