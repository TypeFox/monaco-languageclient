/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    BaseLanguageClient, MessageTransports, LanguageClientOptions, CloseAction, ErrorAction
} from 'vscode-languageclient/lib/common/client';
import type * as vscode from 'vscode';
import { ConfigurationFeature, SyncConfigurationFeature } from 'vscode-languageclient/lib/common/configuration';
import { DidChangeTextDocumentFeature, DidCloseTextDocumentFeature, DidOpenTextDocumentFeature, DidSaveTextDocumentFeature, WillSaveFeature, WillSaveWaitUntilFeature } from 'vscode-languageclient/lib/common/textSynchronization';
import { CompletionItemFeature } from 'vscode-languageclient/lib/common/completion';
import { HoverFeature } from 'vscode-languageclient/lib/common/hover';
import { SignatureHelpFeature } from 'vscode-languageclient/lib/common/signatureHelp';
import { DefinitionFeature } from 'vscode-languageclient/lib/common/definition';
import { ReferencesFeature } from 'vscode-languageclient/lib/common/reference';
import { DocumentHighlightFeature } from 'vscode-languageclient/lib/common/documentHighlight';
import { DocumentSymbolFeature } from 'vscode-languageclient/lib/common/documentSymbol';
import { CodeActionFeature } from 'vscode-languageclient/lib/common/codeAction';
import { CodeLensFeature } from 'vscode-languageclient/lib/common/codeLens';
import { DocumentFormattingFeature, DocumentOnTypeFormattingFeature, DocumentRangeFormattingFeature } from 'vscode-languageclient/lib/common/formatting';
import { RenameFeature } from 'vscode-languageclient/lib/common/rename';
import { DocumentLinkFeature } from 'vscode-languageclient/lib/common/documentLink';
import { ExecuteCommandFeature } from 'vscode-languageclient/lib/common/executeCommand';
import { TypeDefinitionFeature } from 'vscode-languageclient/lib/common/typeDefinition';
import { ImplementationFeature } from 'vscode-languageclient/lib/common/implementation';
import { ColorProviderFeature } from 'vscode-languageclient/lib/common/colorProvider';
import { WorkspaceFoldersFeature } from 'vscode-languageclient/lib/common/workspaceFolder';
import { FoldingRangeFeature } from 'vscode-languageclient/lib/common/foldingRange';
import { DeclarationFeature } from 'vscode-languageclient/lib/common/declaration';
import { SelectionRangeFeature } from 'vscode-languageclient/lib/common/selectionRange';
import { SemanticTokensFeature } from 'vscode-languageclient/lib/common/semanticTokens';
import { LinkedEditingFeature } from 'vscode-languageclient/lib/common/linkedEditingRange';
import { InlayHintsFeature } from 'vscode-languageclient/lib/common/inlayHint';
import { DiagnosticFeature } from 'vscode-languageclient/lib/common/diagnostic';
import { ProgressFeature } from 'vscode-languageclient/lib/common/progress';
import { RegistrationParams, UnregistrationParams } from 'vscode-languageclient';

export * from 'vscode-languageclient/lib/common/client';

export interface IConnectionProvider {
    get(encoding: string): Promise<MessageTransports>;
}
export class MonacoLanguageClient extends BaseLanguageClient {
    static bypassConversion = (result: any, token?: vscode.CancellationToken) => token != null ? Promise.resolve(result || undefined) : (result || undefined);

    protected readonly connectionProvider: IConnectionProvider;

    constructor ({ id, name, clientOptions, connectionProvider }: MonacoLanguageClient.Options) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;

        // Hack because vscode-language client rejects the whole registration block if one capability registration has no associated client feature registered
        // Some language servers still send the registration even though the client says it doesn't support it
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const originalHandleRegistrationRequest: (params: RegistrationParams) => Promise<void> = this['handleRegistrationRequest'].bind(this);
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this['handleRegistrationRequest'] = (params: RegistrationParams) => {
            originalHandleRegistrationRequest({
                ...params,
                registrations: params.registrations.filter(registration => this.getFeature(<any>registration.method) != null)
            });
        };
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const originalHandleUnregistrationRequest: (params: UnregistrationParams) => Promise<void> = this['handleUnregistrationRequest'].bind(this);
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this['handleUnregistrationRequest'] = (params: UnregistrationParams) => {
            originalHandleUnregistrationRequest({
                ...params,
                unregisterations: params.unregisterations.filter(unregistration => this.getFeature(<any>unregistration.method) != null)
            });
        };
    }

    protected createMessageTransports (encoding: string): Promise<MessageTransports> {
        return this.connectionProvider.get(encoding);
    }

    protected getLocale (): string {
        return navigator.language || 'en-US';
    }

    protected override registerBuiltinFeatures () {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this.registerFeature(new DidOpenTextDocumentFeature(this, this['_syncedDocuments']));
        this.registerFeature(new DidChangeTextDocumentFeature(this));
        // eslint-disable-next-line @typescript-eslint/dot-notation
        this.registerFeature(new DidCloseTextDocumentFeature(this, this['_syncedDocuments']));
        this.registerFeature(new CompletionItemFeature(this));
        this.registerFeature(new HoverFeature(this));
        this.registerFeature(new SignatureHelpFeature(this));
        this.registerFeature(new DefinitionFeature(this));
        this.registerFeature(new ReferencesFeature(this));
        this.registerFeature(new DocumentHighlightFeature(this));
        this.registerFeature(new DocumentSymbolFeature(this));
        this.registerFeature(new CodeActionFeature(this));
        this.registerFeature(new CodeLensFeature(this));
        this.registerFeature(new DocumentFormattingFeature(this));
        this.registerFeature(new DocumentRangeFormattingFeature(this));
        this.registerFeature(new DocumentOnTypeFormattingFeature(this));
        this.registerFeature(new RenameFeature(this));
        this.registerFeature(new DocumentLinkFeature(this));
        this.registerFeature(new ExecuteCommandFeature(this));
        this.registerFeature(new TypeDefinitionFeature(this));
        this.registerFeature(new ImplementationFeature(this));
        this.registerFeature(new ColorProviderFeature(this));
        // We only register the workspace folder feature if the client is not locked
        // to a specific workspace folder.
        if (this.clientOptions.workspaceFolder === undefined) {
            this.registerFeature(new WorkspaceFoldersFeature(this));
        }
        this.registerFeature(new FoldingRangeFeature(this));
        this.registerFeature(new DeclarationFeature(this));
        this.registerFeature(new SelectionRangeFeature(this));
        this.registerFeature(new SemanticTokensFeature(this));
        this.registerFeature(new LinkedEditingFeature(this));
        this.registerFeature(new InlayHintsFeature(this));
        this.registerFeature(new DiagnosticFeature(this));
    }

    public registerTextDocumentSaveFeatures () {
        this.registerFeature(new WillSaveFeature(this));
        this.registerFeature(new WillSaveWaitUntilFeature(this));
        this.registerFeature(new DidSaveTextDocumentFeature(this));
    }

    public registerConfigurationFeatures () {
        this.registerFeature(new ConfigurationFeature(this));
        this.registerFeature(new SyncConfigurationFeature(this));
    }

    public registerProgressFeatures () {
        this.registerFeature(new ProgressFeature(this));
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

export { CloseAction, ErrorAction };
