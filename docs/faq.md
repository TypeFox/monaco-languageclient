# Frequently Asked Questions

## General Questions

### What is Monaco Language Client?

Monaco Language Client is a TypeScript library that connects the Monaco Editor with Language Server Protocol (LSP) servers. It enables web applications to provide rich language features like code completion, error checking, and navigation.

### When should I use Monaco Language Client?

Use Monaco Language Client when you need:

- Rich language features in web-based editors
- Support for multiple programming languages
- Integration with existing language servers
- VSCode-like functionality in custom applications

### How does it differ from regular Monaco Editor?

Regular Monaco Editor provides basic editing features and syntax highlighting. Monaco Language Client adds intelligent language features through LSP servers, including IntelliSense, diagnostics, go-to-definition, and more.

## Setup and Installation

### Which packages do I need to install?

For most use cases, you'll need:

```shell
# Core packages
npm install monaco-languageclient

# Required transient dependencies that are usually installed with the main lib
npm install @codingame/monaco-vscode-api @codingame/monaco-vscode-editor-api

# Language extensions (as needed)
npm install @codingame/monaco-vscode-java-default-extension

# For WebSocket communication
npm install vscode-ws-jsonrpc

# For React integration
npm install @typefox/monaco-editor-react
```

### Why do I need package overrides/resolutions?

Package overrides ensure all Monaco-related packages use compatible versions. Add this to your `package.json`:

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### What Node.js version do I need?

Monaco Language Client requires Node.js 20.10.0 or higher. Check with `node --version`.

## Architecture and Integration

### Should I use Extended Mode or Classic Mode?

- **Extended Mode**: Choose when you want VSCode-like functionality, rich services, and full LSP feature support
- **Classic Mode**: Choose for simpler integration, smaller bundle size, and direct Monaco Editor API access

### What's the difference between WebSocket and Web Worker communication?

- **WebSocket**: Connects to external language servers running in separate processes (Node.js, Python, etc.)
- **Web Worker**: Runs language servers in the browser using JavaScript/WASM implementations

### Can I use multiple language servers simultaneously?

Yes, You can configure multiple language clients for different file types:

```ts
// Java client
const javaLsClient = new LanguageClientWrapper({ /* Java language client config */ });
javaJsClient.start();

// JSON client
const jsonLSClient = new LanguageClientWrapper({ /* JSON language client config */ });
jsonJsClient.start();
```

## Development Issues

### I'm getting import errors. What's wrong?

Common causes:

1. **Missing overrides**: Ensure you have correct package overrides in `package.json`
2. **Bundler configuration**: Some bundlers need special configuration, please see the [troubleshooting guide](./guides/troubleshooting.md)
3. **ES modules**: Ensure your bundler supports ES module imports

### The editor loads but I don't see language features

Check that:

1. Language server is running and accessible
2. Language client configuration is correct
3. Document selector matches your file types
4. WebSocket connection is successful (check browser console)

### I'm seeing "Another version of monaco-vscode-api has already been loaded" error

This indicates version conflicts. Ensure all `@codingame/monaco-vscode-api` packages use the same version:

```shell
npm list @codingame/monaco-vscode-api
```

### Web Workers aren't loading properly

For web worker issues:

1. Check your bundler configuration for worker support
2. Ensure worker files are served correctly
3. Verify CORS settings if loading workers from different origins

## Language Server Specific

### How do I connect to my own language server?

Configure the connection in your language client:

```ts
const languageClientConfig = {
    languageId: 'my-language-id'
    connection: {
        options: {
            $type: 'WebSocketUrl',
            url: 'ws://localhost:YOUR_PORT/YOUR_PATH'
        }
    },
    clientOptions: {
        documentSelector: ['my-language-id-extension']
    }
};
```

### Can I use language servers not specifically built for VSCode?

Yes, any LSP-compliant language server can be used. The Language Server Protocol is standardized and language-agnostic.

### How do I debug language server communication?

Enable debug logging:

```ts
const vscodeApiConfig = {
    // Shows detailed communication logs
    logLevel: LogLevel.Debug,
    // ... other config
};
```

### My language server works in VSCode but not with Monaco Language Client

Check:

1. Initialization options - some servers need specific initialization parameters
2. Workspace configuration - ensure workspace folders are set correctly
3. Client capabilities - verify the client advertises required capabilities

## Performance and Bundle Size

### The bundle size is too large. How can I reduce it?

- Import only needed VSCode service overrides
- Use tree-shaking to eliminate unused code
- Consider lazy loading language extensions
- Last resort: Use Classic Mode instead of Extended Mode

### The editor is slow with large files

- Enable async tokenization: `'editor.experimental.asyncTokenization': true`
- Limit syntax highlighting for very large files
- Use Web Workers for language servers to avoid blocking the main thread

### Memory usage keeps growing

- Dispose of editors and language clients when no longer needed
- Limit the number of open files in memory
- Consider using Classic Mode for simpler scenarios

## Framework Integration

### How do I use Monaco Language Client with React?

Use `@typefox/monaco-editor-react`

```tsx
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';

<MonacoEditorReactComp
  vscodeApiConfig={{ /* vscodeApiConfig */ }}
  editorAppConfig={{ /* editorAppConfig */ }}
  languageClientConfig={{ /* languageClientConfig */ }}
  ...
/>
```

### Does it work with Vue/Angular/Svelte?

Yes, Monaco Language Client is framework-agnostic. You may need to:

1. Handle component lifecycle properly
2. Ensure proper cleanup when components unmount
3. Configure bundlers for your specific framework

### Can I use it with SSR frameworks like Next.js?

Monaco Language Client requires a browser environment. For SSR frameworks:

1. Use dynamic imports to load Monaco only on the client
2. Check if `window` is available before initializing
3. See the [Next.js verification example](https://github.com/TypeFox/monaco-languageclient/tree/main/verify/next)

## Troubleshooting

### Where can I find more detailed troubleshooting help?

Check the [Troubleshooting Guide](guides/troubleshooting.md) for comprehensive solutions to common issues.

### How do I report bugs or get help?

1. Check existing [GitHub issues](https://github.com/TypeFox/monaco-languageclient/issues)
2. Create a new issue with:
   - Monaco Language Client version
   - Browser and bundler information
   - Minimal reproduction code
   - Error messages and console logs

### Are there working examples I can reference?

Yes,the repository includes comprehensive examples:

1. Clone: `git clone https://github.com/TypeFox/monaco-languageclient.git`
2. Install: `npm install`
3. Run: `npm run dev`
4. Open: `http://localhost:20001`

## Advanced Usage

### Can I extend or customize language server behavior?

Yes, through:

1. Custom initialization options
2. Middleware to intercept LSP messages
3. Custom document selectors and file associations
4. Service overrides in Extended Mode

### How do I implement custom language features?

You can:

1. Build a custom language server using existing LSP libraries
2. Use Langium to create DSL-based language servers
3. Override specific VSCode services in Extended Mode
4. Implement custom Monaco Editor contributions

### Is there a plugin system?

Extended Mode provides VSCode-like extensibility through service overrides. You can override specific services to add custom functionality while maintaining LSP compatibility.

## Migration and Updates

### How do I upgrade to newer versions?

1. Check the [migration guide](guides/migration.md) for breaking changes
2. Update package versions consistently
3. Review the [changelog](versions-and-history.md) for new features and fixes
4. Test thoroughly, especially worker and bundler configurations

### Can I migrate from regular Monaco Editor?

Yes, `monaco-languageclient` is designed to enhance Monaco Editor. See [Getting Started](basic-usage/getting-started.md) for migration patterns.

Still have questions? Check our [GitHub Issues](https://github.com/TypeFox/monaco-languageclient/issues) or create a new issue for help.
