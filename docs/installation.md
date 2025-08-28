# Installation

This guide will help you get Monaco Language Client set up in your project.

## Prerequisites

Before installing Monaco Language Client, ensure you have:

- **Node.js 20.10.0 or higher** - Check with `node --version`
- **npm 10.2.3 or higher** - Check with `npm --version`
- A web bundler (Vite, Webpack, etc.) that supports ES modules

## Package Installation

Monaco Language Client is distributed as multiple npm packages depending on your needs:

### Core Package
For most users, start with the core package:

```bash
npm install monaco-languageclient
```

### Additional Packages

Depending on your setup, you may also need:

```bash
# For WebSocket communication with external language servers
npm install vscode-ws-jsonrpc

# For React integration
npm install @typefox/monaco-editor-react

# Monaco Editor with VS Code API compatibility  
npm install @codingame/monaco-vscode-editor-api
```

### Peer Dependencies

You'll also need to install peer dependencies. For Extended Mode (recommended):

```bash
# VS Code API and editor
npm install vscode @codingame/monaco-vscode-api @codingame/monaco-vscode-editor-api

# Language services (add as needed)
npm install @codingame/monaco-vscode-languages-service-override
npm install @codingame/monaco-vscode-model-service-override
```

For Classic Mode:
```bash
npm install monaco-editor
```

## Package Manager Configuration

### npm/pnpm
If using npm or pnpm, add this override to your `package.json` to ensure consistent Monaco Editor versions:

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### Yarn
For Yarn, use resolutions:

```json
{
  "resolutions": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### pnpm with vscode alias
If using pnpm, you may need to add a direct dependency:

```json
{
  "dependencies": {
    "vscode": "npm:@codingame/monaco-vscode-api@~20.2.1"
  }
}
```

## Bundler Configuration

### Vite
Monaco Language Client works well with Vite out of the box. If you encounter issues with imports, add this to your `vite.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    dedupe: ['vscode']
  }
})
```

### Webpack
For webpack users, you may need to configure worker loading. See the [webpack troubleshooting guide](guides/troubleshooting.md#webpack-worker-issues) for details.

## Verification

To verify your installation works, create a minimal test file:

```typescript
// test-install.ts
import { MonacoLanguageClient } from 'monaco-languageclient';
import '@codingame/monaco-vscode-editor-api';

console log('Monaco Language Client loaded successfully');
```

If this imports without errors, your installation is ready!

## Quick Start Templates

For faster setup, consider using our example templates:

```bash
# Clone the repository
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient

# Install dependencies
npm install

# Run examples
npm run dev
```

Then open http://localhost:20001 to see various integration examples.

## Version Compatibility

Monaco Language Client versions align with specific Monaco Editor and VS Code versions. See our [version compatibility table](versions-and-history.md#monaco-editor--codingamemonaco-vscode-api-compatibility-table) for details.

Current versions:
- **monaco-languageclient**: 10.0.0
- **@codingame/monaco-vscode-api**: 20.2.1  
- **VS Code**: 1.103.1
- **monaco-editor**: 0.52.2

## Common Issues

### Import Errors
If you see import errors, ensure you have the correct overrides/resolutions in your `package.json` and that your bundler supports ES modules.

### Worker Loading Issues
For Web Worker usage, ensure your bundler can handle worker imports. See our [troubleshooting guide](guides/troubleshooting.md) for bundler-specific configuration.

### Version Mismatches
If you see console warnings about version mismatches, check that all `@codingame/monaco-vscode-api` packages use the same version.

## What's Next?

Once you have Monaco Language Client installed, you're ready to:

1. **Follow the [Getting Started Guide](basic-usage/getting-started.md)** for your first integration
2. **Choose your integration mode** - [Extended Mode](advanced-usage/extended-mode.md) or [Classic Mode](advanced-usage/classic-mode.md)  
3. **Explore [Examples](examples/index.md)** for specific language server integrations

For specific framework integration guides, see:
- [React Integration](advanced-usage/react-integration.md)
- [WebSocket Communication](advanced-usage/websockets.md)
- [Web Worker Usage](advanced-usage/web-workers.md)