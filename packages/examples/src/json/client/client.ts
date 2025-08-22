/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import { runExtendedClient } from '../../common/client/extendedClient.js';
import { jsontLsConfig } from './config.js';

export const runJsonWrapper = async () => {
    const helloJsonCode = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;
    await runExtendedClient(jsontLsConfig, helloJsonCode);
};
