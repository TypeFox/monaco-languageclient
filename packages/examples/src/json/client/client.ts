/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import helloJsonCode from '../../../resources/json/workspace/hello.json?raw';
import { runExtendedClient } from '../../common/client/extendedClient.js';
import { jsontLsConfig } from './config.js';

export const runJsonWrapper = async () => {
    await runExtendedClient(jsontLsConfig, helloJsonCode);
};
