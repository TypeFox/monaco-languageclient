# Introduction

## What is the Monaco Language Client?

The Monaco Language Client is a TypeScript library allowing to use the Language Server Protocol (LSP) directly with the monaco-editor. This lets it utilize language servers to extend the monoaco-editor's existing language support. Web applications can then provide rich language features such as code completion, diagnostics, Go To Definition support, and more, directly in the browser.

## Key Concepts

To give some background, the monaco-languageclient builds on two main technologies:

- Language Server Protocol (LSP) and `vscode-languageclient`
- `monaco-editor` and `@codingame/monaco-vscode-api`

We'll briefly explain each below.

### Language Server Protocol (LSP) and vscode-languageclient

The Language Server Protocol is a standard that defines how development tools can communicate with language servers to provide enhanced language support in editors. A language server understands a specific programming language and can provide support features such as:

- **Code completion** - Intelligent suggestions as you type
- **Diagnostics** - Error and warning messages
- **Go to definition** - Jumping to where a symbol is defined
- **Hover information** - Documentation and type information
- **Code formatting** - Automatic code formatting

The `vscode-languageclient` is the library usually supplying client side support for the language server protocol for VSCode and its extensions. `monaco-languageclient` wraps this library directly and makes it available in the browser. It is made possible by the stack described in the next sub-section.

## monaco-editor and @codingame/monaco-vscode-api

The Monaco Editor is the code editor that powers VSCode. In the past it was extracted by Microsoft from the monolithic VSCode as a self-standing [npm package](https://www.npmjs.com/package/monaco-editor), so people could have an editor that works in the web. [monaco-editor](https://microsoft.github.io/monaco-editor/) provides syntax highlighting, basic editing features and a rich API for customization. However, by default, it does include language-specific features like code completion or diagnostics only for a few languages (e.g. TypeScript/JavaScript, HTML). It can't be connected to language servers as it does not offer support for the Language Server Protocol directly.

This is where the `@codingame/monaco-vscode-api` comes in. It supplies a modularized VSCode Web and its API allowing you to build web applications that only use a sub-set of VSCode itself. This lets you use things like the `vscode-languageclient` library or Textmate syntax highlighting that are usually not available with the regular `monaco-editor` npm package. Trying to re-integrate the package back into VSCode is not possible without substantial modification. Thus a fully `monaco-editor` API compatible package named `@codingame/monaco-vscode-editor-api` is available as an npm package along with many others under the `@codingame/monaco-vscode` umbrella.

### How the Monaco Language Client Works

The Monaco Language Client acts as a communication layer between the Monaco Editor and one or many language servers. This allows it to:

1. **Receive events** from the Monaco Editor (typing, cursor movement, etc.)
2. **Translate these events** into LSP messages
3. **Send messages** to a language server via WebSockets or Web Workers
4. **Receive responses** from a language server
5. **Supply the Monaco Editor** with language features (completions, diagnostics, etc.)

## Architecture Overview

The Monaco Language Client supports two main architectural patterns:

### WebSocket Communication

In this configuration it's implied that the language server is running as a server on a backend (Node.js, Python, etc.) and communicates with the editor in the browser via WebSockets.

```shell
Web Browser                     Server
┌─────────────────┐             ┌──────────────────┐
│ Monaco Editor   │             │ Language Server  │
│ ↕               │             │ (Node.js/Python/ │
│ Language Client │ ←WebSocket→ │ Java/etc.)       │
└─────────────────┘             └──────────────────┘
```

### Web Worker Communication

In this configuration, the language server runs in a Web Worker within the browser itself. This is useful for language servers that can be compiled to WebAssembly or plain JavaScript. [Langium](https://langium.org/), for example, can generate language servers that run purely in Web Workers.

```shell
Web Browser
┌────────────────────────────────────────┐
│ Main Thread            Web Worker      │
│ ┌─────────────────┐    ┌─────────────┐ │
│ │ Monaco Editor   │    │ Language    │ │
│ │ ↕               │    │ Server      │ │
│ │ Language Client │ ←→ │ (WASM/JS)   │ │
│ └─────────────────┘    └─────────────┘ │
└────────────────────────────────────────┘
```

## Integration Options

The Monaco Language Client offers two main integration modes:

### Extended Mode

Uses `@codingame/monaco-vscode-api` to provide VSCode-like services and functionality. This mode gives you access to:

- Advanced editor features
- Extension-like capabilities
- Rich VSCode services integration
- Ability to use VSCode Web extensions

This is the recommended mode for _most_ use cases. If you're not sure which mode to use, start with the extended mode.

**Best for**: Applications that want VSCode-like functionality in the browser.

### Classic Mode

Uses a standalone Monaco Editor with language client features added on top. This is a light-weight option that provides:

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
- **Provide a VSCode-like experience** in web applications
- **Leverage existing language servers** rather than building language support from scratch

## What's Next?

Ready to get started? Check out our [Installation Guide](./installation.md) to set up the monaco-languageclient in your project, or jump to [Basic Usage](./guides/getting-started.md) to start learning how to get started with simple examples.
