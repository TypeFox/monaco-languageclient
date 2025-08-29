# Configuration Schema Reference

This document provides a detailed reference for the configuration objects and options used in `monaco-languageclient`.

## Top-Level Configuration (`WrapperConfig`)

This is the main configuration object passed to the `MonacoEditorReactComp` or used to initialize the editor wrapper.

```typescript
export interface WrapperConfig {
    $type: 'extended' | 'classic';
    htmlContainer: HTMLElement;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
}
```

-   **`$type`**: `'extended' | 'classic'`
    -   Specifies the integration mode. `extended` provides a rich, VS Code-like experience, while `classic` is a more lightweight integration.
-   **`htmlContainer`**: `HTMLElement`
    -   The DOM element where the Monaco editor will be rendered.
-   **`editorAppConfig`**: `EditorAppConfig`
    -   Configuration for the editor itself. See [Editor Application Configuration](#editor-application-configuration).
-   **`languageClientConfig`**: `LanguageClientConfig`
    -   Configuration for the language client(s). See [Language Client Configuration](#language-client-configuration).

## Editor Application Configuration (`EditorAppConfig`)

Defines the behavior and content of the editor.

```typescript
export interface EditorAppConfig {
    $type: 'classic' | 'extended';
    codeResources?: {
        main: {
            text: string;
            uri: string;
            fileExt?: string;
        };
        original?: {
            text: string;
            uri: string;
            fileExt?: string;
        };
    };
    useDiffEditor?: boolean;
    monacoEditorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
}
```

-   **`$type`**: `'classic' | 'extended'`
    -   Matches the top-level `$type`.
-   **`codeResources`**: `object`
    -   Defines the code to be loaded into the editor.
    -   `main`: The primary code to display.
    -   `original`: In a diff editor, this is the original code to compare against.
-   **`useDiffEditor`**: `boolean`
    -   If `true`, a diff editor will be used.
-   **`monacoEditorOptions`**: `monaco.editor.IStandaloneEditorConstructionOptions`
    -   An object of options to pass directly to the Monaco editor upon construction.

## Language Client Configuration (`LanguageClientConfigs`)

An object containing one or more language client configurations, keyed by a unique identifier.

```typescript
export interface LanguageClientConfigs {
    [key: string]: LanguageClientConfig;
}
```

## Individual Language Client Configuration (`LanguageClientConfig`)

Configuration for a single language client.

```typescript
export interface LanguageClientConfig {
    connectionProvider: ConnectionProvider;
    clientOptions: LanguageClientOptions;
}
```

-   **`connectionProvider`**: `ConnectionProvider`
    -   Defines how to connect to the language server. See [Connection Configuration](#connection-configuration).
-   **`clientOptions`**: `LanguageClientOptions`
    -   Options from `vscode-languageclient` to configure the client's behavior, such as `documentSelector` and `initializationOptions`.

## Connection Configuration (`ConnectionConfig`)

Defines the transport mechanism for communicating with the language server.

```typescript
export interface ConnectionConfig {
    $type: 'WebSocket' | 'WebSocketUrl' | 'Worker' | 'MessagePort';
    worker?: Worker;
    url?: string;
    reader?: MessageReader;
    writer?: MessageWriter;
}
```

-   **`$type`**: `'WebSocket' | 'WebSocketUrl' | 'Worker' | 'MessagePort'`
    -   `WebSocket`: Connect via an existing `WebSocket` object.
    -   `WebSocketUrl`: Connect to a WebSocket by providing a URL string.
    -   `Worker`: Connect to a language server running in a `Worker`.
    -   `MessagePort`: Use a `MessagePort` for communication, typically with a worker.
-   **`worker`**: `Worker`
    -   The `Worker` instance to connect to.
-   **`url`**: `string`
    -   The URL for a WebSocket connection.
-   **`reader`**: `MessageReader`
    -   A custom message reader.
-   **`writer`**: `MessageWriter`
    -   A custom message writer.

## VS Code API Configuration (`MonacoVscodeApiConfig`)

Configuration for the VS Code API wrapper, used in Extended Mode.

```typescript
export interface MonacoVscodeApiConfig {
    $type: 'extended';
    userConfiguration?: UserConfiguration;
    viewsConfig?: ViewsConfig;
    extensions?: ExtensionConfig[];
    monacoWorkerFactory?: WorkerFactoryConfig;
}
```

-   **`$type`**: `'extended'`
    -   Indicates that this is an Extended Mode configuration.
-   **`userConfiguration`**: `UserConfiguration`
    -   VS Code-like user settings, such as `workbench.colorTheme` and `editor.fontSize`.
-   **`viewsConfig`**: `ViewsConfig`
    -   Configuration for custom views.
-   **`extensions`**: `ExtensionConfig[]`
    -   An array of extension configurations to load.
-   **`monacoWorkerFactory`**: `WorkerFactoryConfig`
    -   Configuration for the Monaco editor worker factory. See [Worker Factory Configuration](#worker-factory-configuration).

## Worker Factory Configuration (`WorkerFactoryConfig`)

Defines how Monaco editor workers are loaded.

```typescript
export interface WorkerFactoryConfig {
    rootFolder: string;
    base: string;
    workerLoaders: {
        [key: string]: () => Worker;
    };
}
```

-   **`rootFolder`**: `string`
    -   The root folder for the application.
-   **`base`**: `string`
    -   The base path for worker scripts.
-   **`workerLoaders`**: `object`
    -   An object where keys are worker names (e.g., `editorWorkerService`, `textMateWorker`) and values are functions that return a `Worker` instance.
