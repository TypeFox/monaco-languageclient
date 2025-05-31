/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this is required syntax highlighting
import '@codingame/monaco-vscode-groovy-default-extension';
import helloGroovyCode from '../../../resources/groovy/workspace/hello.groovy?raw';
import { runExtendedClient } from '../../common/client/extendedClient.js';
import { groovyConfig } from '../config.js';

export const runGroovyClient = async () => {
    await runExtendedClient(groovyConfig, helloGroovyCode);
};
