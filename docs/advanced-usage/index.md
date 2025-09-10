# Advanced Usage

This section covers advanced usage of the Monaco Language Client. These guides assume you're already familiar with the [Basic Usage](../basic-usage/index.md) concepts.

## Section Contents

- **[Extended Mode](extended-mode.md)** - Using VS Code services for rich editor functionality
- **[Extended Mode with Langium](extended-mode-with-langium.md)** - Building custom language servers with Langium
- **[Classic Mode](classic-mode.md)** - Lightweight integration with standalone Monaco Editor
- **[Web Workers](web-workers.md)** - Running language servers in-browser using Web Workers
- **[WebSockets](websockets.md)** - Communicating with external language servers via WebSockets
- **[React Integration](react-integration.md)** - Using Monaco Language Client with React applications

## Key Details

### Extended vs Classic Mode

**Extended Mode** leverages `@codingame/monaco-vscode-api` to provide VS Code-like functionality in the web:
- VS Code service support (themes, keybindings, extensions)
- Better language server integration
- Fuller feature set than with the classic configuration

**Classic Mode** uses standalone Monaco Editor with language client features:
- Simpler integration model
- Smaller bundle size
- Direct Monaco Editor API access
- Missing most common features you would in the extended configuration

### Communication Patterns

**WebSocket Communication**: Connect to external language servers running in separate processes
```typescript
connection: {
  options: {
    $type: 'WebSocketUrl',
    url: 'ws://localhost:3000/languageserver'
  }
}
```

**Web Worker Communication**: Run language servers via web workers in the browser
```typescript
const worker = new Worker('./language-server.js', { type: 'module' });
// Configure worker communication...
```

### Architecture Patterns

Monaco Language Client supports various architectural approaches:

1. **Client-Server**: External language servers via WebSockets
2. **In-Browser**: Language servers as Web Workers
3. **Hybrid**: Mix of external and in-browser language servers
4. **Multi-Language**: Multiple language clients for different file types

## Choosing the Right Approach

If you're building a VS Code-like experience in the browser, [Extended Mode](extended-mode.md) is recommended.

For lightweight setups, direct Monaco Editor access, or applications where the extended mode incurs too much overhead, [Classic Mode](classic-mode.md) may be more suitable. However it's still recommended to start with extended mode first.

If you want a browser-only solution without server dependencies, you can check out the [Web Workers](web-workers.md) guide.

For React applications, see the [React Integration](react-integration.md) guide.

Lastly, if you're working with Langium to build custom language servers, refer to the [Extended Mode with Langium](extended-mode-with-langium.md) guide.
