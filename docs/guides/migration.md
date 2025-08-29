# Migration Guide

This guide provides instructions for migrating between major versions of `monaco-languageclient` and its related packages. 

## Version Compatibility

Before migrating, consult the [Version Compatibility Table](../versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) to ensure you are using compatible versions of `monaco-languageclient`, `monaco-editor`, and `@codingame/monaco-vscode-api`.

## Migrating from v9.x to v10.x

Version 10.0.0 introduces the following changes:

-   **`monaco-editor-wrapper` dropped**: The `monaco-editor-wrapper` package has been removed. Its functionality has been moved back into `monaco-languageclient` and is available via sub-exports.

## Migrating from v8.x to v9.x

Version 9.0.0 introduces the following changes:

-   **Peer Dependencies**: All `@codingame/monaco-vscode` packages are now peer dependencies. You will need to install the required packages in your project.
-   **Engine Requirements**: The required Node.js version has been updated to `>=18.19.0` and npm to `>=10.2.3`.
-   **API Changes**: The `run` language clients are now independent of the wrapper lifecycle. Some function names have been adjusted.

## Migrating from v7.x to v8.x

Version 8.0.0 introduces the following changes:

-   **`@codingame/monaco-vscode-editor-api`**: The `@codingame/monaco-editor-treemended` package has been replaced by `@codingame/monaco-vscode-editor-api`. This new package provides the full editor API and removes the need for a treemended version.
-   **New Packages**: The `monaco-editor-wrapper` and `@typefox/monaco-editor-react` packages have been moved into this repository.

## Migrating from v6.x to v7.x

Version 7.0.0 introduces a new approach to tree-mending:

-   **`@codingame/monaco-editor-treemended`**: The postinstall step that patched `monaco-editor` has been removed. Instead, you should now use the `@codingame/monaco-editor-treemended` package. You will need to enforce the correct `monaco-editor` version in your `package.json` using `overrides` (for npm/pnpm) or `resolutions` (for Yarn).

## Migrating from v5.x to v6.x

Version 6.0.0 introduces the following changes:

-   **`initServices`**: The `MonacoServices` class has been retired and replaced with `initServices`. This function makes it easier to configure the services exposed by `@codingame/monaco-vscode-api`.

## Migrating from v4.x to v5.x

Version 5.0.0 introduces the following changes:

-   **No Re-exports**: The library no longer re-exports code from other libraries like `vscode-jsonrpc`, `vscode-languageclient`, and `vscode-languageserver-protocol`. You will need to import this code directly from the respective libraries.

## Migrating from v3.x to v4.x

Version 4.0.0 introduces the following changes:

-   **ESM Modules**: The project has been converted to ES modules. CommonJS bundles are no longer provided.
-   **`monaco-converter` Removed**: The `monaco-converter` has been removed. If you were using it, you will need to adapt to the new converters available since v2.0.0.

## Migrating from v1.x to v2.x

Version 2.0.0 introduces a dependency on `@codingame/monaco-vscode-api`:

-   **`@codingame/monaco-vscode-api`**: This library is now used for all VS Code API compatibility. If you were using custom Monaco services, you will need to adjust them to the new interface.
-   **Webpack/Vite Configuration**: If you are using Webpack or Vite, you will need to remove the `vscode` alias from your configuration.
