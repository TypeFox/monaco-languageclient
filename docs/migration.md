# Migration Guide

This guide provides instructions for migrating from version `9` of `monaco-languageclient` and vrsion `6` of `monaco-editor-wrapper` or `@typefox/monaco-editor-react` verion `6` to `monaco-languageclient` version `10` or `@typefox/monaco-editor-react` verion `7`.

## Overview

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

The previous `languageClientConfigs` can now be expressed as single `LanguageClientConfig` to be directly used with `LanguageClientWrapper` or multiple language client configurations can be expressed in the `LanguageClientConfigs` and used with `LanguageClientsManager`. Obey, that `languageId` is now a mandatory property in `LanguageClientConfig`.

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
const lcManager = new LanguageClientsManager();
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
    },
    // ...
};
```

</td></tr>
</table>

## @typefox/monaco-editor-react

`@typefox/monaco-editor-react` uses the same configuration because internally it relies on `MonacoVscodeApiWrapper`, `LanguageClientWrapper` and `EditorApp`. Thus, you need to pass `MonacoVscodeApiConfig`, `LanguageClientConfig` and `EditorAppConfig` as described in the previous chapter. Remember that the React component only allows to use one `LanguageClientConfig`.

<table>
<tr><th>v6</th><th>v7</th></tr>
<tr><td>

```tsx
<MonacoEditorReactComp
    wrapperConfig={appConfig.wrapperConfig}
    style={{ 'height': '100%' }}
    onError={(e) => {
        console.error(e);
    }} />
```

</td><td>

```tsx
<MonacoEditorReactComp
    vscodeApiConfig={appConfig.vscodeApiConfig}
    editorAppConfig={appConfig.editorAppConfig}
    languageClientConfig={appConfig.languageClientConfig}
    style={{ 'height': '100%' }}
    onError={(e) => {
        console.error(e);
    }} />
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

If you used `initServices` to directly initializes services you have to change your approach. It is now possible to just rely on `MonacoVscodeApiWrapper` to perform the service initialization.

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
