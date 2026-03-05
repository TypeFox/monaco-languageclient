/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference lib="WebWorker" />

import { EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { createLangiumGrammarServices } from 'langium/grammar';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';

/* browser specific setup code */
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

    if (!crossOriginIsolated) {
        console.error('Cross-origin isolation required');
    }

    const connection = createConnection(messageReader, messageWriter);
    // Inject the shared services and language-specific services
    const { shared } = createLangiumGrammarServices({ connection, ...EmptyFileSystem });

    console.log('Starting langium-dsl server...');

    // Start the language server with the shared services
    startLanguageServer(shared);
};

// self.onmessage = async (event: MessageEvent) => {
//     const data = event.data;
//     console.log(event.data);
//     if (data.port !== undefined) {
//         start(data.port, 'statemachine-server-port');
//     } else {
start(self as DedicatedWorkerGlobalScope, 'langium-server');
//     }
// };
