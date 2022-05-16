/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    BaseLanguageClient, MessageTransports, LanguageClientOptions
} from "vscode-languageclient";
import { TypeDefinitionFeature } from "vscode-languageclient/lib/common/typeDefinition";
import { ConfigurationFeature as PullConfigurationFeature } from "vscode-languageclient/lib/common/configuration";
import { ImplementationFeature } from "vscode-languageclient/lib/common/implementation";
import { ColorProviderFeature } from "vscode-languageclient/lib/common/colorProvider";
import { WorkspaceFoldersFeature } from "vscode-languageclient/lib/common/workspaceFolder";
import { FoldingRangeFeature } from "vscode-languageclient/lib/common/foldingRange";
import { CallHierarchyFeature } from "vscode-languageclient/lib/common/callHierarchy";
import { ProgressFeature } from "vscode-languageclient/lib/common/progress";
import { SemanticTokensFeature } from "vscode-languageclient/lib/common/semanticTokens";
import * as p2c from 'vscode-languageclient/lib/common/protocolConverter';
import * as c2p from 'vscode-languageclient/lib/common/codeConverter';
import { IConnectionProvider } from './connection';
import { DeclarationFeature } from "vscode-languageclient/lib/common/declaration";
import { CompletionParams, WillSaveTextDocumentParams } from './services'

export * from 'vscode-languageclient/lib/common/client';

export class MonacoLanguageClient extends BaseLanguageClient {

    static bypassConversion = (result: any) => result || undefined;

    protected readonly connectionProvider: IConnectionProvider;

    constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClient.Options) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;

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

    protected createMessageTransports(encoding: string): Promise<MessageTransports> {
        return this.connectionProvider.get(encoding);
    }

    protected registerBuiltinFeatures(): void {
        super.registerBuiltinFeatures();
        this.registerFeature(new PullConfigurationFeature(this));
        this.registerFeature(new TypeDefinitionFeature(this));
        this.registerFeature(new ImplementationFeature(this));
        this.registerFeature(new ColorProviderFeature(this));
        this.registerFeature(new WorkspaceFoldersFeature(this));
        this.registerFeature(new FoldingRangeFeature(this));
        this.registerFeature(new DeclarationFeature(this));
        this.registerFeature(new SemanticTokensFeature(this));
        this.registerFeature(new CallHierarchyFeature(this));
        this.registerFeature(new ProgressFeature(this));
    }

    public registerProposedFeatures() {
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
