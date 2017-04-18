/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as fs from "fs";
import { xhr, XHRResponse, getErrorStatusDescription } from 'request-light';
import Uri from 'vscode-uri';
import { IConnection, TextDocuments } from 'vscode-languageserver';
import {
    TextDocument, Diagnostic, CompletionList, CompletionItem, Hover,
    SymbolInformation, DocumentSymbolParams, TextEdit
} from "vscode-languageserver-types";
import { TextDocumentPositionParams, DocumentRangeFormattingParams } from 'vscode-base-languageclient/lib/protocol';
import { getLanguageService, LanguageService, JSONDocument } from "vscode-json-languageservice";

export class JsonServer {

    protected workspaceRoot: Uri | undefined;

    protected readonly documents = new TextDocuments();

    protected readonly jsonService: LanguageService = getLanguageService({
        schemaRequestService: this.resovleSchema.bind(this)
    });

    protected readonly pendingValidationRequests = new Map<string, number>();

    constructor(
        protected readonly connection: IConnection
    ) {
        this.documents.listen(this.connection);
        this.documents.onDidChangeContent(change =>
            this.validate(change.document)
        );
        this.documents.onDidClose(event => {
            this.cleanPendingValidation(event.document);
            this.cleanDiagnostics(event.document);
        });

        this.connection.onInitialize(params => {
            if (params.rootPath) {
                this.workspaceRoot = Uri.file(params.rootPath);
            } else if (params.rootUri) {
                this.workspaceRoot = Uri.parse(params.rootUri);
            }
            return {
                capabilities: {
                    textDocumentSync: this.documents.syncKind,
                    completionProvider: {
                        resolveProvider: true,
                        triggerCharacters: ['"', ':']
                    },
                    hoverProvider: true,
                    documentSymbolProvider: true,
                    documentRangeFormattingProvider: true
                }
            }
        });
        this.connection.onCompletion(params =>
            this.completion(params)
        );
        this.connection.onCompletionResolve(item =>
            this.resolveCompletion(item)
        );
        this.connection.onHover(params =>
            this.hover(params)
        )
        this.connection.onDocumentSymbol(params =>
            this.findDocumentSymbols(params)
        );
        this.connection.onDocumentRangeFormatting(params =>
            this.format(params)
        );
    }

    start() {
        this.connection.listen();
    }

    protected format(params: DocumentRangeFormattingParams): TextEdit[] {
        const document = this.documents.get(params.textDocument.uri);
        return this.jsonService.format(document, params.range, params.options)
    }

    protected findDocumentSymbols(params: DocumentSymbolParams): SymbolInformation[] {
        const document = this.documents.get(params.textDocument.uri);
        const jsonDocument = this.getJSONDocument(document);
        return this.jsonService.findDocumentSymbols(document, jsonDocument);
    }

    protected hover(params: TextDocumentPositionParams): Thenable<Hover> {
        const document = this.documents.get(params.textDocument.uri);
        const jsonDocument = this.getJSONDocument(document);
        return this.jsonService.doHover(document, params.position, jsonDocument);
    }

    protected resovleSchema(url: string): Promise<string> {
        const uri = Uri.parse(url);
        if (uri.scheme === 'file') {
            return new Promise<string>((resolve, reject) => {
                fs.readFile(uri.fsPath, 'UTF-8', (err, result) => {
                    err ? reject('') : resolve(result.toString());
                });
            });
        }
        return xhr({ url, followRedirects: 5 }).then(response => {
            return response.responseText;
        }, (error: XHRResponse) => {
            return Promise.reject(error.responseText || getErrorStatusDescription(error.status) || error.toString());
        });
    }

    protected resolveCompletion(item: CompletionItem): Thenable<CompletionItem> {
        return this.jsonService.doResolve(item);
    }

    protected completion(params: TextDocumentPositionParams): Thenable<CompletionList> {
        const document = this.documents.get(params.textDocument.uri);
        const jsonDocument = this.getJSONDocument(document);
        return this.jsonService.doComplete(document, params.position, jsonDocument);
    }

    protected validate(document: TextDocument): void {
        this.cleanPendingValidation(document);
        this.pendingValidationRequests.set(document.uri, setTimeout(() => {
            this.pendingValidationRequests.delete(document.uri);
            this.doValidate(document);
        }));
    }

    protected cleanPendingValidation(document: TextDocument): void {
        const request = this.pendingValidationRequests.get(document.uri);
        if (request !== undefined) {
            clearTimeout(request);
            this.pendingValidationRequests.delete(document.uri);
        }
    }

    protected doValidate(document: TextDocument): void {
        if (document.getText().length === 0) {
            this.cleanDiagnostics(document);
            return;
        }
        const jsonDocument = this.getJSONDocument(document);
        this.jsonService.doValidation(document, jsonDocument).then(diagnostics =>
            this.sendDiagnostics(document, diagnostics)
        );
    }

    protected cleanDiagnostics(document: TextDocument): void {
        this.sendDiagnostics(document, []);
    }

    protected sendDiagnostics(document: TextDocument, diagnostics: Diagnostic[]): void {
        this.connection.sendDiagnostics({
            uri: document.uri, diagnostics
        });
    }

    protected getJSONDocument(document: TextDocument): JSONDocument {
        return this.jsonService.parseJSONDocument(document);
    }

}
