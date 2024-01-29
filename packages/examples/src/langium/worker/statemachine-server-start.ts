/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EmptyFileSystem, startLanguageServer } from 'langium';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';
import { createStatemachineServices } from 'langium-statemachine-dsl/out/language-server/statemachine-module.js';

export const start = (port: MessagePort | DedicatedWorkerGlobalScope, name: string) => {
    console.log(`Starting ${name}...`);
    /* browser specific setup code */
    const messageReader = new BrowserMessageReader(port);
    const messageWriter = new BrowserMessageWriter(port);

    const connection = createConnection(messageReader, messageWriter);

    // Inject the shared services and language-specific services
    const { shared } = createStatemachineServices({ connection, ...EmptyFileSystem });

    // Start the language server with the shared services
    startLanguageServer(shared);
};
