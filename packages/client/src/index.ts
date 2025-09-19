/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BaseLanguageClient, MessageTransports, ProposedFeatures, type LanguageClientOptions } from 'vscode-languageclient/browser.js';

export type MonacoLanguageClientOptions = {
    name: string;
    id?: string;
    clientOptions: LanguageClientOptions;
    messageTransports: MessageTransports;
}

export class MonacoLanguageClient extends BaseLanguageClient {
    protected readonly messageTransports: MessageTransports;

    constructor({ id, name, clientOptions, messageTransports }: MonacoLanguageClientOptions) {
        super(id ?? name.toLowerCase(), name, clientOptions);
        this.messageTransports = messageTransports;
    }

    protected override createMessageTransports(_encoding: string): Promise<MessageTransports> {
        return Promise.resolve(this.messageTransports);
    }
}

export class MonacoLanguageClientWithProposedFeatures extends MonacoLanguageClient {
    constructor({ id, name, clientOptions, messageTransports }: MonacoLanguageClientOptions) {
        super({ id, name, clientOptions, messageTransports });
        ProposedFeatures.createAll(this);
    }
}
