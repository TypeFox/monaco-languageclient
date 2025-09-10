# Introduction

## What is the Monaco Language Client?

The Monaco Language Client is a TypeScript library that bridges the gap between the Monaco Editor and Language Server Protocol (LSP) servers. It enables web applications to provide rich language features such as code completion, diagnostics, Go To Definition support, and more, directly in the browser.

## Key Concepts

To give some background, the monaco-languageclient builds on two main technologies:
- Monaco Editor
- Language Server Protocol (LSP)

We'll briefly explain each below.

### Monaco Editor
The Monaco Editor is the code editor that powers VS Code. It provides syntax highlighting, basic editing features, and a rich API for customization. However, by default, it doesn't include language-specific features like code completion or diagnostics.

### Language Server Protocol (LSP)
The Language Server Protocol is a standard that defines how development tools can communicate with language servers to provide language support. A language server understands a specific programming language and can provide support features such as:

- **Code completion** - Intelligent suggestions as you type
- **Diagnostics** - Error and warning messages
- **Go to definition** - Jumping to where a symbol is defined
- **Hover information** - Documentation and type information
- **Code formatting** - Automatic code formatting

### How the Monaco Language Client Works

The Monaco Language Client acts as a communication layer between the Monaco Editor and a language server. This allows it to:

1. **Receive events** from the Monaco Editor (typing, cursor movement, etc.)
2. **Translate these events** into LSP messages
3. **Send messages** to a language server via WebSockets or Web Workers
4. **Receive responses** from a language server
5. **Update the Monaco Editor** with language features (completions, diagnostics, etc.)

As a note, this also works for multiple language servers as well.

## Architecture Overview

The Monaco Language Client supports two main architectural patterns:

### WebSocket Communication

In this configuration it's implied that the language server is running as a server on a backend (Node.js, Python, etc.) and communicates with the Monaco Editor in the browser via WebSockets.

```
Web Browser                    Server
┌─────────────────┐           ┌──────────────────┐
│ Monaco Editor   │           │ Language Server  │
│ ↕               │           │ (Node.js/Python/ │
│ Language Client │ ←WebSocket→ │ Java/etc.)      │
└─────────────────┘           └──────────────────┘
```

### Web Worker Communication

In this configuration, the language server runs in a Web Worker within the browser itself. This is useful for language servers that can be compiled to WebAssembly or plain JavaScript. Langium, for example, can generate language servers that run purely in Web Workers.

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

The Monaco Language Client offers two main integration modes:

### Extended Mode
Uses `@codingame/monaco-vscode-api` to provide VS Code-like services and functionality. This mode gives you access to:
- Advanced editor features
- Extension-like capabilities
- Rich VS Code services integration
- Better compatibility with VS Code extensions

This is the recommended mode for _most_ use cases. If you're not sure which mode to use, start with the extended mode.

**Best for**: Applications that want VS Code-like functionality in the browser.

### Classic Mode
Uses standalone Monaco Editor with language client features added on top. This is a light-weight option that provides:
- Core language server features
- Smaller bundle size
- Simpler integration
- Direct Monaco Editor API access

However, it lacks advanced features and services provided by the extended mode, and in _most_ cases is not recommended unless you have a specific need for it.

**Best for**: Applications that need language server features but want to keep things simple.

## When to Use the Monaco Language Client

The Monaco Language Client is ideal when you need to:

- **Build web-based IDEs or editors** with language support
- **Add intelligent language features** to existing Monaco Editor integrations
- **Support multiple programming languages** through their respective language servers
- **Provide a VS Code-like experience** in web applications
- **Leverage existing language servers** rather than building language support from scratch

## What's Next?

Ready to get started? Check out our [Installation Guide](installation.md) to set up the monaco-languageclient in your project, or jump to [Basic Usage](basic-usage/index.md) to start learning how to get started with simple examples.

For a deeper understanding of the different integration approaches, see:
- [Extended Mode](advanced-usage/extended-mode.md) for VS Code-like functionality
- [Classic Mode](advanced-usage/classic-mode.md) for simpler integrations
- [Examples](examples/index.md) for practical implementations
