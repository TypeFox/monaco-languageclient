# Troubleshooting Guide

This guide provides solutions to common issues encountered when working with Monaco Language Client. If you can't find a solution here, check our [GitHub Issues](https://github.com/TypeFox/monaco-languageclient/issues) or consider [filing a new one](#reporting-issues).

## Installation & Dependency Issues

### VSCode API Initialization Order

Whenever you use `monaco-editor`/`@codingame/monaco-vscode-editor-api` `vscode`/`@codingame/monaco-vscode-extension-api`, `monaco-languageclient` or `@typefox/monaco-editor-react` ensure they are imported before you do any `monaco-editor` or `vscode` api related initialization work or start using it.

If you use pnpm or yarn, you have to add `vscode` / `@codingame/monaco-vscode-api` as direct dependency, otherwise the installation will fail:

```json
"vscode": "npm:@codingame/monaco-vscode-extension-api@^22.1.8"
```

### Missing Overrides or Resolutions

To ensure all Monaco-related packages use a single, compatible version, you must add an override (for npm/pnpm) or resolution (for Yarn) to your `package.json`.

**npm/pnpm (`package.json`):**s

```json
{
  "overrides": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^22.1.8"
  }
}
```

**Yarn (`package.json`):**

```json
{
  "resolutions": {
    "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^22.1.8"
  }
}
```

### Dependency Version Mismatches

If you encounter numerous compile errors deep within `monaco-editor` or `vscode` files, you likely have a version mismatch on one or more of your dependencies.

1. **Check for duplicates**: Run `npm list @codingame/monaco-vscode-api` to see if multiple versions are installed.
2. **Fix dependencies**: Ensure all `@codingame/monaco-vscode-api` related packages in your `package.json` point to the same version.
3. **Reinstall**: After fixing versions, delete `node_modules` and your lock file (`package-lock.json`, `pnpm-lock.yaml`, etc.) and run `npm install` (or equivalent).

Additionally, if you see a message in the browser console starting with `Another version of monaco-vscode-api has already been loaded. Trying to load...` then definitely a version mismatch was detected by `@codingame/monaco-vscode-api`. This error is reported since v14.

### @codingame/monaco-vscode-editor-api / monaco-editor usage

When you use the libraries from this project you are no longer required to proxy `monaco-editor` like `"monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^22.1.8"` in you `package.json`. You can directly use it like so:

```js
import * as monaco from '@codingame/monaco-vscode-editor-api';
```

If your dependency stack already contains a reference `monaco-editor` you must enforce the correct reference to `@codingame/monaco-vscode-editor-api` or you will have problems with mismatching code. Use`overrides` (npm/pnpm) or `resolutions` (yarn) to do so:

```json
"overrides": {
  "monaco-editor": "npm:@codingame/monaco-vscode-editor-api@^22.1.8"
}
```

### Volta

There are [Volta](https://volta.sh/) instructions in the `package.json` files. When you have Volta available it will ensure the exactly specified `node` and `npm` versions are used.

### Bad Polyfills

- **`buffer`**: An old version of the `buffer` polyfill can cause JSON parsing errors. If you see errors like so:

```yaml
Uncaught Error: Unexpected non—whitespace character after JSON at position 2

SyntaxError: Unexpected non—whitespace character after JSON at position 2
    at JSON. parse («anonymous>)
```

Then it's likely you have an old version of `buffer` interfering (see [#538](https://github.com/TypeFox/monaco-languageclient/issues/538) and [#546](https://github.com/TypeFox/monaco-languageclient/issues/546)). You can enforce a current version by adding a `resolution` as shown below to your projects' `package.json`.

```json
{
  "resolutions": { // For Yarn
    "buffer": "~6.0.3"
  },
  "overrides": { // For npm/pnpm
    "buffer": "~6.0.3"
  }
}
```

## Common Runtime Issues

### Language Features Not Working

If the editor loads but language features (like IntelliSense, diagnostics, or hover information) are missing, check the following:

1. **Language Server Connection**: Ensure your language server is running and accessible. For WebSocket connections, check the browser's developer console for any connection errors.
2. **Language Client Configuration**: Verify that your `languageClientConfig` is correct, especially the `documentSelector`. The selector must match the language ID of your editor's model.
3. **Initialization**: Make sure all necessary components (`MonacoVscodeApiWrapper`, `LanguageClientWrapper`, `EditorApp`) are initialized in the correct order. Asynchronous initialization steps should be properly awaited.

### Errors in Browser Console

- **"Another version of monaco-vscode-api has already been loaded"**: This indicates a version mismatch between Monaco-related packages. See the [Dependency Issues](#dependency-issues) section for a solution.
- **"Uncaught Error: Unexpected non-whitespace character after JSON at position 2"**: This is often caused by an outdated `buffer` polyfill. See the [Bad Polyfills](#bad-polyfills) section.

### Connection Issues

#### WebSocket Connection Failed

If the client cannot connect to your WebSocket-based language server:

1. **Server Status**: Verify the language server process is running and listening on the correct port and path.
2. **URL Mismatch**: Double-check the `url` in your `WebSocketUrl` configuration.
3. **CORS**: Ensure your server's Cross-Origin Resource Sharing (CORS) policy allows connections from the origin your web application is served from.
4. **Firewall/Proxy**: Check that no firewalls or network proxies are blocking the WebSocket connection.

#### Web Worker Not Loading

If your Web Worker-based language server isn't functioning:

1. **Bundler Configuration**: Ensure your bundler (Vite, Webpack) is correctly configured to handle and output worker files. See the [Webpack Worker Issues](#webpack-worker-issues) section for specific guidance.
2. **File Path**: Verify the path to the worker script is correct.
3. **CORS**: If loading the worker from a different origin, ensure CORS headers are correctly set.

## Bundler & Framework Issues

### Vite

When you are using the vite dev server there are some issues with imports, please [read this recommendation](https://github.com/CodinGame/monaco-vscode-api/wiki/Troubleshooting#if-you-use-vite).

- **Assertion failed (There is already an extension with this id)**: This error occurs when multiple, mismatching versions of `vscode` / `@codingame/monaco-vscode-extension-api` are bundled. Add a `dedupe` rule to your `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

// ...

export default defineConfig({
  resolve: {
    dedupe: ['vscode']
  }
});
```

### Monaco-Editor and React

We recommend you now use `typefox/monaco-editor-react`.

But if you need to use `@monaco-editor/react`, then add the `monaco-editor` import at the top of your editor component file [source](https://github.com/suren-atoyan/monaco-react#use-monaco-editor-as-an-npm-package):

```javascript
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

loader.config({ monaco });
```

### Webpack Worker Issues

Webpack can have trouble with the unbundled workers from `@codingame/monaco-vscode-api`. [jhk-mjolner](https://github.com/jhk-mjolner) provided a solution in the context of issue #853 [here](https://github.com/TypeFox/monaco-languageclient/issues/853#issuecomment-2709959822). To fix this, you need to pre-bundle the workers.

1. **Install `webpack-cli`**: `npm install --save-dev webpack-cli`
2. **Create a bundling script** (`bundle-monaco-workers.js`) with the following content:

```javascript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  entry: {
    editor: './node_modules/@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js',
    textmate: './node_modules/@codingame/monaco-vscode-textmate-service-override/worker.js'
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, './src/assets/monaco-workers')
    // if this is true (default), webpack will produce code trying to access global `document` variable for the textmate worker, which will fail at runtime due to being a worker
  },
  mode: 'production',
  performance: {
    hints: false
  }
};
```

3. **Add a script to `package.json`**: `"bundle:workers": "webpack --config bundle-monaco-workers.js"`
4. **Run the script**: `npm run bundle:workers`
5. **Configure the worker factory** in your application to point to these pre-bundled workers, by adjusting the `workerLoaders` parameter in the `useWorkerFactory` to point to the pre-bundled workers:

```js
'TextEditorWorker': () => new Worker('/assets/monaco-workers/editor.js', {type: 'module'}),
'TextMateWorker': () => new Worker('/assets/monaco-workers/textmate.js', {type: 'module'}),
```

Additionally, if you haven't already, consider enabling async tokenization in your editor config:

```json
{
  "editor.experimental.asyncTokenization": true
}
```

### SSR Frameworks (Next.js, etc.)

Monaco Language Client requires a browser environment and will not run during Server-Side Rendering (SSR). To use it in frameworks like Next.js, you'll need to use dynamic imports to load your editor component dynamically, to ensure it only runs on the client-side.

```tsx
// ex. pages/editor.tsx
import dynamic from 'next/dynamic';

const MyEditorComponent = dynamic(async () => {
  const comp = await import('@typefox/monaco-editor-react');
  const { window, workspace, Uri } = (await import('vscode'));
  // ... cont setup
}, {
  ssr: false,
  loading: () => <p>Loading Editor...</p>
});

export default function EditorPage() {
  return <MyEditorComponent />;
}
```

For more details, see the [Next.js example](./../../verify/next).

### Serve all files required

`@codingame/monaco-vscode-api` requires json and other files to be served. In your project's web-server configuration you have to ensure you don't prevent this.

### Bad Polyfills

- **`buffer`**: An old version of the `buffer` polyfill can cause JSON parsing errors. If you see errors like so:

```yaml
Uncaught Error: Unexpected non—whitespace character after JSON at position 2

SyntaxError: Unexpected non—whitespace character after JSON at position 2
    at JSON. parse («anonymous>)
```

Then it's likely you have an old version of `buffer` interfering (see [#538](https://github.com/TypeFox/monaco-languageclient/issues/538) and [#546](https://github.com/TypeFox/monaco-languageclient/issues/546)). You can enforce a current version by adding a `resolution` as shown below to your projects' `package.json`.

```json
{
  "resolutions": { // For Yarn
    "buffer": "~6.0.3"
  },
  "overrides": { // For npm/pnpm
    "buffer": "~6.0.3"
  }
}
```

## Performance Issues

### High Memory Usage

- **Dispose of Instances**: Ensure you call the `.dispose()` method on `EditorApp`, `LanguageClientWrapper`, and `MonacoVscodeApiWrapper` instances when they are no longer needed (e.g., when a component unmounts).
- **Limit Open Files**: In a multi-file setup, manage the number of files kept in memory.
- **Use Classic Mode**: For simpler use cases, [Classic Mode](./index.md#classic-mode) has a smaller memory footprint.

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
