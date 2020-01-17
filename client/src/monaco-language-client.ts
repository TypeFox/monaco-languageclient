/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    BaseLanguageClient, MessageTransports, LanguageClientOptions,
    CompletionParams, WillSaveTextDocumentParams, StaticFeature, DynamicFeature
} from "vscode-languageclient/lib/client";
import { TypeDefinitionFeature } from "vscode-languageclient/lib/typeDefinition";
import { ConfigurationFeature as PullConfigurationFeature } from "vscode-languageclient/lib/configuration";
import { ImplementationFeature } from "vscode-languageclient/lib/implementation";
import { ColorProviderFeature } from "vscode-languageclient/lib/colorProvider";
import { WorkspaceFoldersFeature } from "vscode-languageclient/lib/workspaceFolders";
import { FoldingRangeFeature } from "vscode-languageclient/lib/foldingRange";
import * as p2c from 'vscode-languageclient/lib/protocolConverter';
import * as c2p from 'vscode-languageclient/lib/codeConverter';
import { IConnectionProvider, IConnection } from './connection';
import { DeclarationFeature } from "vscode-languageclient/lib/declaration";

export * from 'vscode-languageclient/lib/client';

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

    protected createMessageTransports(encoding: string): Promise<MessageTransports> {
        throw new Error('Unsupported');
    }

    protected registerBuiltinFeatures(): void {
        super.registerBuiltinFeatures();
        this.registerFeature(new PullConfigurationFeature(this));
        this.registerFeature(new TypeDefinitionFeature(this));
        this.registerFeature(new ImplementationFeature(this));
        this.registerFeature(new ColorProviderFeature(this));
        this.registerFeature(new WorkspaceFoldersFeature(this));
        const foldingRangeFeature = new FoldingRangeFeature(this);
        foldingRangeFeature['asFoldingRanges'] = MonacoLanguageClient.bypassConversion;
        this.registerFeature(foldingRangeFeature);
        this.registerFeature(new DeclarationFeature(this));

        const features = this['_features'] as ((StaticFeature | DynamicFeature<any>)[]);
        for (const feature of features) {
            if (feature instanceof ColorProviderFeature) {
                feature['asColor'] = MonacoLanguageClient.bypassConversion;
                feature['asColorInformations'] = MonacoLanguageClient.bypassConversion;
                feature['asColorPresentations'] = MonacoLanguageClient.bypassConversion;
            }
        }
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
