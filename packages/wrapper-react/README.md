# React component for Monaco-Editor and Monaco Languageclient

This packages provides a React component that wraps the functionality of [monaco-languageclient](https://www.npmjs.com/package/monaco-languageclient) and all its tools.

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md).

## Official documentation, quick start and examples

This is npm package is part of the [monaco-languageclient mono repo](https://github.com/TypeFox/monaco-languageclient).

You find detailed information in the [official documentation](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/index.md).

If interested, check [quick start for local development](<https://github.com/TypeFox/monaco-languageclient#getting-started>).

A detailed list of examples is contained in the GitHub repository, please see [this listing](<https://github.com/TypeFox/monaco-languageclient#examples-overview>).

## Usage

You can import the monaco react component for easy use in an existing React project. Below you can see a quick example of a fully functional implementation in TypeScript. The react component uses the same configuration objects you using  `monaco-languageclient` directly with TypeScript/JavaScript.

The language client on start can connect to a language server either via jsonrpc over a websocket to an exernal server process, or directly in the browser where the language server runs in a web worker. In both cases they use the Language Server Protocol to communicate. The react component is limited to one language client per component.

```tsx
import * as vscode from 'vscode';
// Import Monaco Language Client components
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import React from 'react';
import ReactDOM from 'react-dom/client';

export const createEditorAndLanguageClient = async () => {
    const languageId = 'mylang';
    const code = '// initial editor content';
    const codeUri = '/workspace/hello.mylang';

    // Monaco VSCode API configuration
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off'
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // Language client configuration
    const languageClientConfig: LanguageClientConfig = {
        languageId,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                // at this url the language server for myLang must be reachable
                url: 'ws://localhost:30000/myLangLS'
            }
        },
        clientOptions: {
            documentSelector: [languageId],
            orkspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    };

    // editor app / monaco-editor configuration
    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            main: {
                text: code,
                uri: codeUri
            }
        }
    };

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);
    const App = () => {
        return (
            <div style={{ 'backgroundColor': '#1f1f1f' }} >
                <MonacoEditorReactComp
                    vscodeApiConfig={vscodeApiConfig}
                    editorAppConfig={editorAppConfig}
                    languageClientConfig={languageClientConfig}
                    style={{ 'height': '100%' }}
                    onError={(e) => {
                        console.error(e);
                    }} />
            </div>
        );
    };
    root.render(<App />);
};
createEditorAndLanguageClient();
```

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
