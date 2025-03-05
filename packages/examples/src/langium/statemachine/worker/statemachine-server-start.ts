/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createStatemachineServices } from '../ls/statemachine-module.js';

export let messageReader: BrowserMessageReader | undefined;
export let messageWriter: BrowserMessageWriter | undefined;

export const start = (port: MessagePort | DedicatedWorkerGlobalScope, name: string) => {
    console.log(`Starting ${name}...`);
    /* browser specific setup code */
    messageReader = new BrowserMessageReader(port);
    messageWriter = new BrowserMessageWriter(port);

    messageReader.listen((message) => {
        console.log('Received message from main thread:', message);
    });

    const connection = createConnection(messageReader, messageWriter);

    // Inject the shared services and language-specific services
    const { shared } = createStatemachineServices({ connection, ...EmptyFileSystem });

    // Start the language server with the shared services
    startLanguageServer(shared);
};
