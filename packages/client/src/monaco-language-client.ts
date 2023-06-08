/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable @typescript-eslint/dot-notation */

import { BaseLanguageClient, MessageTransports, LanguageClientOptions } from 'vscode-languageclient/lib/common/client.js';
import { ConfigurationFeature, SyncConfigurationFeature } from 'vscode-languageclient/lib/common/configuration.js';
import { DidChangeTextDocumentFeature, DidCloseTextDocumentFeature, DidOpenTextDocumentFeature, DidSaveTextDocumentFeature, WillSaveFeature, WillSaveWaitUntilFeature } from 'vscode-languageclient/lib/common/textSynchronization.js';
import { CompletionItemFeature } from 'vscode-languageclient/lib/common/completion.js';
import { HoverFeature } from 'vscode-languageclient/lib/common/hover.js';
import { SignatureHelpFeature } from 'vscode-languageclient/lib/common/signatureHelp.js';
import { DefinitionFeature } from 'vscode-languageclient/lib/common/definition.js';
import { ReferencesFeature } from 'vscode-languageclient/lib/common/reference.js';
import { DocumentHighlightFeature } from 'vscode-languageclient/lib/common/documentHighlight.js';
import { DocumentSymbolFeature } from 'vscode-languageclient/lib/common/documentSymbol.js';
import { CodeActionFeature } from 'vscode-languageclient/lib/common/codeAction.js';
import { CodeLensFeature } from 'vscode-languageclient/lib/common/codeLens.js';
import { DocumentFormattingFeature, DocumentOnTypeFormattingFeature, DocumentRangeFormattingFeature } from 'vscode-languageclient/lib/common/formatting.js';
import { RenameFeature } from 'vscode-languageclient/lib/common/rename.js';
import { DocumentLinkFeature } from 'vscode-languageclient/lib/common/documentLink.js';
import { ExecuteCommandFeature } from 'vscode-languageclient/lib/common/executeCommand.js';
import { TypeDefinitionFeature } from 'vscode-languageclient/lib/common/typeDefinition.js';
import { ImplementationFeature } from 'vscode-languageclient/lib/common/implementation.js';
import { ColorProviderFeature } from 'vscode-languageclient/lib/common/colorProvider.js';
import { WorkspaceFoldersFeature } from 'vscode-languageclient/lib/common/workspaceFolder.js';
import { FoldingRangeFeature } from 'vscode-languageclient/lib/common/foldingRange.js';
import { DeclarationFeature } from 'vscode-languageclient/lib/common/declaration.js';
import { SelectionRangeFeature } from 'vscode-languageclient/lib/common/selectionRange.js';
import { SemanticTokensFeature } from 'vscode-languageclient/lib/common/semanticTokens.js';
import { LinkedEditingFeature } from 'vscode-languageclient/lib/common/linkedEditingRange.js';
import { InlayHintsFeature } from 'vscode-languageclient/lib/common/inlayHint.js';
import { DiagnosticFeature } from 'vscode-languageclient/lib/common/diagnostic.js';
import { ProgressFeature } from 'vscode-languageclient/lib/common/progress.js';
import { RegistrationParams, UnregistrationParams } from 'vscode-languageclient';
import { TextDocument } from 'vscode';
import { WorkspaceSymbolFeature } from 'vscode-languageclient/lib/common/workspaceSymbol.js';
import { CallHierarchyFeature } from 'vscode-languageclient/lib/common/callHierarchy.js';
import { DidCreateFilesFeature, DidDeleteFilesFeature, DidRenameFilesFeature, WillCreateFilesFeature, WillDeleteFilesFeature, WillRenameFilesFeature } from 'vscode-languageclient/lib/common/fileOperations.js';
import { TypeHierarchyFeature } from 'vscode-languageclient/lib/common/typeHierarchy.js';
import { InlineValueFeature } from 'vscode-languageclient/lib/common/inlineValue.js';
import { NotebookDocumentSyncFeature } from 'vscode-languageclient/lib/common/notebook.js';

export interface IConnectionProvider {
    get(encoding: string): Promise<MessageTransports>;
}

export class MonacoLanguageClient extends BaseLanguageClient {
    protected readonly connectionProvider: IConnectionProvider;

    constructor({ id, name, clientOptions, connectionProvider }: MonacoLanguageClient.Options) {
        super(id || name.toLowerCase(), name, clientOptions);
        this.connectionProvider = connectionProvider;

        // Hack because vscode-language client rejects the whole registration block if one capability registration has no associated client feature registered
        // Some language servers still send the registration even though the client says it doesn't support it
        const originalHandleRegistrationRequest: (params: RegistrationParams) => Promise<void> = this['handleRegistrationRequest'].bind(this);
        this['handleRegistrationRequest'] = (params: RegistrationParams) => {
            originalHandleRegistrationRequest({
                ...params,
                registrations: params.registrations.filter(registration => this.getFeature(<any>registration.method) != null)
            });
        };
        const originalHandleUnregistrationRequest: (params: UnregistrationParams) => Promise<void> = this['handleUnregistrationRequest'].bind(this);
        this['handleUnregistrationRequest'] = (params: UnregistrationParams) => {
            originalHandleUnregistrationRequest({
                ...params,
                unregisterations: params.unregisterations.filter(unregistration => this.getFeature(<any>unregistration.method) != null)
            });
        };
    }

    protected createMessageTransports(encoding: string): Promise<MessageTransports> {
        return this.connectionProvider.get(encoding);
    }

    protected override getLocale(): string {
        return navigator.language || 'en-US';
    }

    protected override registerBuiltinFeatures() {
        const pendingFullTextDocumentChanges: Map<string, TextDocument> = new Map();
        this.registerFeature(new ConfigurationFeature(this));
        this.registerFeature(new DidOpenTextDocumentFeature(this, this['_syncedDocuments']));
        this['_didChangeTextDocumentFeature'] = new DidChangeTextDocumentFeature(this, pendingFullTextDocumentChanges);
        this['_didChangeTextDocumentFeature'].onPendingChangeAdded(() => {
            this['triggerPendingChangeDelivery']();
        });
        this.registerFeature(this['_didChangeTextDocumentFeature']);
        this.registerFeature(new DidCloseTextDocumentFeature(this, this['_syncedDocuments'], pendingFullTextDocumentChanges));
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
        this.registerFeature(new SyncConfigurationFeature(this));
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
        // enabled since monaco-vscode-api 1.78.5 (PR https://github.com/CodinGame/monaco-vscode-api/pull/109)
        this.registerFeature(new WillSaveFeature(this));
        this.registerFeature(new WillSaveWaitUntilFeature(this));
        this.registerFeature(new DidSaveTextDocumentFeature(this));
        // enabled since monaco-vscode-api 1.79.0 (PR https://github.com/CodinGame/monaco-vscode-api/pull/110)
        this.registerFeature(new WorkspaceSymbolFeature(this));
        this.registerFeature(new DidCreateFilesFeature(this));
        this.registerFeature(new DidRenameFilesFeature(this));
        this.registerFeature(new DidDeleteFilesFeature(this));
        this.registerFeature(new WillCreateFilesFeature(this));
        this.registerFeature(new WillRenameFilesFeature(this));
        this.registerFeature(new WillDeleteFilesFeature(this));
        this.registerFeature(new CallHierarchyFeature(this));
        this.registerFeature(new TypeHierarchyFeature(this));
        this.registerFeature(new InlineValueFeature(this));
    }

    /**
     * These are all contained in BaseLanguageClient#registerBuiltinFeatures but not registered
     * in MonacoLanguageClient. This method is not called!
     */
    public registerNotUsedFeatures() {
        // these will stay unsupported for now
        this.registerFeature(new ProgressFeature(this));
        this.registerFeature(new NotebookDocumentSyncFeature(this));
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
