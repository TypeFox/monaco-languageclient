# Extended Mode with Langium

This guide demonstrates how to integrate [Langium](https://langium.org/)-based language servers with the `monaco-languageclient` in Extended Mode. Extended mode provides VSCode-compatible services that support powerful features for Langium language servers running in the browser.

## Why Use Extended Mode with Langium?

Extended mode brings several key advantages when working with Langium language servers:

- **VSCode Services Integration**: Access to a file system, workspace, keybindings, and other VSCode APIs that Langium language servers expect
- **Extension System**: Proper language registration with syntax highlighting, configuration files, and language contributions
- **Multi-file Workspaces**: Support for complex projects with multiple files and proper workspace management
- **Advanced Features**: Features like go-to-definition across files, project-wide refactoring, and workspace-wide validation work seamlessly

## Architecture Overview

In extended mode, Langium language servers run as Web Workers and communicate with the Monaco editor through the VSCode API wrapper:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Monaco Editor │◄──►│ VSCode API      │◄──►│ Langium Language    │
│                 │    │ Wrapper          │    │ Server (Web Worker) │
│   + Extensions  │    │ + Services       │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Implementation Patterns

This project includes two comprehensive Langium examples demonstrating different approaches:

### 1. Built-in Grammar Server (`langium-dsl`)

**Location**: `packages/examples/src/langium/langium-dsl/`
**Use case**: Editing Langium grammar files (`.langium`) with built-in language support

This example uses Langium's built-in grammar services to provide rich editing support for `.langium` files. In fact, we at TypeFox leverage something quite similar to this in our own [Langium playground](https://langium.org/playground).

```typescript
// Worker implementation (langium-server.ts)
import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { createLangiumGrammarServices } from 'langium/grammar';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';

const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

const context = {
    connection: createConnection(messageReader, messageWriter),
    ...EmptyFileSystem
};
const { shared } = createLangiumGrammarServices(context);

startLanguageServer(shared);
```

### 2. Custom DSL Server (`statemachine`)

**Location**: `packages/examples/src/langium/statemachine/`
**Use case**: Custom state machine DSL with validation and language features

This example implements a complete custom DSL with its own grammar, validation, and services:

```typescript
// Worker implementation (statemachine-server-start.ts)
import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { createStatemachineServices } from '../ls/statemachine-module.js';

export const start = (port: MessagePort | DedicatedWorkerGlobalScope, name: string) => {
    const messageReader = new BrowserMessageReader(port);
    const messageWriter = new BrowserMessageWriter(port);
    const connection = createConnection(messageReader, messageWriter);

    const { shared } = createStatemachineServices({ connection, ...EmptyFileSystem });
    startLanguageServer(shared);
};
```

## Client-Side Setup

### Basic Configuration

The extended mode setup involves several key components:

```typescript
import * as vscode from 'vscode';
import { InMemoryFileSystemProvider, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';

// 1. Set up the Web Worker
const worker = new Worker(workerUrl, {
    type: 'module',
    name: 'Langium LS'
});

// 2. Create message readers/writers
const reader = new BrowserMessageReader(worker);
const writer = new BrowserMessageWriter(worker);

// 3. Set up VSCode API with extended mode
const vscodeApiConfig = {
    $type: 'extended' as const,
    logLevel: LogLevel.Debug,
    htmlContainer: document.body,
    serviceOverrides: {
        ...getKeybindingsServiceOverride()
    },
    monacoWorkerFactory: configureDefaultWorkerFactory,
    // Extension registration for language support
    extensions: [{
        config: {
            contributes: {
                languages: [{
                    id: 'your-language-id',
                    extensions: ['.your-ext'],
                    configuration: '/workspace/language-configuration.json'
                }],
                grammars: [{
                    language: 'your-language-id',
                    scopeName: 'source.your-language',
                    path: '/workspace/textmate-grammar.json'
                }]
            }
        },
        filesOrContents: extensionFilesMap
    }]
};

// 4. Configure the Language Client
const languageClientConfig = {
    clientOptions: {
        documentSelector: ['your-language-id']
    },
    connection: {
        options: {
            $type: 'WorkerDirect',
            worker
        },
        messageTransports: { reader, writer }
    }
};

// 5. Initialize everything
const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();

const lcWrapper = new LanguageClientWrapper(languageClientConfig);
await lcWrapper.start();

const editorApp = new EditorApp({
    $type: 'extended',
    codeResources: {
        main: {
            text: 'your code here',
            uri: '/workspace/example.your-ext'
        }
    }
});
await editorApp.start(apiWrapper.getHtmlContainer());
```

### File System Integration

Extended mode supports in-memory file systems for complex workspaces:

```typescript
// Set up in-memory file system
const workspaceUri = vscode.Uri.file('/workspace');
const fileSystemProvider = new InMemoryFileSystemProvider();

// Create workspace and files
await fileSystemProvider.mkdir(workspaceUri);
await fileSystemProvider.writeFile(
    vscode.Uri.file('/workspace/example.langium'),
    textEncoder.encode(fileContent),
    { create: true, overwrite: true }
);

// Register the file system overlay
registerFileSystemOverlay(1, fileSystemProvider);
```

## Advanced Patterns

### Message Channel Communication

For more complex communication patterns, you can use `MessageChannel`:

```typescript
// Create message channel
const channel = new MessageChannel();
worker.postMessage({ port: channel.port2 }, [channel.port2]);

// Use the channel port for LSP communication
const reader = new BrowserMessageReader(channel.port1);
const writer = new BrowserMessageWriter(channel.port1);
```

### Multiple Editors with Shared Language Server

Extended mode supports multiple editor instances sharing a single language server:

```typescript
// First editor
const editorApp1 = new EditorApp({
    $type: 'extended',
    codeResources: {
        main: { text: content1, uri: '/workspace/file1.ext' }
    }
});

// Second editor (reuses the same language client)
const editorApp2 = new EditorApp({
    $type: 'extended',
    codeResources: {
        main: { text: content2, uri: '/workspace/file2.ext' }
    }
});
```

## Running the Examples

The project includes working examples you can run immediately:

```shell
# Install dependencies and build
npm ci && npm run build

# Start the development server
npm run dev
```

Visit `http://localhost:20001` and try:

- **Langium Grammar DSL**: Edit `.langium` grammar files with syntax highlighting and validation
- **Statemachine DSL**: Work with custom state machine definitions

### Example Files

- **Langium Grammar**: `packages/examples/langium_extended.html`
- **Statemachine DSL**: `packages/examples/statemachine.html`
- **React Integration**: `packages/examples/react_statemachine.html`

## Key Benefits of Extended Mode

1. **Language Registration**: Proper language ID registration with VSCode's extension system
2. **Syntax Highlighting**: TextMate grammar support for rich syntax highlighting
3. **Configuration Files**: Language-specific settings and configuration
4. **Workspace Services**: Full workspace awareness with multi-file projects
5. **VSCode Compatibility**: Features that Langium language servers expect from VSCode

## Next Steps

- Explore the complete examples in `packages/examples/src/langium/`
- Check out the [React integration guide](./react-integration.md) for using Langium with React
- See [Web Workers guide](./web-workers.md) for advanced worker patterns
- Review the [API Reference](../api-reference/monaco-languageclient.md) for detailed configuration options

The extended mode provides the full power of VSCode's architecture for your Langium-based language servers, enabling rich editing experiences that work seamlessly in the browser.
