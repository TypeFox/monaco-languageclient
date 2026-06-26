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
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection
} from 'vscode-languageserver/browser';
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
const worker = new Worker(
  new URL('./path/to/main-browser.ts', import.meta.url),
  { type: 'module', name: 'MyLanguageServer' }
);
```

Vite will automatically bundle the worker entry point and its dependencies at build time. This approach is actually used by most of the examples in this repository as well, so there's plenty of reference material here.

### A note about MiniLogo

The MiniLogo example in this repository takes a slightly different approach. We consume a **pre-built** language server worker from the [`langium-minilogo`](https://github.com/TypeFox/langium-minilogo) npm package rather than building from source. The package provides a `ls-web` export endpoint that gives us a pre-bundled ESM language server ready to load as a Web Worker:

```ts
const worker = new Worker(
  new URL('langium-minilogo/ls-web', import.meta.url),
  { type: 'module', name: 'MiniLogo Language Server' }
);
```

This allows us to depend on the LS as a standalone artifact without needing to bundle it ourselves. However, rest assured the process outlined above is how that bundle is produced. You can check out the [langium-minilogo](https://github.com/TypeFox/langium-minilogo) project to see exactly how it's done, and you can see the working [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) in this repository for the complete client-side integration.

## 3. Monaco Client Configuration

Alright, now that we have our LS ready, we can start setting up the Monaco editor side. We'll set up the `monaco-languageclient` in **Extended Mode**, which provides us with full VS Code-like functionality including TextMate grammars, keybindings, and service overrides, as outlined in [prior tutorials](../configuration.md).

The client setup involves three parts:

1. **`MonacoVscodeApiConfig`**: configures the VS Code API layer, theme, extensions, and editor workers
2. **`LanguageClientConfig`**: connects to the language server worker
3. **`EditorAppConfig`**: defines the initial code content to display

### Loading the Worker

First, we can create the Web Worker by pointing at our bundled language server, wherever that may be:

```ts
const worker = new Worker(
  new URL('./worker/my-language-server-bundle.js', import.meta.url),
  { type: 'module', name: 'MyLanguageServer' }
);
```

In a Vite project, we can reference the source file directly as well, as noted in the prior section.

Then we need to set up our message readers/writers for the language client to use. This matches with the transport layer we've built into our browser-based language server bundle.

```ts
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser';

const reader = new BrowserMessageReader(worker);
const writer = new BrowserMessageWriter(worker);
```

### Syntax Highlighting with TextMate

In Extended Mode (which we're using here), we use TextMate grammars for syntax highlighting (note that Monarch grammars are only supported in Classic Mode). We can register a TextMate grammar and language configuration like so:

```ts
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

// load grammar and configuration
// in this case as raw strings, but they can be added in literally as well
import languageConfig from './config/language-configuration.json?raw';
import textmateGrammar from './syntaxes/my-language.tmLanguage.json?raw';

// register the paths for config & textmate grammar
const extensionFilesOrContents = new Map<string, string | URL>();
extensionFilesOrContents.set('/my-language-configuration.json', languageConfig);
extensionFilesOrContents.set('/my-language-grammar.json', textmateGrammar);

const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: 'extended',
  // ... other config (see full example below)
  extensions: [{
    config: {
      name: 'my-language-example',
      publisher: 'my-org',
      version: '1.0.0',
      engines: { vscode: '*' },
      contributes: {
        languages: [{
          id: 'my-language',
          extensions: ['.mylang'],
          aliases: ['MyLanguage'],
          // should match the path above
          configuration: '/my-language-configuration.json'
        }],
        grammars: [{
          language: 'my-language',
          scopeName: 'source.my-language',
          // should match the path above
          path: '/my-language-grammar.json'
        }]
      }
    },
    filesOrContents: extensionFilesOrContents
  }]
};
```

In case we don't have one, Langium can generate a TextMate grammar for us. We just need to add the following to our `langium-config.json`, and run `npm run langium:generate` to get a default textmate grammar for our language.

```json
{
  "textMate": {
    "out": "syntaxes/my-language.tmLanguage.json"
  }
}
```

Then run `npm run langium:generate` to produce a textmate grammar file. The generated grammar covers basic token types, and we can customize it further for improved highlighting.

### Language Client Configuration

Next, connect the language client to the worker using the `WorkerDirect` mode:

```ts
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

const languageClientConfig: LanguageClientConfig = {
  languageId: 'my-language',
  clientOptions: {
    documentSelector: ['my-language']
  },
  connection: {
    options: {
      $type: 'WorkerDirect',
      worker
    },
    messageTransports: { reader, writer }
  }
};
```

The `languageId` needs to match the language `id` we registered in the extension configuration above. At this point it can be helpful to pull it out into a constant to avoid mismatches.

### Full Client Example

And now we've got everything we need for the client. Here's the complete setup bringing all the pieces together. This follows the same patterns used by the statemachine and langium-dsl examples as well:

```ts
import { LogLevel } from '@codingame/monaco-vscode-api';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import {
  MonacoVscodeApiWrapper,
  type MonacoVscodeApiConfig
} from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser';

// load grammar and configuration as raw strings (vite ?raw import)
import languageConfig from './config/language-configuration.json?raw';
import textmateGrammar from './syntaxes/my-language.tmLanguage.json?raw';

async function startEditor() {
  // 1. create the language server worker
  const worker = new Worker(
    new URL('./worker/my-language-server.js', import.meta.url),
    { type: 'module', name: 'MyLanguageServer' }
  );
  const reader = new BrowserMessageReader(worker);
  const writer = new BrowserMessageWriter(worker);

  // 2. register TextMate grammar as a virtual extension
  const extensionFilesOrContents = new Map<string, string | URL>();
  extensionFilesOrContents.set('/my-language-configuration.json', languageConfig);
  extensionFilesOrContents.set('/my-language-grammar.json', textmateGrammar);

  const languageId = 'my-language';

  // 3. configure the VS Code API layer
  const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
      $type: 'EditorService',
      htmlContainer: document.getElementById('monaco-editor-root')!
    },
    logLevel: LogLevel.Debug,
    serviceOverrides: {
      ...getKeybindingsServiceOverride()
    },
    monacoWorkerFactory: configureDefaultWorkerFactory,
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'Default Dark Modern',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.wordBasedSuggestions': 'off',
        'editor.experimental.asyncTokenization': true
      })
    },
    extensions: [{
      config: {
        name: 'my-language-example',
        publisher: 'my-org',
        version: '1.0.0',
        engines: { vscode: '*' },
        contributes: {
          languages: [{
            id: languageId,
            extensions: ['.mylang'],
            aliases: ['MyLanguage'],
            configuration: '/my-language-configuration.json'
          }],
          grammars: [{
            language: languageId,
            scopeName: 'source.my-language',
            path: '/my-language-grammar.json'
          }]
        }
      },
      filesOrContents: extensionFilesOrContents
    }]
  };

  // 4. configure the language client
  const languageClientConfig: LanguageClientConfig = {
    languageId,
    clientOptions: {
      documentSelector: [languageId]
    },
    connection: {
      options: {
        $type: 'WorkerDirect',
        worker
      },
      messageTransports: { reader, writer }
    }
  };

  // 5. configure the editor content
  const editorAppConfig: EditorAppConfig = {
    codeResources: {
      modified: {
        text: `// your default code here`,
        uri: '/workspace/example.mylang'
      }
    }
  };

  // 6. start everything in order: API wrapper -> language client -> editor
  const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
  await apiWrapper.start();

  const lcWrapper = new LanguageClientWrapper(languageClientConfig);
  await lcWrapper.start();

  const editorApp = new EditorApp(editorAppConfig);
  await editorApp.start(document.getElementById('monaco-editor-root')!);

  console.log('Editor with language server is ready!');
}

startEditor().catch(console.error);
```

You'll likely have additional logic between steps, or organized in a structurally distinct fashion, but the setup order is important.

### A note on the setup order:

The order in which we initialize the wrapper, client, and editor app itself is important to note.

1. **`MonacoVscodeApiWrapper.start()`**: initializes the VS Code API layer, registers extensions, sets up editor workers and themes. This needs to happen first so that everything under the hood is ready to go (especially the LS).
2. **`LanguageClientWrapper.start()`**: connects to the language server worker (which should be running now). The VS Code API also needs to be initialized before the language client can register itself.
3. **`EditorApp.start()`**: this creates the Monaco editor instance and loads the initial content. The editor is the last part because it relies on the API layer and language services being ready.

We _can_ start up the editor app without the aforementioned steps, we'll just be missing the language support & other VS Code related functionality.

### MiniLogo Client

The MiniLogo client follows this pattern outlined above. The main differences are language-specific: the language ID is `minilogo`, the file extension is `.minilogo`, the TextMate grammar is generated from the MiniLogo Langium grammar, and the default editor content is a MiniLogo program:

```ts
const editorAppConfig: EditorAppConfig = {
  codeResources: {
    modified: {
      text: `def test() {
    move(100, 0)
    pen(down)
    move(100, 100)
    move(-100, 100)
    move(-100, -100)
    move(100, -100)
    pen(up)
}
color(white)
test()
`,
      uri: '/workspace/example.minilogo'
    }
  }
};
```

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
      html, body {
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
