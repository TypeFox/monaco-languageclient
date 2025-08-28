# API Reference

This section provides comprehensive documentation for all Monaco Language Client APIs, including classes, methods, interfaces, and configuration options.

## Package Overview

Monaco Language Client consists of several packages, each with their own APIs:

- **[Monaco Language Client](monaco-languageclient.md)** - Core package with language client functionality
- **[VSCode WS JSON-RPC](vscode-ws-jsonrpc.md)** - WebSocket JSON-RPC communication layer
- **[Monaco Editor React](monaco-editor-react.md)** - React wrapper components and hooks
- **[Configuration Schema](configuration-schema.md)** - Complete configuration options reference

## Quick Reference

### Core Classes

```typescript
// Main language client
import { MonacoLanguageClient } from 'monaco-languageclient';

// VS Code API wrapper
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

// Language client wrapper
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

// Editor application
import { EditorApp } from 'monaco-languageclient/editorApp';
```

### Configuration Types

```typescript
// Wrapper configuration
import { WrapperConfig } from 'monaco-languageclient/editorApp';

// Language client configuration
import { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

// VS Code API configuration
import { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
```

### React Components

```typescript
// React wrapper component
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
```

## Common Patterns

### Basic Language Client Setup
```typescript
const client = new MonacoLanguageClient({
    name: 'Example Client',
    clientOptions: {
        documentSelector: ['json']
    },
    connection: createWebSocketConnection(webSocket, console)
});

await client.start();
```

### Extended Mode Configuration
```typescript
const wrapper = new MonacoVscodeApiWrapper({
    $type: 'extended',
    htmlContainer: document.getElementById('editor')!
});

await wrapper.init();
```

### WebSocket Connection
```typescript
const config = {
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:3000/languageserver'
        }
    }
};
```

## TypeScript Support

All packages include full TypeScript definitions. Import types as needed:

```typescript
import type { 
    WrapperConfig,
    LanguageClientConfig,
    MonacoVscodeApiConfig 
} from 'monaco-languageclient';
```

## API Documentation Structure

Each API reference page includes:

- **Overview** - Package purpose and key concepts
- **Installation** - Package-specific installation instructions  
- **Classes** - Main classes with methods and properties
- **Interfaces** - TypeScript interfaces and types
- **Configuration** - Configuration options and examples
- **Examples** - Practical usage examples
- **Migration Notes** - Changes between versions

## Version Compatibility

API documentation corresponds to:
- **monaco-languageclient**: 10.0.0
- **@typefox/monaco-editor-react**: 7.0.0  
- **vscode-ws-jsonrpc**: 3.5.0

For version-specific changes, see [Versions and History](../versions-and-history.md).

## Getting Help

- **Not finding what you need?** Check the [Examples](../examples/index.md) section
- **Integration issues?** See [Troubleshooting](../guides/troubleshooting.md)
- **Questions?** Visit our [FAQ](../faq.md) or [GitHub Issues](https://github.com/TypeFox/monaco-languageclient/issues)