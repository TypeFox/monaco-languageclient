# Getting Started

This guide will walk you through creating your first Monaco Language Client application. We'll build a simple JSON editor with language server support.

## Prerequisites

Before you begin, ensure you have:

- Completed the [Installation](../installation.md) steps
- A basic understanding of TypeScript and web development
- A running development server (like Vite, webpack dev server, or something similar)

## Your First Language Client

We'll create a simple JSON editor that connects to a language server via WebSocket. In this example, we'll use Extended Mode.

The steps below will outline the process at large, and then further below we'll break down the relevant sections to explain what each part does.

### Step 1: HTML Setup

Create a basic HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monaco Language Client - JSON Example</title>
</head>
<body>
    <div id="monaco-editor-root" style="height: 100vh;"></div>
    <script type="module" src="./main.ts"></script>
</body>
</html>
```

### Step 2: Basic TypeScript Setup

Create your main TypeScript file (`main.ts`):

```typescript
// Import required extensions for JSON support
import '@codingame/monaco-vscode-json-default-extension';

// Import Monaco Language Client components
import { EditorApp } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

// VS Code API for file system operations
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';

async function createJsonEditor() {
    // Sample JSON content
    const jsonContent = `{
    "$schema": "http://json.schemastore.org/package",
    "name": "my-package",
    "version": "1.0.0",
    "description": "A sample package"
}`;

    // Set up file system
    const fileUri = vscode.Uri.file('/workspace/package.json');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, jsonContent));
    registerFileSystemOverlay(1, fileSystemProvider);

    // Configure the editor
    const htmlContainer = document.getElementById('monaco-editor-root')!;

    // Monaco VS Code API configuration
    const vscodeApiConfig = {
        $type: 'extended' as const,
        htmlContainer,
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off'
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // Language client configuration
    const languageClientConfig = {
        connection: {
            options: {
                $type: 'WebSocketUrl' as const,
                url: 'ws://localhost:30000/sampleServer',
                startOptions: {
                    onCall: () => console.log('Connected to JSON language server'),
                    reportStatus: true
                }
            }
        },
        clientOptions: {
            documentSelector: ['json'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    };

    // Create the wrapper
    const wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await wrapper.init();

    // Create language client wrapper
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init(languageClientConfig);

    // Create the editor app
    const editorApp = new EditorApp({
        codeResources: {
            main: {
                uri: fileUri.toString(),
                fileExt: 'json'
            }
        }
    });

    await editorApp.init(wrapper);
    console.log('JSON editor with language client is ready!');
}

// Start the editor
createJsonEditor().catch(console.error);
```

### Step 3: Language Server Setup

For this example to work, you'll need a JSON language server running on `ws://localhost:30000/sampleServer`.

The easiest way to test this is to use the example from this repository:

```bash
# In the monaco-languageclient repository
npm install
npm run start:example:server:json
```

This starts a JSON language server that our client can connect to.

### Step 4: Run Your Example

Start your development server and open your HTML file. You should see:

1. **Monaco Editor** loaded with the JSON content
2. **Syntax highlighting** for JSON
3. **IntelliSense** when you type (try adding new properties)
4. **Error detection** if you introduce JSON syntax errors
5. **Schema validation** based on the `$schema` property

## Understanding the Code

Let's break down what each part does:

### Extensions Import
```typescript
import '@codingame/monaco-vscode-json-default-extension';
```
This loads the JSON language support, including syntax highlighting and basic language features.

### File System Setup
```typescript
const fileSystemProvider = new RegisteredFileSystemProvider(false);
fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, jsonContent));
registerFileSystemOverlay(1, fileSystemProvider);
```
Creates an in-memory file system so the editor has a "file" to work with. This is required for language servers to function properly, as it needs a file system provider to access your files.

### WebSocket Connection
```typescript
connection: {
    options: {
        $type: 'WebSocketUrl',
        url: 'ws://localhost:30000/sampleServer'
    }
}
```
Connects to an external language server via WebSocket. The language server then provides JSON language support.

## Next Steps

Congratulations! If everything worked as expected, then you've created your first Monaco Language Client integration. From here you can:

1. **Explore [Configuration](configuration.md)** to customize the editor behavior
2. **Check out [Examples](examples.md)** for other language server integrations
3. **Learn about [Extended Mode](../advanced-usage/extended-mode.md)** for more VS Code-like features
4. **Try [Web Workers](../advanced-usage/web-workers.md)** for in-browser language servers

## Troubleshooting

**Editor doesn't load**: Check browser console for errors. Ensure all dependencies are installed.

**No language features**: Verify the language server is running and the WebSocket connection is successful.

**Import errors**: Make sure you have the correct package versions and bundler configuration from the [Installation guide](../installation.md).

For more help, see our [Troubleshooting Guide](../guides/troubleshooting.md).
