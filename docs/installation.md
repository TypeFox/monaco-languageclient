# Installation

This guide will help you get the Monaco Language Client set up in your project.

## Prerequisites

Before installing Monaco Language Client, ensure you have:

- **Node.js 20.10.0 or higher**
- **npm 10.2.3 or higher**
- A web bundler (Vite, Webpack, etc.) that supports ES modules

Generally, we prefer to use Volta to manage Node.js versions. You can install it from [https://volta.sh/](https://volta.sh/).

## Installation

The Monaco Language Client is distributed as multiple npm packages depending on your needs:

### Core Package
For most users, you can start with the core package:

```bash
npm install monaco-languageclient
```

### Additional Packages

Depending on your setup, you may also need:

```bash
# For WebSocket communication with external language servers
npm install vscode-ws-jsonrpc

# For a React integration
npm install @typefox/monaco-editor-react
```

### Peer Dependencies

You'll may also need to install peer dependencies. For Extended Mode these are recommended:

```bash
# VS Code API and editor
npm install vscode @codingame/monaco-vscode-api @codingame/monaco-vscode-editor-api
```

## Package Manager Configuration

### npm/pnpm
If using npm or pnpm, and your dependencies already contain a refernence to `monaco-editor`, add this override to your `package.json` to ensure consistent Monaco Editor versions:

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### Yarn
For the same issue in Yarn, you can use resolutions:

```json
{
  "resolutions": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### pnpm with vscode alias
If using pnpm, you may need to add a direct dependency to help with the `vscode` alias:

```json
{
  "dependencies": {
    "vscode": "npm:@codingame/monaco-vscode-extension-api@~20.2.1"
  }
}
```

This will add the `vscode` alias required by some packages, allowing `import * as vscode from 'vscode'` to work correctly.

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

For faster setup where you only want to see how the monaco-languageclient works in practice, consider checking out our example projects. You can clone the repository and run the examples with the following:

```bash
# Clone the repository
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient

# Install dependencies
npm install

# Run examples
npm run dev
```

Then open http://localhost:20001 to see various running examples.

## Version Compatibility

Monaco Language Client versions align with specific Monaco Editor and VS Code versions. See our [version compatibility table](versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) for details.

## Common Issues

### Import Errors
If you see import errors, ensure you have the correct overrides/resolutions in your `package.json` and that your bundler supports ES modules.

### Worker Loading Issues
For Web Worker usage, ensure your bundler can handle worker imports. See our [troubleshooting guide](guides/troubleshooting.md) for a bundler-specific configuration.

### Version Mismatches
If you see console warnings about version mismatches, check that all `@codingame/monaco-vscode-api` packages use the same version.

## What's Next?

Once you have Monaco Language Client installed, you're ready to:

1. **Follow the [Getting Started Guide](basic-usage/getting-started.md)** for your first setup
2. **Choose your integration mode** - [Extended Mode](advanced-usage/extended-mode.md) or [Classic Mode](advanced-usage/classic-mode.md)
3. **Explore [Examples](examples/index.md)** for specific language server integrations

For specific framework integration guides, see:
- [React Integration](advanced-usage/react-integration.md)
- [WebSocket Communication](advanced-usage/websockets.md)
- [Web Worker Usage](advanced-usage/web-workers.md)
