# Getting Started

This guide will walk you through creating your first Monaco Language Client application. We'll start by building a simple JSON editor with language server support.

## Prerequisites

Before you begin, ensure you have:

- Completed the [Installation](../installation.md) steps in advance
- A basic understanding of TypeScript and web development
- A running development server (like Vite, webpack dev server, or something similar)
- This project cloned down so you can start up a JSON language server for testing

## Your First Language Client

We'll create a simple JSON editor that connects to a language server via WebSocket. We'll be using Extended Mode in this example.

The steps below will outline the steps, and then further below we'll break down the relevant sections to explain what each part does.

### HTML Setup

Start by creating a basic HTML file to give a place for monaco to setup:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monaco Language Client - JSON Example</title>
</head>
<body>
    <div id="monaco-editor-root" style="height: 600px; width: 600px;"></div>
    <script type="module" src="./main.ts"></script>
</body>
</html>
```

If you already have one setup, just be sure to add the root element for the Monaco Editor to attach to.

If you're following along using Vite with the React TS template, you can add this to your main component (App.tsx):
```tsx
<div id="monaco-editor-root" style={{ height: '600px', width: '600px', textAlign: 'left' }}></div>
```

### Add Required Dependencies

We can rely on an extension package that provides JSON language client support for the Monaco VSCode API, and giving us syntax highlighting as well. You can install it via npm.

Note the version 23, which is intended for use with monaco-languageclient v10.4.x. If your project is using a different version of monaco-languageclient, be sure to match all `@codinggame/...` extensions accordingly. See the [version compatibility table](versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) for which versions to use.

```shell
npm install @codingame/monaco-vscode-json-default-extension@23
```

### Updating Vite Config (if using Vite)

Be sure to update your `vite.config.ts` to include the `importMetaUrlPlugin`, which is required for the Monaco Language Client to function properly in dev mode when loading up vsix extensions. For more details, see the [Troubleshooting Guide on Vite](./troubleshooting.md#if-you-use-vite).

You may also need to install the plugin if you haven't already.

```shell
npm install @codingame/esbuild-import-meta-url-plugin
```

Then update your `vite.config.ts` as follows:

```typescript
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'

export default {
    // ... other vite config options
    plugins: [
      importMetaUrlPlugin,
      // ... other plugins
    ],
    worker: {
      format: 'es'
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [importMetaUrlPlugin]
      }
    }
}
```

### Monaco Editor & Language Client Setup

Create your main TypeScript file (`main.ts`). If you already have a TypeScript setup, you can integrate the following code into your existing project.

Note that we'll still need a running language server for JSON language support, the client just provides the means to connect to it. We'll cover that in the next step after this one.

Once you have that installed, you can setup your `main.ts` file as follows to setup the editor & language client:

```typescript

// import Monaco Language Client components
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

// VSCode API for file system operations
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';

// import extension for JSON support
import "@codingame/monaco-vscode-json-default-extension";

// Sample JSON content
const jsonContent = `{
    "$schema": "http://json.schemastore.org/package",
    "name": "my-package",
    "version": "1.0.0",
    "description": "A sample package"
}`;

async function createJsonEditor() {
    // Set up an in-memory file system (won't persist on reload)
    const fileUri = vscode.Uri.file('/workspace/package.json');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(fileUri, jsonContent));
    registerFileSystemOverlay(1, fileSystemProvider);

    // Monaco VSCode API configuration
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: document.getElementById("monaco-editor-root")!
        },
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
              'editor.guides.bracketPairsHorizontal': 'active',
              'editor.lightbulb.enabled': 'On',
              'editor.wordBasedSuggestions': 'off',
              'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const languageId = 'json';

    // Language client configuration
    const languageClientConfig: LanguageClientConfig = {
        languageId,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30000/sampleServer'
            }
        },
        clientOptions: {
            documentSelector: [languageId],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.file('/workspace')
            }
        }
    };

    // editor app / monaco-editor configuration
    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: jsonContent,
                uri: fileUri.path,
            }
        }
    };

    // create the monaco-vscode api Wrapper
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    // create language client wrapper & app
    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
    const editorApp = new EditorApp(editorAppConfig);

    // start editor app first, then language client
    await editorApp.start(document.getElementById("monaco-editor-root")!);
    await lcWrapper.start();

    console.log('JSON editor with language client is ready!');
}
createJsonEditor().catch(console.error);
```

After this you can run `npm run build` to verify things & `npm run dev` (or an equivalent for your stack) to start a development server. You should see a Monaco Editor instance load up in your browser, with code, but no language support or highlighting yet (we'll cover that next).

### Language Server Setup

For this example to work, you'll need a JSON language server running on `ws://localhost:30000/sampleServer`.

The easiest way to test this is to use the example from this repository:

```shell
# In the monaco-languageclient repository
npm install
npm run start:example:server:json
```

This starts a JSON language server that our client is expecting to connect to.

### Run Your Example

Go back to your development server and reload the page. You should see the same Monaco Editor instance but with language support.

In addition to the basic editor functionality, you should also see:

- **Syntax highlighting** for JSON
- **IntelliSense** when you type (try adding new properties)
- **Error detection** if you introduce JSON syntax errors

If you see the content aligned strangely to the right, make sure that `text-align` isn't set to a particular direction (ex. `right` or `center`) in your styles.

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

1. **Explore [Configuration](./configuration.md)** to customize the editor behavior
2. **Check out [Examples](./examples.md)** for other language server integrations

## Troubleshooting

**Editor doesn't load**: Check browser console for errors. Ensure all dependencies are installed. Also if the language server is offline, this will block the editor & client from starting up.

Also ensure that you have compatible versions of `monaco-languageclient` and any `@codingame/...` extensions you are using. If there's a discrepancy here your editor or language client integration likely won't work, and you may not see any errors in the console. See the [version compatibility table](versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) for reference.

**No language features**: Verify the language server is running and the WebSocket connection is successful.

**Import errors**: Make sure you have the correct package versions and bundler configuration from the [Installation guide](../installation.md).


For more help, see our [Troubleshooting Guide](./troubleshooting.md).
