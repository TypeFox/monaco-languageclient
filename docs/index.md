# Monaco Language Client Documentation

Welcome to the official documentation for the monaco-languageclient project! The monaco-languageclient project provides robust integration between the Monaco Editor and Language Server Protocol (LSP) servers. Using the monaco-languageclient, you can build purely web-based editors with full LSP support, enabling features like code completion, diagnostics, and more.

This documentation is built to help newcomers to the Monaco language client and experts alike be able to quickly leverage all the capabilities of the Monaco language clients projects fully and effectively.

In particular, the monaco-languageclient is helpful when you need to:
- Integrate language server features into web applications using the Monaco Editor.
- Build custom language support for specific programming languages in a web-based environment.
- Utilize WebSocket or Web Worker connections to communicate with language servers.

We've setup up the documentation into several sections starting with basic usage and going into advanced usage, and following up with an API reference, examples and specific guides for common use cases.

- [Introduction](introduction.md): Learn what the monaco-languageclient is, its key concepts, and how it fits into the ecosystem.
- [Installation](installation.md): Step-by-step instructions to get started with the monaco-languageclient, including dependencies and setup.
- [Basic Usage](basic-usage/index.md): Beginner-friendly guides to integrating the monaco-languageclient into your project, including configuration and simple examples.
  - [Getting Started](basic-usage/getting-started.md): Your first monaco language client integration.
  - [Configuration](basic-usage/configuration.md): Basic configuration options.
  - [Examples](basic-usage/examples.md): Simple examples to illustrate common use cases.
- [Advanced Usage](advanced-usage/index.md): Explore advanced features such as VS Code services integration, web workers, and WebSocket communication.
  - [Extended Mode](advanced-usage/extended-mode.md): Using VS Code services with the monaco-languageclient.
  - [Extended Mode with Langium](advanced-usage/extended-mode-with-langium.md): Integration with Langium for building language servers.
  - [Classic Mode](advanced-usage/classic-mode.md): Using the monaco-languageclient in standalone Monaco editor mode.
  - [Web Workers](advanced-usage/web-workers.md): Running language servers in-browser using Web Workers.
  - [WebSockets](advanced-usage/websockets.md): Communicating with external language servers via WebSockets.
  - [React Integration](advanced-usage/react-integration.md): Using the monaco-languageclient with React applications.
- [API Reference](api-reference/index.md): Comprehensive documentation of the core API, including classes, methods, and interfaces.
  - [Monaco Language Client](api-reference/monaco-languageclient.md): Core package API.
  - [VSCode WS JSON-RPC](api-reference/vscode-ws-jsonrpc.md): WebSocket JSON-RPC API.
  - [Monaco Editor React](api-reference/monaco-editor-react.md): React wrapper API.
  - [Configuration Schema](api-reference/configuration-schema.md): Reference for configuration options.
- [Examples](examples/index.md): A collection of practical examples demonstrating various use cases and integrations.
  - [JSON Language Server](examples/json-language-server.md): JSON example walkthrough.
  - [Python Pyright](examples/python-pyright.md): Python example walkthrough.
  - [Langium DSL](examples/langium-dsl.md): Langium-based examples.
  - [Custom Language Server](examples/custom-language-server.md): Building your own language server.
- [Guides](guides/index.md): In-depth guides on topics like migration, troubleshooting, performance optimization, and deployment.
  - [Migration](guides/migration.md): Migration between versions.
  - [Troubleshooting](guides/troubleshooting.md): Common issues and solutions.
  - [Performance](guides/performance.md): Performance optimization techniques.
  - [Deployment](guides/deployment.md): Best practices for production deployment.
- [FAQ](faq.md): Answers to frequently asked questions about the monaco-languageclient.
- [Versions and History](versions-and-history.md): Information on version compatibility and historical changes.
