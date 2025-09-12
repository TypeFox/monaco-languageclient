# Monaco Language Client Documentation

Welcome to the official documentation for the `monaco-languageclient`. The `monaco-languageclient` librarr provides the ability to integrate the Monaco Editor with language clients and language servers utilizing the Language Server Protocol (LSP). Using the `monaco-languageclient`, you can build purely web-based editors with full LSP support, enabling features like code completion, diagnostics, and much more.

This documentation is built to help newcomers and experts to be able to quickly leverage the `monaco-languageclient` effectively.

In particular, the `monaco-languageclient` is helpful when you need to:

- Integrate language server features into web applications using the Monaco Editor.
- Build custom language support for specific programming languages in a web-based environment.
- Utilize WebSocket or Web Worker connections to communicate with language servers deployed elsewhere.

We have partitioned the documentation into several sections that cover everything from what the `monaco-languageclient` is, to how to get started, to advanced usage.

- [Introduction](introduction.md): Learn what the monaco-languageclient is, its key concepts, and how it fits into the ecosystem.
- [Installation](installation.md): Step-by-step instructions to get started with `monaco-languageclient`, including dependencies and setup.
- [Basic Usage](basic-usage/index.md): Beginner-friendly guides to integrating `monaco-languageclient` into your project, including configuration and simple examples.
  - [Getting Started](basic-usage/getting-started.md): Your first monaco language client integration.
  - [Configuration](basic-usage/configuration.md): Basic configuration options.
  - [Examples](basic-usage/examples.md): Simple examples to illustrate common use cases.
- [Advanced Usage](advanced-usage/index.md): Explore advanced features such as VSCode services integration, web workers, and WebSocket communication.
  - [Extended Mode](advanced-usage/extended-mode.md): Using VSCode services with the monaco-languageclient.
  - [Extended Mode with Langium](advanced-usage/extended-mode-with-langium.md): Integration with Langium for building language servers.
  - [Classic Mode](advanced-usage/classic-mode.md): Using the monaco-languageclient in standalone Monaco editor mode.
  - [Web Workers](advanced-usage/web-workers.md): Running language servers in-browser using Web Workers.
  - [WebSockets](advanced-usage/websockets.md): Communicating with external language servers via WebSockets.
  - [React Integration](advanced-usage/react-integration.md): Using the monaco-languageclient with React applications.
- [Guides](guides/index.md): In-depth guides on topics like migration and troubleshooting.
  - [Migration](guides/migration.md): Migration between versions.
  - [Troubleshooting](guides/troubleshooting.md): Common issues and solutions.
- [FAQ](faq.md): Answers to frequently asked questions about the monaco-languageclient.
- [Versions and History](versions-and-history.md): Information on version compatibility and historical changes.
