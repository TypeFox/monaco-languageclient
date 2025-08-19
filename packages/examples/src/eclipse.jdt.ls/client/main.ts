/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this is required syntax highlighting
import '@codingame/monaco-vscode-java-default-extension';
import helloJavaCode from '../../../resources/eclipse.jdt.ls/workspace/hello.java?raw';
import { runExtendedClient } from '../../common/client/extendedClient.js';
import { eclipseJdtLsConfig } from '../config.js';

export const runEclipseJdtLsClient = async () => {
    await runExtendedClient(eclipseJdtLsConfig, helloJavaCode);
};
