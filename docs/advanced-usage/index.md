# Advanced Usage

This section covers advanced integration patterns and features of Monaco Language Client. These guides assume you're familiar with the [Basic Usage](../basic-usage/index.md) concepts.

## Section Contents

- **[Extended Mode](extended-mode.md)** - Using VS Code services for rich editor functionality
- **[Extended Mode with Langium](extended-mode-with-langium.md)** - Building custom language servers with Langium
- **[Classic Mode](classic-mode.md)** - Lightweight integration with standalone Monaco Editor
- **[Web Workers](web-workers.md)** - Running language servers in-browser using Web Workers
- **[WebSockets](websockets.md)** - Communicating with external language servers via WebSockets  
- **[React Integration](react-integration.md)** - Using Monaco Language Client with React applications

## Key Concepts

### Extended vs Classic Mode

**Extended Mode** leverages `@codingame/monaco-vscode-api` to provide VS Code-like functionality:
- Rich VS Code services (themes, keybindings, extensions)
- Better language server integration
- More complex setup but fuller feature set

**Classic Mode** uses standalone Monaco Editor with language client features:
- Simpler integration model
- Smaller bundle size
- Direct Monaco Editor API access

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

**Web Worker Communication**: Run language servers in browser Web Workers
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

## Choose Your Integration

- **Building a VS Code-like experience?** ’ [Extended Mode](extended-mode.md)
- **Need lightweight integration?** ’ [Classic Mode](classic-mode.md)
- **Want browser-only language servers?** ’ [Web Workers](web-workers.md)
- **Using React framework?** ’ [React Integration](react-integration.md)
- **Building custom DSL support?** ’ [Extended Mode with Langium](extended-mode-with-langium.md)

## Advanced Topics

Each guide in this section covers:
- When to use the specific approach
- Complete setup and configuration
- Best practices and common patterns
- Troubleshooting and performance tips
- Integration with other tools and frameworks

Continue to the specific guide that matches your use case, or start with [Extended Mode](extended-mode.md) for the most comprehensive approach.