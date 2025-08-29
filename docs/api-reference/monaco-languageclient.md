# API Reference: monaco-languageclient

This document provides a detailed API reference for the `monaco-languageclient` package.

## Installation

```bash
npm install monaco-languageclient
```

## `MonacoLanguageClient`

This is the main class in the `monaco-languageclient` package. It extends the `BaseLanguageClient` from `vscode-languageclient` and provides the logic for connecting the Monaco editor to a language server.

### `MonacoLanguageClientOptions`

The `MonacoLanguageClient` constructor accepts an object with the following properties:

-   **`name`**: `string`

    The name of the language client.

-   **`id`**: `string` (optional)

    An optional ID for the language client. If not provided, the name will be used.

-   **`clientOptions`**: `LanguageClientOptions`

    The options for the language client. These are the same options that are passed to the `LanguageClient` constructor in `vscode-languageclient`.

-   **`messageTransports`**: `MessageTransports`

    The message transports to use for communicating with the language server.

## Example

```typescript
import { MonacoLanguageClient } from 'monaco-languageclient';
import { MessageTransports } from 'vscode-languageclient/browser';
import { createWebSocketConnection } from 'vscode-ws-jsonrpc';

const url = 'ws://localhost:8080/sample-server';
const webSocket = new WebSocket(url);

const connection = createWebSocketConnection(webSocket, new ConsoleLogger());

const client = new MonacoLanguageClient({
    name: 'Sample Language Client',
    clientOptions: {
        documentSelector: ['plaintext'],
    },
    messageTransports: connection,
});

client.start();
```
