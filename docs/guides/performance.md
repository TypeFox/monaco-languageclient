# Performance Optimization Guide

This guide provides best practices and techniques for optimizing the performance of your monaco-languageclient applications, focusing on bundle size, memory usage, and runtime efficiency.

## Introduction

This guide will help you identify and address common performance bottlenecks in your setups.

## Key Considerations

-   **Integration Mode**: Your choice between [Classic Mode](../advanced-usage/classic-mode.md) and [Extended Mode](../advanced-usage/extended-mode.md) significantly impacts performance. Classic Mode generally offers a smaller bundle size and lighter memory footprint, while Extended Mode provides richer features at the cost of increased resource usage. _Although Extended Mode is recommended for most applications, if performance is a critical concern and you do not need many (or any) features that could be provided by VS Code services, you may consider using Classic Mode._
-   **Language Server Location**: Running language servers in [Web Workers](../advanced-usage/web-workers.md) already offer decent performance, but external [WebSocket-based servers](../advanced-usage/websockets.md) might be necessary for complex or resource-intensive language services. Consider if your language server is suited to running in a browser-based context, or if it requires a more powerful backend environment.
-   **Keep the main thread free**: If you're doing any heavy-lifting in your application (e.g., complex computations, data processing), consider offloading these tasks to Web Workers to keep the main thread responsive.

## Bundle Size Optimization

A large bundle can significantly increase initial load times. Consider these techniques to reduce your application's size:

-   **Tree-Shaking**: Ensure your bundler (Webpack, Rollup, Vite) is configured for effective tree-shaking to eliminate unused code from imported modules.
-   **Import Only What You Need**: Avoid importing entire libraries or service overrides if you only use a small portion of their functionality.
-   **Lazy Loading Language Extensions**: Dynamically import language extensions only when they are needed (e.g., when a user opens a file of a specific language).
-   **Use Classic Mode**: If your application doesn't require the full suite of VS Code services, Classic Mode can offer a significantly smaller bundle size.

## Memory Usage Optimization

High memory consumption can lead to a sluggish or non-responsive UI. Here are some strategies to manage memory effectively:

-   **Dispose of Instances**: Always call the `.dispose()` method on `EditorApp`, `LanguageClientWrapper`, and `MonacoVscodeApiWrapper` instances when they are no longer needed (e.g., when a React component unmounts or a view is closed).
-   **Limit Open Files**: In applications managing multiple files, be mindful of how many editor models are kept active in memory simultaneously. Dispose of models for files that are no longer in use.
-   **Web Workers for Language Servers**: This is somewhat of a given, but offload memory-intensive language server processes to Web Workers to prevent them from blocking the main thread. As a note, there is generally never a situation where you would want to run a language server on the main thread.
-   **Use Classic Mode**: For simpler scenarios, Classic Mode has a smaller memory footprint as it doesn't load the extensive VS Code service layer.

## Runtime Performance Optimization

Optimizing runtime performance ensures a responsive editing experience.

-   **Asynchronous Tokenization**: For very large files, enable asynchronous tokenization in your editor configuration to prevent UI blocking:

    ```json
    {
      "editor.experimental.asyncTokenization": true
    }
    ```

-   **Web Workers for Language Servers**: As mentioned, it's critical to ensure you're running language servers in Web Workers keeps the main thread free to handle UI updates, leading to a smoother experience.
-   **Efficient Communication**: For WebSocket-based language servers, consider optimizing message serialization/deserialization and potentially batching messages to reduce overhead.
-   **Debouncing/Throttling**: For frequent editor events (e.g., `onDidChangeModelContent`), consider debouncing or throttling the associated language server requests to reduce the load.

Even with these optimizations, always profile your application to identify specific bottlenecks and address them accordingly.

## Debugging Performance Issues

-   **Browser Developer Tools**: Use your browser's developer tools (Performance tab, Memory tab) to profile your application and identify CPU and memory hotspots.
-   **Detailed Logging**: Enable detailed logging in `monaco-languageclient` to trace communication and initialization steps, which can reveal performance bottlenecks.

    ```typescript
    import { LogLevel } from '@codingame/monaco-vscode-api';

    const vscodeApiConfig = {
        // ...
        logLevel: LogLevel.Debug
    };
    ```

For more general debugging tips, refer to the [Troubleshooting Guide](../guides/troubleshooting.md).
