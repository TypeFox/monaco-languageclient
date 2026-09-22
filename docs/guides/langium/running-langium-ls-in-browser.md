# Running a Langium Language Server in the Browser

This guide walks through getting a Langium-based language server (LS) running in the browser as a Web Worker, and connected to Monaco via the `monaco-languageclient`. Each of these sections explains the general pattern first, and then follows with a concrete MiniLogo implementation to help cement the idea.

## Before we get started...

We need to make sure we've got the following first:

- An existing Langium project with a working language server (see the [Langium docs](https://langium.org/docs/introduction/) if you need to create one)
- Completed the [Getting Started](../getting-started.md) guide here, with an understanding of the basics of working with the `monaco-languageclient`
- Familiarity with the [Configuration](../configuration.md) guide, especially Extended Mode, as we'll be actively leveraging that here

We'll use a toy language called [MiniLogo](https://github.com/TypeFox/langium-minilogo) as the running example throughout this guide. MiniLogo is a Logo-like language (think penUp and penDown) with a variant built in Langium for demonstration purposes. We'll assume MiniLogo is already set up and working as a Langium project. These guides are structured so you can follow along with your own language and generalize the observations here, with a concrete application so things aren't _too_ abstract.

## Overview

At a high level, running a Langium language server in the browser involves three pieces:

1. A **browser entry point**: usually named `main-browser.ts` in a Langium project that starts the language server using browser-compatible message readers/writers, sets up a browser-compatible FS abstraction, and ensures that no system-level dependencies sneak in
2. **Bundled worker**: the browser entry point bundled as a self-contained Web Worker, this should be a completely standalone language server
3. **Monaco client**: a `monaco-languageclient` application that loads the worker and connects to it

## 1. Browser Entry Point

Oftentimes, a language server uses stdin & stdout for the communication channel. In the browser, we need to replace those with `BrowserMessageReader` and `BrowserMessageWriter`. These allow us to perform the same communication over the Worker's message port. We also need to use an `EmptyFileSystem` instead of Node-backed file system, since we won't be working with a concrete file system in the browser.

### Generic Pattern

Create a file `src/language-server/main-browser.ts` in your Langium project:

```ts
import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser';
// your services import will differ based on your language
import { createMyLanguageServices } from './my-language-module.js';

declare const self: DedicatedWorkerGlobalScope;

// browser-specific setup: use message reader/writer instead of stdin/stdout
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// inject shared and language-specific services with EmptyFileSystem
const { shared } = createMyLanguageServices({ connection, ...EmptyFileSystem });

// start the language server
startLanguageServer(shared);
```

Again, there are some key differences from a Node-based entry point worth keeping in mind:

- `BrowserMessageReader` / `BrowserMessageWriter` replace the Node stream-based readers/writers
- `EmptyFileSystem` replaces the Node file system, as our files will live in memory on the client side
- `DedicatedWorkerGlobalScope` is used to access the message port for communication with the main thread

We'll also need to ensure our `tsconfig.json` includes the `WebWorker` lib so TypeScript can understand where the worker global scope comes from:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "WebWorker"]
  }
}
```

### MiniLogo Version

For MiniLogo, the browser entry point looks the same structurally, only the service import differs:

```ts
// ...same imports from before

import { createMiniLogoServices } from './minilogo-module.js';

// ... same reader/write setup + connection setup

const { shared } = createMiniLogoServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);
```

## 2. Bundling the Worker

The browser entry point needs to be bundled into a single JavaScript file that can be loaded as a Web Worker. The bundle also needs to be free of any Node.js-specific modules (`fs`, `path`, `child_process`, etc.), since those won't be available in a browser context.

### Using esbuild

Next we'll want to add a build script to our Langium project's `package.json`, so we can easily produce a LS bundle on-demand. We can play with the options as need-be to suit our needs, but we should ensure that we at least bundle as esm:

```json
{
  "scripts": {
    "build:worker": "esbuild --minify ./out/language-server/main-browser.js --bundle --format=esm --outfile=./out/my-language-server-worker.js"
  }
}
```

The outfile is somewhat arbitrary, and can be placed wherever it makes sense. We can also set up an `esbuild.mjs` file to orchestrate the same build steps, or perform this in addition to a pre-existing build configuration.

As noted before, we're using `--format=esm` to produce an ES module worker. This is recommended and aligns with how `monaco-languageclient` load workers.

### Using Vite

If our client application uses Vite, we can also consume the LS without needing to pre-bundle it. Vite can bundle the worker inline when we reference it with `import.meta.url`:

```ts
const worker = new Worker(new URL('./path/to/main-browser.ts', import.meta.url), { type: 'module', name: 'MyLanguageServer' });
```

Vite will automatically bundle the worker entry point and its dependencies at build time. This approach is actually used by most of the examples in this repository as well, so there's plenty of reference material here.

### A note about MiniLogo

The MiniLogo example in this repository takes a slightly different approach. We consume a **pre-built** language server worker from the [`langium-minilogo`](https://github.com/TypeFox/langium-minilogo) npm package rather than building from source. The package provides a `ls-web` export endpoint that gives us a pre-bundled ESM language server ready to load as a Web Worker:

```ts
const worker = new Worker(new URL('langium-minilogo/ls-web', import.meta.url), { type: 'module', name: 'MiniLogo Language Server' });
```

This allows us to depend on the LS as a standalone artifact without needing to bundle it ourselves. However, rest assured the process outlined above is how that bundle is produced. You can check out the [langium-minilogo](https://github.com/TypeFox/langium-minilogo) project to see exactly how it's done, and you can see the working [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) in this repository for the complete client-side integration.

## 3. Monaco Client Configuration

Once the language server can run in a browser worker, the Monaco side follows the same three-part structure described in the [Configuration](../configuration.md) guide:

1. **`MonacoVscodeApiConfig`** registers services, theme, workers and the language extension contribution.
2. **`LanguageClientConfig`** connects `LanguageClientWrapper` to the worker with `LcWorker`.
3. **`EditorAppConfig`** defines the initial editor content.

Use Extended Mode if you want TextMate syntax highlighting. If you do not already have a TextMate grammar, Langium can generate one by adding this to `langium-config.json` and running `npm run langium:generate`:

```json
{
  "textMate": {
    "out": "syntaxes/my-language.tmLanguage.json"
  }
}
```

Then run `npm run langium:generate` to produce a textmate grammar file. The generated grammar covers basic token types, and we can customize it further for improved highlighting.

For the concrete extension registration, language configuration and TextMate grammar wiring, see the canonical MiniLogo config:

- [minilogoConfig.ts](../../../packages/examples/src/langium/langium-dsl/minilogo/config/minilogoConfig.ts)
- [minilogo.configuration.json](../../../packages/examples/src/langium/langium-dsl/minilogo/config/minilogo.configuration.json)
- [minilogo.tmLanguage.json](../../../packages/examples/src/langium/langium-dsl/minilogo/config/minilogo.tmLanguage.json)

### Language Client Configuration

Connect the language client to the worker with the built-in `LcWorker` connection realization:

```ts
import { LcWorker, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

const languageClientConfig: LanguageClientConfig = {
  languageId: 'my-language',
  clientOptions: {
    documentSelector: ['my-language']
  },
  connection: {
    options: {
      $family: 'Worker',
      realization: () => new LcWorker(),
      workerUrl: new URL('./worker/my-language-server.js', import.meta.url),
      type: 'module',
      workerName: 'MyLanguageServer'
    }
  }
};
```

The `languageId` must match the language `id` registered in the extension configuration.

For a complete client implementation, use these canonical examples:

- [MiniLogo config](../../../packages/examples/src/langium/langium-dsl/minilogo/config/minilogoConfig.ts)
- [MiniLogo entry point](../../../packages/examples/src/langium/langium-dsl/minilogo/main.ts)
- [Statemachine example](../../../packages/examples/src/langium/statemachine/main.ts)
- [Langium grammar DSL example](../../../packages/examples/src/langium/langium-dsl/main.ts)

### A note on the setup order:

The order in which we initialize the wrapper, client, and editor app itself is important to note.

1. **`MonacoVscodeApiWrapper.start()`**: initializes the VS Code API layer, registers extensions, sets up editor workers and themes. This needs to happen first so that everything under the hood is ready to go (especially the LS).
2. **`LanguageClientWrapper.start()`**: connects to the language server worker (which should be running now). The VS Code API also needs to be initialized before the language client can register itself.
3. **`EditorApp.start()`**: this creates the Monaco editor instance and loads the initial content. The editor is the last part because it relies on the API layer and language services being ready.

We _can_ start up the editor app without the aforementioned steps, we'll just be missing the language support & other VS Code related functionality.

## 4. HTML Setup

Right, so now that we've outlined all the client logic set up, we need a home for it all.
To do that, we can set up a regular HTML page that provides the container element for Monaco to attach to.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>My Language Editor</title>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
      #monaco-editor-root {
        height: 100vh;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="monaco-editor-root"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

If we're using Vite, this HTML file can be served directly as our index page.

## 5. Running It

With everything in place, we can generally run through the following steps from A-Z to get our setup working.

1. **Build the Langium project** so the language server source is compiled to JS
2. **Bundle the worker** (if not using Vite's inline bundling) via our choice of bundler (esbuild in our example above)
3. **Start the dev server** (e.g., `npm run dev` with Vite)
4. **Open the page** in our browser

We should see a Monaco editor with:

- **Syntax highlighting** from the TextMate grammar
- **Diagnostics** showing up inline from the language server
- **Code completion** for our language's keywords, references, etc.
- **Hover information** if our language server provides it
- Anything else we're providing via our LS

If the editor loads but language features aren't working, double check the browser console for errors.

A few common issues you might run into:

- **Worker failed to load**: verify the worker URL/path is correct and the bundle was built successfully
- **No syntax highlighting**: check that the TextMate grammar is registered correctly in the extension config, and that the language ID matches between the extension, language client, and editor content URI
- **Node.js modules in the bundle**: if the worker bundle fails, make sure the browser entry point doesn't import `fs`, `path`, or other Node-specific modules

For more help, see the [Troubleshooting Guide](../troubleshooting.md).

## Next Steps

- Continue to the next guide on [Custom Notifications and Requests](./custom-notifications-requests.md) to learn how to extend communication with our language server beyond standard LSP
- See the working [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) for a complete implementation that consumes a pre-built language server via the `langium-minilogo` package
- See the [statemachine example](../../../packages/examples/src/langium/statemachine/) and [langium-dsl example](../../../packages/examples/src/langium/langium-dsl/) for additional implementations that follow the build-from-source pattern
