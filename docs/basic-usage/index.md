# Basic Usage

This section covers the basic concepts and usage patterns for the Monaco Language Client. These guides are designed to get you up and running quickly.

## Section Contents

- **[Getting Started](getting-started.md)** - Your first Monaco Language Client integration with a minimal working example
- **[Configuration](configuration.md)** - Understanding basic configuration options and how to customize your setup
- **[Examples](examples.md)** - Simple, practical examples demonstrating common integration patterns

## Quick Overview

`monaco-languageclient` provides two different integration approaches for `monaco-editor`. Theses are the `classic` mode and the `extended` mode. The former allows to use `monaco-editor` with monarch and you can use its internal languages api. The latter automatically makes use of Textmate for themeing and allows to configure all possible services from `@codingame/monaco-vscode-api`.

### Extended Mode (Recommended)

We recommend to use `extended` mode allowing to make use of VSCode services for richer functionality.
Compared with the classic mode the only difference regarding the `monaco-vscode-api` configuration object is the `$type` property. We put this to use [below](#editor-start).

```typescript
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    // both $type and $viewsConfig are mandatory
    $type: 'extended',
    viewsConfig: {
        $type: 'ViewsService',
        htmlContainer: document.getElementById('monaco-editor-root')!
    },
    // further configuration
};
```

### Classic Mode

Lighter-weight integration with standalone Monaco Editor.

```typescript
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

const vscodeApiConfig: MonacoVscodeApiConfig = {
    // both $type and $viewsConfig are mandatory
    $type: 'classic',
    viewsConfig: {
        // in classic mode only one type can be configured
        $type: 'EditorService',
        htmlContainer: document.getElementById('monaco-editor-root')!
    },
    // further configuration
};
```

### Editor start

The `vscodeApiConfig` created in any of the two examples above are used to initialize the VSCode api and all services. `MonacoVscodeApiWrapper` can only be started once and it has to be done before starting the editor. Errors will be thrown if you don't do that.

```typescript
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { EditorApp } from 'monaco-languageclient/editorApp';

// always start the monaco-vscode-api wrapper first and await it
const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
await apiWrapper.start();

// create editor with empty content
const editorApp = new EditorApp({});
await editorApp.start(apiWrapper.getHtmlContainer());
```

Generally you should start with Extended Mode unless you have specific constraints that require Classic Mode.

## Next Steps

- **New to the Monaco Language Client?** Start with [Getting Started](getting-started.md)
- **Need specific configuration help?** Check [Configuration](configuration.md)
- **Jump straight to Practical Usage?** Browse [Examples](examples.md)

For more advanced use cases, you can also directly read the [Advanced Usage](../advanced-usage/index.md) section.
