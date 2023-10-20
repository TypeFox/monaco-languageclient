/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BaseLanguageClient, MessageTransports, LanguageClientOptions } from 'vscode-languageclient/lib/common/client.js';

export interface IConnectionProvider {
    get(encoding: string): Promise<MessageTransports>;
}

export type MonacoLanguageClientOptions = {
    name: string;
    id?: string;
    clientOptions: LanguageClientOptions;
    connectionProvider: IConnectionProvider;
}

export class MonacoLanguageClient extends BaseLanguageClient {
    protected readonly connectionProvider: IConnectionProvider;

    constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClientOptions) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;
    }

    protected override createMessageTransports(encoding: string): Promise<MessageTransports> {
        return this.connectionProvider.get(encoding);
    }
}
