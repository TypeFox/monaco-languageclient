# JSON Language Server Example

This example demonstrates a complete JSON editor integration with Monaco Language Client, featuring schema validation, IntelliSense, and error detection through the VS Code JSON Language Server.

## Features Demonstrated

- **Schema-based validation** using JSON Schema Store
- **IntelliSense and code completion** for JSON properties
- **Error highlighting** for syntax and schema violations
- **Hover information** showing property descriptions
- **Document formatting** and structure validation
- **Extended Mode integration** with VS Code services

## Complete Example Code

### HTML Setup
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>JSON Language Server Example</title>
    <style>
        body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        #monaco-editor-root { height: 100vh; }
    </style>
</head>
<body>
    <div id="monaco-editor-root"></div>
    <script type="module" src="./json-example.ts"></script>
</body>
</html>
```

### TypeScript Implementation
```typescript
// json-example.ts
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';

async function runJsonExample() {
    // Sample JSON content with schema reference
    const jsonContent = `{
    "$schema": "http://json.schemastore.org/package",
    "name": "my-awesome-package",
    "version": "1.0.0",
    "description": "An example package demonstrating JSON language server features",
    "main": "index.js",
    "scripts": {
        "start": "node index.js",
        "test": "jest"
    },
    "dependencies": {
        "express": "^4.18.0"
    },
    "devDependencies": {
        "jest": "^29.0.0"
    },
    "keywords": ["example", "json", "monaco"],
    "author": "Your Name",
    "license": "MIT"
}`;

    // Set up in-memory file system
    const packageJsonUri = vscode.Uri.file('/workspace/package.json');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(packageJsonUri, jsonContent));
    registerFileSystemOverlay(1, fileSystemProvider);

    // Configure VS Code API with JSON support
    const vscodeApiConfig = {
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Info,
        
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        
        userConfiguration: {
            json: JSON.stringify({
                // Theme and appearance
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.fontSize': 14,
                'editor.tabSize': 2,
                'editor.wordWrap': 'on',
                
                // JSON-specific settings
                'json.schemas': [
                    {
                        "fileMatch": ["package.json"],
                        "url": "http://json.schemastore.org/package"
                    }
                ],
                'json.format.enable': true,
                'json.validate.enable': true,
                
                // Editor enhancements
                'editor.quickSuggestions': true,
                'editor.suggest.insertMode': 'replace',
                'editor.bracketPairColorization.enabled': true,
                'editor.guides.bracketPairsHorizontal': 'active'
            })
        },
        
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    // Initialize VS Code API
    console.log('Initializing VS Code API...');
    const wrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await wrapper.init();

    // Configure JSON Language Server connection
    const languageClientConfig = {
        connection: {
            options: {
                $type: 'WebSocketUrl' as const,
                url: 'ws://localhost:30000/sampleServer',
                startOptions: {
                    onCall: () => {
                        console.log('Connected to JSON Language Server');
                    },
                    reportStatus: true
                },
                stopOptions: {
                    onCall: () => {
                        console.log('Disconnected from JSON Language Server');
                    },
                    reportStatus: true
                }
            }
        },
        clientOptions: {
            // Only handle JSON files
            documentSelector: ['json'],
            
            // Workspace configuration
            workspaceFolder: {
                index: 0,
                name: 'json-example-workspace',
                uri: vscode.Uri.file('/workspace')
            },
            
            // Language server initialization options
            initializationOptions: {
                provideFormatter: true,
                provideDocumentSymbols: true
            }
        }
    };

    // Initialize language client
    console.log('Connecting to JSON Language Server...');
    const lcWrapper = new LanguageClientWrapper();
    await lcWrapper.init(languageClientConfig);

    // Create editor application
    const editorApp = new EditorApp({
        codeResources: {
            main: {
                uri: packageJsonUri.toString(),
                fileExt: 'json'
            }
        }
    });

    console.log('Starting JSON editor...');
    await editorApp.init(wrapper);
    
    console.log('JSON Language Server example is ready!');
    console.log('Try editing the JSON to see:');
    console.log('- IntelliSense suggestions');
    console.log('- Schema validation errors');
    console.log('- Hover information');
    console.log('- Automatic formatting');
}

// Start the example
runJsonExample().catch(error => {
    console.error('Failed to start JSON example:', error);
});
```

## Running the Example

### Step 1: Start the JSON Language Server

The example requires a JSON language server running on WebSocket. Use the provided server:

```bash
# From the monaco-languageclient repository root
npm install
npm run start:example:server:json
```

This starts the JSON language server on `ws://localhost:30000/sampleServer`.

### Step 2: Set up Your Project

Create your project files:

```bash
mkdir json-example
cd json-example
npm init -y

# Install dependencies
npm install monaco-languageclient @codingame/monaco-vscode-api @codingame/monaco-vscode-editor-api
npm install @codingame/monaco-vscode-json-default-extension
npm install @codingame/monaco-vscode-files-service-override
npm install @codingame/monaco-vscode-keybindings-service-override
```

### Step 3: Configure Your Bundler

For Vite (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        dedupe: ['vscode']
    },
    worker: {
        format: 'es'
    }
});
```

### Step 4: Run Your Example

```bash
# Start your development server
npx vite

# Open http://localhost:5173 (or your server's URL)
```

## What You'll See

When the example runs successfully, you'll have a JSON editor with:

### 1. Schema-Based IntelliSense
- Type `"` and see property suggestions based on the package.json schema
- Get contextual completions for values (e.g., license types)

### 2. Real-Time Validation
- Syntax errors highlighted in red
- Schema violations shown with squiggly underlines
- Detailed error messages in hover tooltips

### 3. Hover Information
- Hover over properties to see descriptions from the schema
- Type information and allowed values displayed

### 4. Code Actions
- Right-click for formatting options
- Quick fixes for common schema issues

## Key Integration Points

### Schema Configuration
```typescript
'json.schemas': [
    {
        "fileMatch": ["package.json"],
        "url": "http://json.schemastore.org/package"
    }
]
```

The `$schema` property in the JSON file also automatically loads the appropriate schema.

### Language Server Communication
```typescript
connection: {
    options: {
        $type: 'WebSocketUrl',
        url: 'ws://localhost:30000/sampleServer'
    }
}
```

The WebSocket connection enables real-time communication with the external JSON language server.

### File System Integration
```typescript
const fileSystemProvider = new RegisteredFileSystemProvider(false);
fileSystemProvider.registerFile(new RegisteredMemoryFile(uri, content));
registerFileSystemOverlay(1, fileSystemProvider);
```

In-memory file system allows the language server to work with files without requiring actual file system access.

## Customization Options

### Custom Schemas
```typescript
'json.schemas': [
    {
        "fileMatch": ["*.config.json"],
        "schema": {
            "type": "object",
            "properties": {
                "apiUrl": { "type": "string", "format": "uri" },
                "timeout": { "type": "number", "minimum": 0 }
            }
        }
    }
]
```

### Additional JSON Files
```typescript
const configFiles = [
    { uri: '/workspace/package.json', content: packageJsonContent },
    { uri: '/workspace/tsconfig.json', content: tsconfigContent },
    { uri: '/workspace/.eslintrc.json', content: eslintContent }
];

configFiles.forEach(file => {
    const uri = vscode.Uri.file(file.uri);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(uri, file.content));
});
```

## Troubleshooting

### Language Server Not Connecting
1. Ensure the JSON language server is running on the correct port
2. Check browser console for WebSocket connection errors
3. Verify firewall/proxy settings aren't blocking the connection

### No IntelliSense or Validation  
1. Confirm the JSON file has a valid `$schema` property
2. Check that the schema URL is accessible
3. Verify the language client is properly initialized

### Performance Issues
1. Limit the number of open files in memory
2. Use appropriate worker configuration
3. Consider using Classic Mode for simpler use cases

## Next Steps

- **Try the [Python Pyright Example](python-pyright.md)** for a different language server
- **Explore [Custom Language Server](custom-language-server.md)** to build your own
- **Learn about [Extended Mode](../advanced-usage/extended-mode.md)** for more advanced features
- **Check [WebSocket Communication](../advanced-usage/websockets.md)** for external server details