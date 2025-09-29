# Installation

This guide will help you get `monaco-languageclient` set up in your project.

## Prerequisites

Before installing Monaco Language Client, ensure you have:

- **Node.js 20.10.0 or higher**
- **npm 10.2.3 or higher**
- A web bundler (Vite, Webpack, etc.) that supports ES modules

Generally, we prefer to use Volta to manage Node.js versions. You can install it from [https://volta.sh/](https://volta.sh/).

## Perform the installation

The Monaco Language Client is distributed as multiple npm packages depending on your needs:

### Core Package

For most users, you can start with the core package:

```shell
npm install monaco-languageclient
```

### Additional Packages

Depending on your setup, you may also need:

```shell
# For WebSocket communication with external language servers
npm install vscode-ws-jsonrpc

# For a React integration
npm install @typefox/monaco-editor-react
```

## Package Manager Configuration

### npm/pnpm

If using npm or pnpm, and your dependencies already contain a refernence to `monaco-editor`, add `overrides` to your `package.json` to ensure only one compatible `monaco-editor` dependency is used in your project:

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^21.3.0"
  }
}
```

### Yarn

In yarn you have to specify `resolutions` instead of `overrides`:

```json
{
  "resolutions": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^21.3.0"
  }
}
```

### pnpm with vscode alias

If using pnpm, you have to add more transitive dependencies that npm or yarn automatically resolves and install:

```json
{
  "dependencies": {
    "@codingame/monaco-vscode-api": "^21.3.0",
    "@codingame/monaco-vscode-configuration-service-override": "^21.3.0",
    "@codingame/monaco-vscode-editor-api": "^21.3.0",
    "@codingame/monaco-vscode-editor-service-override": "^21.3.0",
    "@codingame/monaco-vscode-extension-api": "^21.3.0",
    "@codingame/monaco-vscode-extensions-service-override": "^21.3.0",
    "@codingame/monaco-vscode-languages-service-override": "^21.3.0",
    "@codingame/monaco-vscode-localization-service-override": "^21.3.0",
    "@codingame/monaco-vscode-log-service-override": "^21.3.0",
    "@codingame/monaco-vscode-model-service-override": "^21.3.0",
    "vscode": "npm:@codingame/monaco-vscode-extension-api@^21.3.0"
  }
}
```

### VSCode API inclusion

Additionally, you need to add the `vscode` alias required by some packages, allowing `import * as vscode from 'vscode'` to work correctly.

## Bundler Configuration

### Vite

The Monaco Language Client works well with Vite out of the box. If you encounter issues with imports, you can add this to your `vite.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    dedupe: ['vscode']
  }
})
```

This ensures that only one version of the `vscode` package is used, in case you have multiple dependencies that reference differing versions.

### Webpack

For webpack users, you may need to configure worker loading. See the [webpack troubleshooting guide](guides/troubleshooting.md#webpack-worker-issues) for details.

## Example Projects

For faster setup where you only want to see how `monaco-languageclient` works in practice, consider checking out our example projects. You can clone the repository and run the examples with the following:

```shell
# Clone the repository
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient

# Install dependencies
npm install

# Run examples
npm run dev
```

Then open <http://localhost:20001> to see various running examples.

## Version Compatibility

Monaco Language Client versions align with specific Monaco Editor and VSCode versions. See our [version compatibility table](versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) for details.

## Common Issues

### Import Errors

If you see import errors, ensure you have the correct overrides/resolutions in your `package.json` and that your bundler supports ES modules.

### Worker Loading Issues

For Web Worker usage, ensure your bundler can handle worker imports. See our [troubleshooting guide](./guides/troubleshooting.md) for a bundler-specific configuration.

### Version Mismatches

If you see console warnings about version mismatches, check that all `@codingame/monaco-vscode-api` packages use the same version.

## What's Next?

Once you have Monaco Language Client installed, you're ready to:

1. **Follow the [Getting Started Guide](./guides/getting-started.md)** for your first setup
