# Troubleshooting Guide

This guide provides solutions to common issues encountered when working with Monaco Language Client. If you can't find a solution here, check our [GitHub Issues](https://github.com/TypeFox/monaco-languageclient/issues) or consider [filing a new one](#reporting-issues).

## General Issues

### Language Features Not Working

If the editor loads but language features (like IntelliSense, diagnostics, or hover information) are missing, check the following:

1. **Language Server Connection**: Ensure your language server is running and accessible. For WebSocket connections, check the browser's developer console for any connection errors.
2. **Language Client Configuration**: Verify that your `languageClientConfig` is correct, especially the `documentSelector`. The selector must match the language ID of your editor's model.
3. **Initialization**: Make sure all necessary components (`MonacoVscodeApiWrapper`, `LanguageClientWrapper`, `EditorApp`) are initialized in the correct order. Asynchronous initialization steps should be properly awaited.

### Errors in Browser Console

- **"Another version of monaco-vscode-api has already been loaded"**: This indicates a version mismatch between Monaco-related packages. See the [Dependency Issues](#dependency-issues) section for a solution.
- **"Uncaught Error: Unexpected non-whitespace character after JSON at position 2"**: This is often caused by an outdated `buffer` polyfill. See the [Bad Polyfills](#bad-polyfills) section.

## Installation & Dependency Issues

### Missing Overrides or Resolutions

To ensure all Monaco-related packages use a single, compatible version, you must add an override (for npm/pnpm) or resolution (for Yarn) to your `package.json`.

**npm/pnpm (`package.json`):**s

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

**Yarn (`package.json`):**

```json
{
  "resolutions": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"
  }
}
```

### Dependency Version Mismatches

If you encounter numerous compile errors deep within `monaco-editor` or `vscode` files, you likely have a version mismatch.

1. **Check for duplicates**: Run `npm list @codingame/monaco-vscode-api` to see if multiple versions are installed.
2. **Fix dependencies**: Ensure all `@codingame/monaco-vscode-api` related packages in your `package.json` point to the same version.
3. **Reinstall**: After fixing versions, delete `node_modules` and your lock file (`package-lock.json`, `pnpm-lock.yaml`, etc.) and run `npm install` (or equivalent).

### @codingame/monaco-vscode-editor-api / monaco-editor usage

When you use the libraries from this project you are no longer required to proxy `monaco-editor` like `"monaco-editor": "npm:@codingame/monaco-vscode-editor-api@~20.2.1"` in you `package.json`. You can directly use it like so:

```js
import * as monaco from '@codingame/monaco-vscode-editor-api';
```

### Volta

There are [Volta](https://volta.sh/) instructions in the `package.json` files. When you have Volta available it will ensure the exactly specified `node` and `npm` versions are used.

## Connection Issues

### WebSocket Connection Failed

If the client cannot connect to your WebSocket-based language server:

1. **Server Status**: Verify the language server process is running and listening on the correct port and path.
2. **URL Mismatch**: Double-check the `url` in your `WebSocketUrl` configuration.
3. **CORS**: Ensure your server's Cross-Origin Resource Sharing (CORS) policy allows connections from the origin your web application is served from.
4. **Firewall/Proxy**: Check that no firewalls or network proxies are blocking the WebSocket connection.

### Web Worker Not Loading

If your Web Worker-based language server isn't functioning:

1. **Bundler Configuration**: Ensure your bundler (Vite, Webpack) is correctly configured to handle and output worker files. See the [Webpack Worker Issues](#webpack-worker-issues) section for specific guidance.
2. **File Path**: Verify the path to the worker script is correct.
3. **CORS**: If loading the worker from a different origin, ensure CORS headers are correctly set.

## Bundler & Framework Issues

### Vite

- **Assertion failed (There is already an extension with this id)**: This error occurs when multiple, mismatching versions of `vscode` / `@codingame/monaco-vscode-extension-api` are bundled. Add a `dedupe` rule to your `vite.config.ts`:

    ```typescript
    // vite.config.ts
    import { defineConfig } from 'vite';

    export default defineConfig({
      resolve: {
        dedupe: ['vscode']
      }
    });
    ```

### Webpack Worker Issues

Webpack can have trouble with the unpackaged workers from `@codingame/monaco-vscode-api`. To fix this, you need to pre-bundle the workers.

1. **Install `webpack-cli`**: `npm install --save-dev webpack-cli`
2. **Create a bundling script** (`bundle-monaco-workers.js`):

    ```javascript
    import { fileURLToPath } from 'url';
    import { dirname, resolve } from 'path';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    export default {
      entry: {
        editor: 'monaco-editor/esm/vs/editor/editor.worker.js',
        textmate: 'monaco-textmate/worker.js' // Adjust path if needed
      },
      output: {
        filename: '[name].js',
        path: resolve(__dirname, './public/monaco-workers') // Output to your public assets folder
      },
      mode: 'production',
      performance: {
        hints: false
      }
    };
    ```

3. **Add a script to `package.json`**: `"bundle:workers": "webpack --config bundle-monaco-workers.js"`
4. **Run the script**: `npm run bundle:workers`
5. **Configure the worker factory** in your application to point to these pre-bundled workers.

### SSR Frameworks (Next.js, etc.)

Monaco Language Client requires a browser environment and will not run during Server-Side Rendering (SSR). To use it in frameworks like Next.js:

- **Use Dynamic Imports**: Load your editor component dynamically to ensure it only runs on the client-side.

    ```tsx
    // pages/editor.tsx
    import dynamic from 'next/dynamic';

    const MyEditorComponent = dynamic(() => import('../components/MyEditor'), {
      ssr: false,
      loading: () => <p>Loading Editor...</p>
    });

    export default function EditorPage() {
      return <MyEditorComponent />;
    }
    ```

### Bad Polyfills

- **`buffer`**: An old version of the `buffer` polyfill can cause JSON parsing errors. If you see `Uncaught Error: Unexpected non-whitespace character after JSON...`, enforce a newer version in your `package.json`:

    ```json
    {
      "resolutions": { // For Yarn
        "buffer": "^5.7.1"
      },
      "overrides": { // For npm/pnpm
        "buffer": "^5.7.1"
      }
    }
    ```

## Performance Issues

### High Memory Usage

- **Dispose of Instances**: Ensure you call the `.dispose()` method on `EditorApp`, `LanguageClientWrapper`, and `MonacoVscodeApiWrapper` instances when they are no longer needed (e.g., when a component unmounts).
- **Limit Open Files**: In a multi-file setup, manage the number of files kept in memory.
- **Use Classic Mode**: For simpler use cases, [Classic Mode](../advanced-usage/classic-mode.md) has a smaller memory footprint.

### Slow Editor Performance

- **Async Tokenization**: For large files, enable asynchronous tokenization in your editor configuration:

    ```json
    {
      "editor.experimental.asyncTokenization": true
    }
    ```

- **Web Workers**: Offload language server processing to a Web Worker to keep the main UI thread responsive.

## Debugging

### Enable Detailed Logging

To see detailed logs from the language client and server communication, set the `logLevel` in your `MonacoVscodeApiConfig`:

```typescript
import { LogLevel } from '@codingame/monaco-vscode-api';

const vscodeApiConfig = {
    // ...
    logLevel: LogLevel.Debug
};
```

### Trace LSP Messages

To inspect the raw Language Server Protocol messages being sent and received, you can enable tracing on the connection. This is highly effective for debugging language server behavior.

```typescript
// In Classic Mode
const connection = createConnection(webSocket);
connection.trace = 2; // 2 for verbose

// In Extended Mode, this requires custom connection handling
```

## Reporting Issues

If your issue is not covered here, please [file a bug report on GitHub](https://github.com/TypeFox/monaco-languageclient/issues/new/choose). A good bug report includes:

- **Clear Description**: A concise summary of the problem.
- **Reproduction Steps**: A minimal, self-contained code example that reproduces the issue.
- **Versions**: `monaco-languageclient`, `monaco-editor`, and Node.js versions.
- **Logs**: Any relevant error messages from the browser console or language server output.
