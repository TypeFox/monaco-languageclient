# Migration Guide

This guide provides instructions for major migrations starting at version 10:

- [v10 -> v11](#migrating-from-v10-to-v11): from `monaco-languageclient` version `10` to version `11` and `@typefox/monaco-editor-react` version `7` to version `8`
- [Migrating to v10](#migrating-to-v10): from `monaco-languageclient` version `9`, `monaco-editor-wrapper` version `6` or `@typefox/monaco-editor-react` version `6` to `monaco-languageclient` version `10` or `@typefox/monaco-editor-react` version `7`

## Migrating from v10 to v11

Version `11` updates the runtime and language tooling stack and changes how language client connections are configured. The wrapper lifecycle introduced in version `10` stays in place: you still start `MonacoVscodeApiWrapper`, `LanguageClientWrapper` and `EditorApp` separately. API changes were only required in the `LanguageClientConfig#connection`.

### Runtime and dependency requirements

- Use Node.js `>=22` and npm `>=10`.
- Align `@codingame/monaco-vscode-*` packages with version `37.1.0`.
- Align LSP dependencies with `vscode-languageclient@10.1.1`, `vscode-languageserver-protocol@3.18.3` and `vscode-ws-jsonrpc@4.0.0`.

### Language client connection configuration

Version `10` used `$type` to describe the transport:

- `WebSocketUrl`
- `WebSocketParams`
- `WebSocketDirect`
- `WorkerConfig`
- `WorkerDirect`

Version `11` uses `$family` and a connection realization factory instead. The built-in realizations are `LcWebSocket` and `LcWorker`, exported from `monaco-languageclient/lcwrapper`. With `v11` both direct connection transports (`WebSocketDirect` and `WorkerDirect`) were dropped, beacuse pre-configured worker or web socket prevent configuration changes regarding message readers and message writers.
The `LanguageClientConnectionRealization` interface was extracted to allow other connection realizations in the future.

#### WebSocket URL connections

<table>
<tr><th>v10</th><th>v11</th></tr>
<tr><td>

```ts
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

const languageClientConfig: LanguageClientConfig = {
  languageId,
  connection: {
    options: {
      $type: 'WebSocketUrl',
      url: 'ws://localhost:30000/myLangLS'
    }
  },
  clientOptions: {
    documentSelector: [languageId]
  }
};
```

</td><td>

```ts
import { LcWebSocket, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

const languageClientConfig: LanguageClientConfig = {
  languageId,
  connection: {
    options: {
      $family: 'WebSocket',
      realization: () => new LcWebSocket(),
      webSocketUrl: 'ws://localhost:30000/myLangLS'
    }
  },
  clientOptions: {
    documentSelector: [languageId]
  }
};
```

</td></tr>
</table>

The `createUrl` helper follows the same rename. If you passed `{ url: 'ws://...' }`, use `{ webSocketUrl: 'ws://...' }` instead.

#### WebSocket parameter connections

<table>
<tr><th>v10</th><th>v11</th></tr>
<tr><td>

```ts
connection: {
  options: {
    $type: 'WebSocketParams',
    secured: false,
    host: 'localhost',
    port: 30000,
    path: 'myLangLS'
  }
}
```

</td><td>

```ts
import { LcWebSocket } from 'monaco-languageclient/lcwrapper';

connection: {
  options: {
    $family: 'WebSocket',
    realization: () => new LcWebSocket(),
    secured: false,
    host: 'localhost',
    port: 30000,
    path: 'myLangLS'
  }
}
```

</td></tr>
</table>

#### Worker connections

<table>
<tr><th>v10</th><th>v11</th></tr>
<tr><td>

```ts
connection: {
  options: {
    $type: 'WorkerConfig',
    url: new URL('./worker/my-language-server.ts', import.meta.url),
    type: 'module',
    workerName: 'My Language Server'
  }
}
```

</td><td>

```ts
import { LcWorker } from 'monaco-languageclient/lcwrapper';

connection: {
  options: {
    $family: 'Worker',
    realization: () => new LcWorker(),
    workerUrl: new URL('./worker/my-language-server.ts', import.meta.url),
    type: 'module',
    workerName: 'My Language Server'
  }
}
```

</td></tr>
</table>

As mentioned before, `WorkerDirect` was removed. If you previously supplied an already-created `Worker`, migrate to `WorkerConfig` creation with `workerUrl` and `LcWorker` (see [examples](../packages/examples/)). It is already possible to provide a custom implementation of `LanguageClientConnectionRealization` and use it.

### Resource disposal and restart behavior

Version `10` configured restart and worker disposal on `LanguageClientConfig`:

```ts
const languageClientConfig: LanguageClientConfig = {
  // ...
  restartOptions: {
    retries: 3,
    timeout: 1000,
    keepWorker: true
  },
  disposeWorker: true
};
```

Version `11` moves those concerns into the connection configuration:

```ts
const languageClientConfig: LanguageClientConfig = {
  // ...
  connection: {
    retryConfig: {
      retries: 3,
      timeout: 1000,
      // optional
      disposeOnRestart: false
    },
    options: {
      $family: 'Worker',
      realization: () => new LcWorker(),
      workerUrl: new URL('./worker/my-language-server.ts', import.meta.url),
      type: 'module',
      disposeResources: true
    }
  }
};
```

Use `disposeResources` to control whether the connection realization owns and disposes the underlying worker or WebSocket resource. The restart behaviour implementation itself was not changed.

### Initializing before start

`LanguageClientWrapper` now has an explicit `init` method. Calling `start` still initializes automatically, but calling `init` yourself is useful when you need access to the worker or message transports before the language client starts. This basically allows you to get access to the worker like you had when using `WorkerDirect` with `v10`:

```ts
const lcWrapper = new LanguageClientWrapper(languageClientConfig);
await lcWrapper.init();

const worker = lcWrapper.getWorker();

await lcWrapper.start();
```

### Direct message transports and custom transports

The old `connection.messageTransports` and direct transport variants are no longer the default extension point. Use one of the built-in connection realizations for normal Worker and WebSocket setups. For custom ownership, custom connection startup or non-standard transports, implement `LanguageClientConnectionRealization` and return the `MessageTransports` from its `init` method.

### `vscode-ws-jsonrpc` import updates

If you import from `vscode-ws-jsonrpc/socket`, move those imports to the main package export:

<table>
<tr><th>v3</th><th>v4</th></tr>
<tr><td>

```ts
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc/socket';
```

</td><td>

```ts
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
```

</td></tr>
</table>

The `vscode-ws-jsonrpc/server` sub-export remains available for server-side helpers.

## Migrating to v10

The one big configuration object used by `monaco-editor-wrapper` version `6` is now separated into three blocks.
Instead of using `MonacoEditorLanguageClientWrapper` to `init` the configuration and start the wrapper `monaco-languageclient` version `10` now requires three different steps:

1. Create a new `MonacoVscodeApiWrapper` with the specified `MonacoVscodeApiConfig` and `start` it. This can only be done once and the `start` call must be awaited.
2. Create a new `LanguageClientWrapper` with the specified `LanguageClientConfig` and `start` it. Again, this an async call, but the `LanguageClientWrapper` can be disposed and restarted if needed.
3. Create a new `EditorApp` with the specified `EditorAppConfig` and `start` it. This is also an async call, but the `EditorApp` can be disposed and restarted if needed.

<table>
<tr><th>v9/v6</th><th>v10</th></tr>
<tr><td>

```ts
import { MonacoEditorLanguageClientWrapper, type WrapperConfig } from 'monaco-editor-wrapper';

const wrapperConfig: WrapperConfig = {
  $type: 'extended',
  htmlContainer: document.getElementById('monaco-editor-root')!,
  vscodeApiConfig: {
    // ...
  },
  languageClientConfigs: {
    configs: {
      myLang: {
        // ...
      }
    }
  },
  editorAppConfig: {
    // ...
  }
};

const wrapper = new MonacoEditorLanguageClientWrapper();
await wrapper.init(wrapperConfig);
await wrapper.start();
```

</td><td>

```ts
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
        $type: 'EditorService'
    }.
    // ...
};
const languageClientConfig: LanguageClientConfig = {
    languageId: myLang,
    // ...
};
const editorAppConfig: EditorAppConfig = {
    // ...
};

const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();

const lcWrapper = new LanguageClientWrapper(languageClientConfig);
await lcWrapper.start();

const editorApp = new EditorApp(editorAppConfig);
const htmlContainer = document.getElementById('monaco-editor-root')!;
await editorApp.start(htmlContainer);
```

</td></tr>
</table>

The content and scope configuration objects `MonacoVscodeApiConfig`, `LanguageClientConfig` and `EditorAppConfig` changed sligthly compared to their counter parts in the previous version. The differences are explained in the following chapters.

## MonacoVscodeApiConfig

`MonacoVscodeApiConfig` containes all things that were previously part of `vscodeApiConfig` of the `WrapperConfig`. The `viewsConfig` config in addition to the `$type` is now mandatory. But, `serviceOverrides` is now optional.

<table>
<tr><th>v9/v6</th><th>v10</th></tr>
<tr><td>

```ts
$type: 'extended',
const wrapperConfig: WrapperConfig = {
    $type: 'extended',
    htmlContainer: document.getElementById('monaco-editor-root')!
    vscodeApiConfig: {
        serviceOverrides: {
        },
        // ...
    },
    // ...
```

</td><td>

```ts
const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: 'extended',
  viewsConfig: {
    $type: 'EditorService'
  }
  // ...
};
```

</td></tr>
</table>

## LanguageClientConfig(s)

The previous `languageClientConfigs` can now be expressed as single `LanguageClientConfig` to be directly used with `LanguageClientWrapper` or multiple language client configurations can be expressed in the `LanguageClientConfigs` and used with `LanguageClientManager`. Obey, that `languageId` is now a mandatory property in `LanguageClientConfig`.

<table>
<tr><th>v9/v6</th><th>v10</th></tr>
<tr><td>

```ts
$type: 'extended',
const wrapperConfig: WrapperConfig = {
    // ...
    languageClientConfigs: {
        configs: {
            mylang: {
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30000/myLangLS'
                    }
                },
                clientOptions: {
                    documentSelector: [languageId],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.file('/workspace')
                    }
                }
            }
        }
    },
    // ...
```

</td><td>

```ts
const languageClientConfig: LanguageClientConfig = {
  languageId,
  connection: {
    options: {
      $type: 'WebSocketUrl',
      // at this url the language server for myLang must be reachable
      url: 'ws://localhost:30000/myLangLS'
    }
  },
  clientOptions: {
    documentSelector: [languageId],
    workspaceFolder: {
      index: 0,
      name: 'workspace',
      uri: vscode.Uri.file('/workspace')
    }
  }
};

const lcWrapper = new LanguageClientWrapper(languageClientConfig);
await lcWrapper.start();
```

</td></tr>
<tr><td>
</td><td>

```ts
const lcManager = new LanguageClientManager();
const languageClientConfigs: LanguageClientConfigs = {
  configs: {
    myLang1: {
      // ...
    },
    myLang2: {
      // ...
    }
  }
};

await lcManager.setConfigs(languageClientConfigs);
await lcManager.start();
```

</td></tr>
</table>

## EditorAppConfig

`EditorAppConfig` can is a one to one translation in the new version.

<table>
<tr><th>v9/v6</th><th>v10</th></tr>
<tr><td>

```ts
$type: 'extended',
const wrapperConfig: WrapperConfig = {
    // ...
    editorAppConfig: {
        codeResources: {
            modified: {
                text: code,
                uri: codeUri
            }
        },
        // ...
    }
    // ...
```

</td><td>

```ts
const editorAppConfig: EditorAppConfig = {
  codeResources: {
    main: {
      text: code,
      uri: codeUri
    }
  }
  // ...
};
```

</td></tr>
</table>

## @typefox/monaco-editor-react

`@typefox/monaco-editor-react` uses the same configuration because internally it relies on `MonacoVscodeApiWrapper`, `LanguageClientWrapper` and `EditorApp`. Thus, you need to pass `MonacoVscodeApiConfig` (optional as you can initialize the api independently), `LanguageClientConfig` (optional) and `EditorAppConfig` (as described in the previous chapter. Remember that the React component only allows to use one `LanguageClientConfig`.

<table>
<tr><th>v6</th><th>v7</th></tr>
<tr><td>

```tsx
<MonacoEditorReactComp
  wrapperConfig={appConfig.wrapperConfig}
  style={{ height: '100%' }}
  onError={(e) => {
    console.error(e);
  }}
/>
```

</td><td>

```tsx
<MonacoEditorReactComp
  vscodeApiConfig={appConfig.vscodeApiConfig}
  editorAppConfig={appConfig.editorAppConfig}
  languageClientConfig={appConfig.languageClientConfig}
  style={{ height: '100%' }}
  onError={(e) => {
    console.error(e);
  }}
/>
```

</td></tr>
</table>

The callbacks names have been aligned and a couple have been added. None are mandatory:

- `onVscodeApiInitDone`: **New** Called once `MonacoVscodeApiWrapper` has been started.
- `onEditorStartDone`: **New** Called when `monaco-editor` has been started.
- `onLanguageClientsStartDone`: **New** Called when a language client has been started.
- `onTextChanged`: Invoked when the text in the editor is changed.
- `onError`: Called when an error occurred.
- `onDisposeEditor`: **New** Called when `monaco-editor` has been disposed.
- `onDisposeLanguageClient`: **New** Called when a language client has been disposed.

## Service Initialization only

If you used `initServices` to directly initialize services, you have to change your approach. It is now possible to just rely on `MonacoVscodeApiWrapper` to perform the service initialization.

<table>
<tr><th>v9/v6</th><th>v10</th></tr>
<tr><td>

```ts
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { initServices } from "monaco-languageclient/vscode/services";

initServices({
    serviceOverrides: {
        ...getKeybindingsServiceOverride()
    }
};
```

</td><td>

```ts
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';

const vscodeApiConfig: MonacoVscodeApiConfig = {
  $type: 'classic',
  viewsConfig: {
    $type: 'EditorService'
  },
  serviceOverrides: {
    ...getKeybindingsServiceOverride()
  }
};
const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();
```

</td></tr>
</table>
