/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { DefaultSharedModuleContext, EmptyFileSystem, createLangiumGrammarServices, startLanguageServer } from 'langium';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser.js';

/* browser specific setup code */
const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

// Inject the shared services and language-specific services
const context = {
    connection: createConnection(messageReader, messageWriter),
    ...EmptyFileSystem
} as unknown as DefaultSharedModuleContext;
const { shared } = createLangiumGrammarServices(context);

// Start the language server with the shared services
startLanguageServer(shared);
