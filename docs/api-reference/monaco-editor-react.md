# API Reference: @typefox/monaco-editor-react

This document provides a detailed API reference for the `@typefox/monaco-editor-react` package.

## Installation

```bash
npm install @typefox/monaco-editor-react monaco-languageclient @codingame/monaco-vscode-api
```

## `MonacoEditorReactComp`

This is the main React component provided by the package. It wraps the functionality of `monaco-languageclient` and the Monaco editor, allowing you to easily embed a feature-rich code editor in your React application.

### Props

The `MonacoEditorReactComp` accepts the following props:

-   **`style`**: `CSSProperties`

    An object of CSS properties to apply to the editor's container div.

-   **`className`**: `string`

    A CSS class name to apply to the editor's container div.

-   **`vscodeApiConfig`**: `MonacoVscodeApiConfig`

    The configuration for the Monaco VS Code API. This is required.

-   **`editorAppConfig`**: `EditorAppConfig`

    The configuration for the editor application. This is optional.

-   **`languageClientConfigs`**: `LanguageClientConfigs`

    The configuration for the language clients. This is optional.

-   **`onVscodeApiInitDone`**: `(monacoVscodeApiManager: MonacoVscodeApiWrapper) => void`

    A callback function that is called when the VS Code API has been initialized.

-   **`onEditorStartDone`**: `(editorApp?: EditorApp) => void`

    A callback function that is called when the editor application has started.

-   **`onLanguageClientsStartDone`**: `(lcsManager?: LanguageClientsManager) => void`

    A callback function that is called when the language clients have started.

-   **`onTextChanged`**: `(textChanges: TextContents) => void`

    A callback function that is called when the text in the editor changes.

-   **`onError`**: `(error: Error) => void`

    A callback function that is called when an error occurs.

-   **`onDisposeEditor`**: `() => void`

    A callback function that is called when the editor is disposed.

-   **`onDisposeLanguageClients`**: `() => void`

    A callback function that is called when the language clients are disposed.

-   **`modifiedTextValue`**: `string`

    The modified text value of the editor.

-   **`originalTextValue`**: `string`

    The original text value of the editor.

### `WrapperConfig`

The `wrapperConfig` prop is the main configuration object for the `MonacoEditorReactComp`. It has the following structure:

```typescript
export interface WrapperConfig {
    $type: 'extended' | 'classic';
    htmlContainer: HTMLElement;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
}
```

-   **`$type`**: The type of editor to use. Can be either `extended` or `classic`.
-   **`htmlContainer`**: The HTML element to use as the container for the editor.
-   **`editorAppConfig`**: The configuration for the editor application.
-   **`languageClientConfig`**: The configuration for the language client.

## Example

```tsx
import React from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { WrapperConfig } from 'monaco-languageclient/editorApp';
import '@codingame/monaco-vscode-json-default-extension';

const App: React.FC = () => {
    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        editorAppConfig: {
            codeResources: {
                main: {
                    text: '{\n  "name": "example"\n}',
                    uri: '/workspace/example.json',
                    fileExt: 'json'
                }
            }
        },
        languageClientConfig: {
            connection: {
                options: {
                    $type: 'WebSocketUrl',
                    url: 'ws://localhost:30000/sampleServer'
                }
            },
            clientOptions: {
                documentSelector: ['json']
            }
        }
    };

    return (
        <div style={{ height: '100vh' }}>
            <MonacoEditorReactComp
                wrapperConfig={wrapperConfig}
                style={{ height: '100%' }}
            />
        </div>
    );
};

export default App;
```
