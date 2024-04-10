# Monaco Language Client

[![Gitpod - Code Now](https://img.shields.io/badge/Gitpod-code%20now-blue.svg?longCache=true)](https://gitpod.io#https://github.com/TypeFox/monaco-languageclient)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?longCache=true)](https://github.com/TypeFox/monaco-languageclient/labels/help%20wanted)
[![monaco-languageclient](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml/badge.svg)](https://github.com/TypeFox/monaco-languageclient/actions/workflows/actions.yml)
[![NPM Version](https://img.shields.io/npm/v/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)
[![NPM Download](https://img.shields.io/npm/dt/monaco-languageclient.svg)](https://www.npmjs.com/package/monaco-languageclient)

Module to connect [Monaco editor](https://microsoft.github.io/monaco-editor/) with [language servers](https://microsoft.github.io/language-server-protocol/).

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/CHANGELOG.md).

## Getting Started

This is npm package is part of the <https://github.com/TypeFox/monaco-languageclient> mono repo. Please follow the main repositories [instructions]](<https://github.com/TypeFox/monaco-languageclient#getting-started>) to get started with local development.

## Usage

### NEW with v8: Use monaco-vscode-editor-api package instead of monaco-editor

Since version 2 (see [Important Project Changes](https://github.com/TypeFox/monaco-languageclient/blob/main/docs/versions-and-history.md#important-project-changes)) of this library we rely on [@codingame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api) to supply the VSCode API. It evolved substantially since then and thesedays allows to use many vscode only services with `monaco-editor`. With v6 and v7 we used a *treemended* version of `monaco-editor` which brought back monaco-editor code that was removed during bundling/threeshaking. This left users with the need to define overrides / resolution which was problematic.
Therefore [monaco-vscode-editor-api](https://www.npmjs.com/package/@codingame/monaco-vscode-editor-api) is now used and installed as an alias to `monaco-editor` because it provides the same api as the official monaco-editor, but no longer has the drawbacks of the *treemended* version.

### Using services and extra packages from @codingame/monaco-vscode-api

The bespoke projects not only supplies the api, but it provides 100+ packages with additional services, default extensions and language packs. By default when initalizing `monaco-languageclient` via the required `initServices` the following services are always loaded:

- *languages* and model *services* (always added by `monaco-languagclient`)
- *layout*, *environment*, *extension*, *files* and *quickAccess* (always added by `monaco-vscode-api`)

Please check the [following link](https://github.com/CodinGame/monaco-vscode-api#monaco-standalone-services) for information about all services supplied by [@codingame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api).

#### textmate and monarch

If you use the `textmate` or `theme` services you are able to load textmate based grammars and theme definitions from vscode:

```js
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
```

Once you those services you can no longer make use of monarch based grammars and themes.

## Examples

For a detailed list of examples please look at [this section](<https://github.com/TypeFox/monaco-languageclient#examples-overview>) in the main repository.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/client/LICENSE)
