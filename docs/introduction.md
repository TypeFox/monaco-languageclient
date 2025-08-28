# Introduction

## What is Monaco Language Client?

The Monaco Language Client is a TypeScript library that bridges the gap between the Monaco Editor and Language Server Protocol (LSP) servers. It enables web applications to provide rich language features like code completion, error checking, go-to-definition, and more, directly in the browser.

## Key Concepts

### Monaco Editor
The Monaco Editor is the code editor that powers VS Code. It provides syntax highlighting, basic editing features, and a rich API for customization. However, by itself, it doesn't include language-specific features like intelligent code completion or error diagnostics.

### Language Server Protocol (LSP)
The Language Server Protocol is a standard that defines how development tools can communicate with language servers to provide language features. A language server understands a specific programming language and can provide features like:

- **Code completion** - Intelligent suggestions as you type
- **Diagnostics** - Error and warning messages
- **Go to definition** - Jump to where symbols are defined  
- **Hover information** - Documentation and type information
- **Code formatting** - Automatic code formatting
- **Refactoring** - Safe code transformations

### How Monaco Language Client Works

Monaco Language Client acts as the communication layer between Monaco Editor and language servers. It:

1. **Receives events** from Monaco Editor (typing, cursor movement, etc.)
2. **Translates these events** into LSP messages
3. **Sends messages** to language servers via WebSockets or Web Workers
4. **Receives responses** from language servers  
5. **Updates Monaco Editor** with language features (completions, diagnostics, etc.)

## Architecture Overview

The Monaco Language Client supports two main architectural patterns:

### WebSocket Communication
```
Web Browser                    Server
┌─────────────────┐           ┌──────────────────┐
│ Monaco Editor   │           │ Language Server  │
│ ↕               │           │ (Node.js/Python/ │
│ Language Client │ ←WebSocket→ │ Java/etc.)      │
└─────────────────┘           └──────────────────┘
```

### Web Worker Communication  
```
Web Browser
┌─────────────────────────────────────┐
│ Main Thread          Web Worker     │
│ ┌─────────────────┐ ┌─────────────┐ │
│ │ Monaco Editor   │ │ Language    │ │
│ │ ↕               │ │ Server      │ │
│ │ Language Client │←→│ (WASM/JS)   │ │
│ └─────────────────┘ ┹─────────────┘ │
└─────────────────────────────────────┘
```

## Integration Options

Monaco Language Client offers two main integration modes:

### Extended Mode
Uses `@codingame/monaco-vscode-api` to provide VS Code-like services and functionality. This mode gives you access to:
- Advanced editor features
- Extension-like capabilities  
- Rich VS Code services integration
- Better compatibility with VS Code extensions

**Best for**: Applications that want VS Code-like functionality in the browser.

### Classic Mode  
Uses standalone Monaco Editor with language client features added on top. This is a lighter-weight option that provides:
- Core language server features
- Smaller bundle size
- Simpler integration
- Direct Monaco Editor API access

**Best for**: Applications that need language server features but want to keep things simple.

## When to Use Monaco Language Client

Monaco Language Client is ideal when you need to:

- **Build web-based IDEs or editors** with language support
- **Add intelligent language features** to existing Monaco Editor integrations
- **Support multiple programming languages** through their respective language servers
- **Provide VS Code-like experience** in web applications
- **Leverage existing language servers** rather than building language support from scratch

## What's Next?

Ready to get started? Check out our [Installation Guide](installation.md) to set up Monaco Language Client in your project, or jump to [Basic Usage](basic-usage/index.md) to see it in action.

For a deeper understanding of the different integration approaches, see:
- [Extended Mode](advanced-usage/extended-mode.md) for VS Code-like functionality
- [Classic Mode](advanced-usage/classic-mode.md) for simpler integrations
- [Examples](examples/index.md) for practical implementations