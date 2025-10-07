# Monaco Language Client

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

Module to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/CHANGELOG.md).

## Official documentation, quick start and examples

This is npm package is part of the [monaco-languageclient mono repo](https://github.com/TypeFox/monaco-languageclient).

You find detailed information in the [official documentation](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/index.md).

If interested, check [quick start for local development](<https://github.com/TypeFox/monaco-languageclient#getting-started>).

A detailed list of examples is contained in the GitHub repository, please see [this listing](<https://github.com/TypeFox/monaco-languageclient#examples-overview>).

## Version 10: A toolbox for language client applications

Since Version 2 this library relied on [@codingame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api) to supply the VSCode API (see [Important Project Changes](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#important-project-changes)). `monaco-vscode-api` has evolved substantially since then and thesedays provides 100+ packages with additional services, default extensions and language packs allowing you to create VSCode Web compatible applications.

Since `monaco-langaugeclient` version `10` all building blocks for complete web applications are contained in this package. The biggest deviation from the previous major versions is that the handling of monaco-vscode-api, the handling of language clients and the single editor app functionality are now very clearly separated. Instead of supplying an independent npm module (monaco-editor-wrapper), almost all useful pieces of code were moved here and the different functionalities are exposed via domain specific sub-exports:

- **vscodeApiWrapper**: Contains MonacoVscodeApiWrapper used to handle everything regarding monaco-vscode-api
- **lcwrapper**: LanguageClientWrapper & LanguageClientsManager help to control one or multiple language clients
- **editorApp**: EditorApp is used to control a single monaco-editor

### Usage

The `monaco-vscode-api` initialization and start-up can only and must been only done once within an applications' lifecycle. Everything else cab be repeated. If you use TypeScript all configuration is fully typed.

```typescript
import * as vscode from 'vscode';
// Import Monaco Language Client components
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

async function createEditorAndLanguageClient() {
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
        languageId: languageId,
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

    // Create the monaco-vscode api Wrapper and start it before anything else
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    // Create language client wrapper
    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
    await lcWrapper.start();

    // Create and start the editor app
    const editorApp = new EditorApp(editorAppConfig);
    const htmlContainer = document.getElementById('monaco-editor-root')!;
    await editorApp.start(htmlContainer);
}

createEditorAndLanguageClient().catch(console.error);
```

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/LICENSE)
