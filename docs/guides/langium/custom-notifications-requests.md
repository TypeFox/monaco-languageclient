# Custom Notifications and Requests with Langium Language Servers

What's great about the Language Server Protocol is that it defines a standard set of notifications and requests (diagnostics, completion, hover, etc.). These are fantastic, as they provide a common understanding of standard features that can be made available by most language servers. However, many language servers need to do a little bit more. Custom notifications and requests let us extend the communication between our Langium language server and the Monaco client for language-specific functionality. This comes up commonly when:

- additional results are returned by the language server post-build or validation
- generated artifacts need to be produced on-demand
- client-side information about the workspace needs to be passed to the LS, which wouldn't be available otherwise

With those cases in mind, this guide covers two patterns:

- **Notifications**: one-way, fire-and-forget messages suited for continuous, cheap updates. These can originate from the language client or the language server
- **Requests**: round-trip messages with a response, suited for more expensive or on-demand operations

The following sections will explain notifications and requests by using a general pattern first, and then a concrete MiniLogo implementation.

## Prerequisites

Before starting this guide, make sure you have:

- Completed the [Running a Langium Language Server in the Browser](./running-langium-ls-in-browser.md) guide — you should have a working Langium LS running as a Web Worker, connected to Monaco in Extended Mode
- A Langium project with working generation or other output you want to consume on the client

We'll continue using [MiniLogo](https://github.com/TypeFox/langium-minilogo) as the running example. MiniLogo is already set up with a generator that produces drawing commands from validated programs, and a request handler that can invoke generation on a given MiniLogo program on demand. You can see the working [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) in this repository for the complete client-side integration.

## Notifications (Server to Client)

Notifications are one-way messages — the sender fires them and doesn't wait for a response. They're ideal for pushing continuous updates from the language server to the client whenever something changes, like re-generated output after every document edit (for example, generated artifacts).

### How It Works

It's pretty simple actually. Notifications can be sent at any point once a connection is established with a client, but typically it makes sense to send notifications in response to something about the language server's processing. Commonly this means sending notifications with an additional payload after a document passes a certain build phase, such as post-validation (where we can determine if the document is OK and free of issues).

1. The **language server** registers an `onBuildPhase` listener that fires after documents are validated (or after another build phase such as parsed or linked).
2. Inside that listener, the server sends a custom notification with whatever payload we need
3. The **client** listens for that notification type and acts on the payload

### Generic Pattern

#### Server Side

In our Langium language server's browser entry point (`main-browser.ts`), we hook into the document builder's build phase to send notifications after validation (or another step) completes. We do this after `startLanguageServer` has been called, using the `shared` services:

```ts
import { DocumentState, type LangiumDocument } from 'langium';
import { Diagnostic, NotificationType } from 'vscode-languageserver/browser';

// define the notification type and its payload shape
type DocumentChangePayload = {
  uri: string;
  content: string;
  diagnostics: Diagnostic[];
};
const documentChangeNotification = new NotificationType<DocumentChangePayload>('browser/DocumentChange');

// listen for documents that have completed validation
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents: LangiumDocument[]) => {
  for (const document of documents) {
    // build whatever payload your language needs
    // can be any json serializable object
    const payload = buildPayload(document);

    // send the notification to the client
    connection.sendNotification(documentChangeNotification, payload);
  }
});
```

The notification type string (`'browser/DocumentChange'`) is arbitrary, it just needs to match between server and client. The payload can be any JSON-serializable object. Additionally, notifications can be sent in response to anything else we want to respond to, not just a build phase callback.

#### Client Side

On the client, we retrieve the `MonacoLanguageClient` instance from the `LanguageClientWrapper` and register a notification listener. We should do this after the language client has started up and is ready to receive a notification:

```ts
// after lcWrapper.start() has completed...
const client = lcWrapper.getLanguageClient();
if (!client) {
  throw new Error('Unable to obtain language client');
}

// listen for custom notifications from the language server
client.onNotification('browser/DocumentChange', (params) => {
  console.log('Document changed:', params.uri);
  handleDocumentChange(params);
});
```

The notification type string _must_ match the one used on the server side, whatever that may be.

### MiniLogo Version

#### Server Side

MiniLogo's `onBuildPhase` listener generates drawing commands from a validated AST and sends them as the notification content. When there are errors, it sends an empty command list so the client can clear its output. The following is a pretty accurate outline of the `main-browser.ts` that does this.

```ts
import { DocumentState, type LangiumDocument } from 'langium';
import { Diagnostic, NotificationType } from 'vscode-languageserver/browser';
import { Model } from './generated/ast.js';
import { generateStatements } from '../generator/generator.js';
import type { Command } from './minilogo-actions.js';

type DocumentChangePayload = {
  uri: string;
  content: string;
  diagnostics: Diagnostic[];
};
const documentChangeNotification = new NotificationType<DocumentChangePayload>('browser/DocumentChange');

// MiniLogo is the Langium-generated services object from createMiniLogoServices()
const jsonSerializer = MiniLogo.serializer.JsonSerializer;

shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, (documents: LangiumDocument[]) => {
  for (const document of documents) {
    const model = document.parseResult.value as Model;
    let commands: Command[] = [];

    // only generate commands when there are no errors
    const hasErrors = document.diagnostics?.some((d) => d.severity === 1) ?? false;
    if (!hasErrors) {
      commands = generateStatements(model.stmts);
    }

    // attach the generated commands to the model for serialization
    (model as unknown as { $commands: Command[] }).$commands = commands;

    // send a notification with a model + commands attached
    connection.sendNotification(documentChangeNotification, {
      uri: document.uri.toString(),
      content: jsonSerializer.serialize(model, {
        sourceText: true,
        textRegions: true
      }),
      diagnostics: document.diagnostics ?? []
    });
  }
});
```

#### Client Side

Since the MiniLogo language server sends a notification on _every_ document change, the handler can retrieve the generated commands and render an image using those drawing commands. There's also a bit of debouncing to avoid excessive re-renders while the user is actively making changes:

```ts
const client = lcWrapper.getLanguageClient();
if (!client) {
  throw new Error('Unable to obtain language client');
}

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let running = false;

client.onNotification('browser/DocumentChange', (params) => {
  // skip if we're still processing the previous update
  if (running) {
    return;
  }

  // clear any pending timeout to reset the debounce window
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
  }

  // wait for edits to settle before processing
  pendingTimeout = setTimeout(async () => {
    running = true;
    try {
      const commands = JSON.parse(params.content).$commands;
      // render the drawing commands (canvas, console, SVG, etc.)
      await renderMiniLogoCommands(commands);
    } finally {
      running = false;
    }
  }, 200);
});
```

This waits 200ms after the last change before proceeding to draw, and the `running` flag prevents overlapping renders. If our notification handler is cheap (e.g. logging), we can skip the debounce entirely and process every notification directly. This genuinely has some helpful implications when building up custom behavior on a language server.

## Requests (Client to Server)

Now that we've gone over Notifications, we can hop over to Requests.

Requests are round-trip messages — the client sends a request and awaits a response from the server. They're suited for operations that are costly or otherwise should be triggered in response to some action (a button click, a menu command) rather than happening continuously.

### How It Works

The flow is quite similar to how notifications are set up, with only a couple minor differences.

1. The **language server** registers a _handler_ for a custom command
2. The **client** sends a _request_ (typically via `workspace/executeCommand`) when the user triggers an action
3. The server processes the request and returns some result
4. The client receives the result and acts on it

### Generic Pattern

#### Server Side

In our Langium language server, we need to register a custom command handler. There are a couple ways of doing this. One is by adding a custom command handler directly via the connection object. Alternatively, Langium provides an `ExecuteCommandHandler` service we can register commands with. Both approaches are valid, the second is more idiomatic Langium, but we'll be using the first since it's simpler to go over in this tutorial (and the latter is essentially an abstraction on top of this approach).

So, going the direct request handler route, we typically do this after creating the language services and before invoking `startLanguageServer` in our `main-browser.ts` entry point for the LS:

```ts
// register a handler for workspace/executeCommand requests
connection.onRequest('workspace/executeCommand', async (params) => {
  if (params.command === 'myLanguage/generateOutput') {
    const input = params.arguments?.[0];
    const result = await processInput(input);
    return result;
  }

  // return undefined for commands you don't handle,
  // so other handlers or Langium defaults can process them
  return undefined;
});
```

A couple things to note from this snippet:

- The command name (`'myLanguage/generateOutput'`) is arbitrary (similar to the notification), but a namespaced prefix can help to avoid collisions with other existing commands.
- `workspace/executeCommand` is a standard LSP request method. The handler technically intercepts _all_ executeCommand requests, so we dispatch on `params.command` and return `undefined` for anything we're not interested in handling. The Langium service equivalent already handles this part for us.

#### Client Side

On the client, we can use the language client's `sendRequest` method. This returns a promise that resolves with the server's response, simple as that:

```ts
const client = lcWrapper.getLanguageClient();
if (!client) {
  throw new Error('Unable to obtain language client');
}

const result = await client.sendRequest('workspace/executeCommand', {
  command: 'myLanguage/generateOutput',
  arguments: ['some input data']
});

console.log('Server responded:', result);
```

The command name and arguments need to match what the server expects, same as for notifications.

### MiniLogo Version

#### Server Side

On the MiniLogo side, it registers a command handler that accepts a MiniLogo program as input, parses, validates it, and then returns the generated drawing commands:

```ts
connection.onRequest('workspace/executeCommand', async (params) => {
  if (params.command === 'minilogo/generateCommands') {
    const program = params.arguments?.[0] as string;
    // parse, validate, and generate commands for the given program
    const commands = await generateFromSource(program);
    return { commands };
  }
  return undefined;
});
```

This allows the client to request generation for arbitrary programs, not just the one currently in the editor.
It also allows the client to request generation on demand, such as when the user clicks a button (more on that in a second).

#### Client Side

A practical use case is a "Generate" button that sends a default (or the current) MiniLogo program to the server and renders the result:

```ts
// simple program that draws a white diamond
const defaultProgram = `def diamond() {
    move(100, 0)
    pen(down)
    move(100, 100)
    move(-100, 100)
    move(-100, -100)
    move(100, -100)
    pen(up)
}
color(white)
diamond()
`;

// some quick event listener code to respond to button clicks
document.getElementById('generate-button')?.addEventListener('click', async () => {
  const result = await client.sendRequest('workspace/executeCommand', {
    command: 'minilogo/generateCommands',
    arguments: [defaultProgram]
  });

  if (result?.commands) {
    renderMiniLogoCommands(result.commands);
  }
});
```

This assumes `client` was obtained from `lcWrapper.getLanguageClient()` during startup (following the pattern above). Overall, this approach works pretty well for actions that are expensive or should only happen on an as-needed basis, rather than in response to every document change.

## Notifications vs. Requests

The following is a quick table to summarize when it makes sense to use notifications or requests, in terms of their tradeoffs.

|               | Notifications                     | Requests                                |
| ------------- | --------------------------------- | --------------------------------------- |
| **Direction** | One-way                           | Round trip                              |
| **Response**  | None (fire-and-forget)            | Awaited response                        |
| **Use case**  | Continuous, semi-frequent updates | On-demand, as needed                    |
| **Example**   | Push logs or generated output     | Generate output from a program on click |

Both patterns can go in either direction, i.e clients can send notifications, and servers can send requests. LSP itself uses both directions heavily (ex. `textDocument/didOpen` is a client-to-server notification, `window/showMessageRequest` is a server-to-client request). Depending on what your're trying to set up, you may want to flip things around.

## Next Steps

- See the working [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) in this repository, which uses the [`langium-minilogo`](https://github.com/TypeFox/langium-minilogo) package for a pre-built language server with notification and request support
- See the [statemachine example](../../../packages/examples/src/langium/statemachine/) for another complete implementation
- Explore the [vscode-languageclient API](https://github.com/microsoft/vscode-languageserver-node) for the full set of notification and request methods available on `MonacoLanguageClient`
- Check the [Configuration Guide](../configuration.md) for more on connection types and language client options
