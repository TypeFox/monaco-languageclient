/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    BaseLanguageClient, MessageTransports, LanguageClientOptions, CompletionParams, WillSaveTextDocumentParams,
} from "vscode-base-languageclient/lib/client";
import { TypeDefinitionFeature } from "vscode-base-languageclient/lib/typeDefinition";
import { ImplementationFeature } from "vscode-base-languageclient/lib/implementation";
import { ColorProviderFeature } from "vscode-base-languageclient/lib/colorProvider";
import { WorkspaceFoldersFeature } from "vscode-base-languageclient/lib/workspaceFolders";
import { FoldingRangeFeature } from "vscode-base-languageclient/lib/foldingRange";
import * as p2c from 'vscode-base-languageclient/lib/protocolConverter';
import * as c2p from 'vscode-base-languageclient/lib/codeConverter';
import { IConnectionProvider, IConnection } from './connection';

export * from 'vscode-base-languageclient/lib/client';

export class MonacoLanguageClient extends BaseLanguageClient {

    static bypassConversion = (result: any) => result || undefined;

    protected readonly connectionProvider: IConnectionProvider;

    constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClient.Options) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;
        (this as any).createConnection = this.doCreateConnection.bind(this);

        // bypass LSP <=> VS Code conversion
        const self: {
            _p2c: p2c.Converter,
            _c2p: c2p.Converter
        } = this as any;
        self._p2c = new Proxy(self._p2c, {
            get: (target: any, prop: string) => {
                if (prop === 'asUri') {
                    return target[prop];
                }
                return MonacoLanguageClient.bypassConversion;
            }
        });
        self._c2p = new Proxy(self._c2p, {
            get: (target: c2p.Converter, prop: string) => {
                if (prop === 'asUri') {
                    return target[prop];
                }
                if (prop === 'asCompletionParams') {
                    return (textDocument: any, position: any, context: any): CompletionParams => {
                        return {
                            textDocument: target.asTextDocumentIdentifier(textDocument),
                            position,
                            context
                        }
                    }
                }
                if (prop === 'asWillSaveTextDocumentParams') {
                    return (event: any): WillSaveTextDocumentParams => {
                        return {
                            textDocument: target.asTextDocumentIdentifier(event.document),
                            reason: event.reason
                        }
                    }
                }
                if (prop.endsWith('Params')) {
                    return (target as any)[prop];
                }
                return MonacoLanguageClient.bypassConversion;
            }
        });
    }

    protected doCreateConnection(): Thenable<IConnection> {
        const errorHandler = (this as any).handleConnectionError.bind(this);
        const closeHandler = this.handleConnectionClosed.bind(this);
        return this.connectionProvider.get(errorHandler, closeHandler, this.outputChannel);
    }

    protected createMessageTransports(encoding: string): Thenable<MessageTransports> {
        throw new Error('Unsupported');
    }

    protected registerBuiltinFeatures(): void {
        super.registerBuiltinFeatures();
        this.registerFeature(new TypeDefinitionFeature(this));
        this.registerFeature(new ImplementationFeature(this));
        this.registerFeature(new ColorProviderFeature(this));
        this.registerFeature(new WorkspaceFoldersFeature(this));

        const foldingRangeFeature = new FoldingRangeFeature(this);
        foldingRangeFeature['asFoldingRanges'] = MonacoLanguageClient.bypassConversion;
        this.registerFeature(foldingRangeFeature);
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
