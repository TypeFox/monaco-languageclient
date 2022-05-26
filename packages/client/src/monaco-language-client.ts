/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    BaseLanguageClient, MessageTransports, LanguageClientOptions
} from "vscode-languageclient/lib/common/client";
import * as p2c from 'vscode-languageclient/lib/common/protocolConverter';
import * as c2p from 'vscode-languageclient/lib/common/codeConverter';
import { IConnectionProvider } from './connection';

export * from 'vscode-languageclient/lib/common/client';
import type * as vscode from 'vscode'
import { MonacoC2PConverter, MonacoP2CConverter } from "./converters";

export class MonacoLanguageClient extends BaseLanguageClient {

    static bypassConversion = (result: any, token?: vscode.CancellationToken) => token != null ? Promise.resolve(result || undefined) : (result || undefined);

    protected readonly connectionProvider: IConnectionProvider;

    constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClient.Options) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;

        // bypass LSP <=> VS Code conversion
        const self: {
            _p2c: p2c.Converter,
            _c2p: c2p.Converter
        } = this as any;
        self._p2c = new MonacoP2CConverter(self._p2c);
        self._c2p = new MonacoC2PConverter(self._c2p);
    }

    protected createMessageTransports(encoding: string): Promise<MessageTransports> {
        return this.connectionProvider.get(encoding);
    }

    protected getLocale(): string {
        return navigator.language || 'en-US'
    }
}
export namespace MonacoLanguageClient {
    export interface Options {
        name: string;
        id?: string;
        clientOptions: LanguageClientOptions;
        connectionProvider: IConnectionProvider;
    }
}
