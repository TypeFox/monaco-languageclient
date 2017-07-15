/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoToProtocolConverter } from './converter';
import { Workspace, TextDocumentDidChangeEvent, TextDocument, Event, Emitter } from "vscode-base-languageclient/lib/services";
import IModel = monaco.editor.IModel;

export class MonacoWorkspace implements Workspace {

    protected _rootUri: string | null = null;

    protected readonly documents = new Map<string, TextDocument>();
    protected readonly onDidOpenTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidCloseTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidChangeTextDocumentEmitter = new Emitter<TextDocumentDidChangeEvent>();

    constructor(
        protected readonly m2p: MonacoToProtocolConverter) {
        for (const model of monaco.editor.getModels()) {
            this.addModel(model);
        }
        monaco.editor.onDidCreateModel(model => this.addModel(model));
        monaco.editor.onWillDisposeModel(model => this.removeModel(model));
    }

    get rootUri() {
        return this._rootUri;
    }

    protected removeModel(model: IModel): void {
        const uri = model.uri.toString();
        const document = this.documents.get(uri);
        if (document) {
            this.documents.delete(uri);
            this.onDidCloseTextDocumentEmitter.fire(document);
        }
    }

    protected addModel(model: IModel): void {
        const uri = model.uri.toString();
        const document = this.setModel(uri, model);
        this.onDidOpenTextDocumentEmitter.fire(document)
        model.onDidChangeContent(event =>
            this.onDidChangeContent(uri, model, event)
        );
    }

    protected onDidChangeContent(uri: string, model: IModel, event: monaco.editor.IModelContentChangedEvent) {
        const textDocument = this.setModel(uri, model);
        const contentChanges = [];
        for (const change of event.changes) {
            const range = this.m2p.asRange(change.range);
            const rangeLength = change.rangeLength;
            const text = change.text;
            contentChanges.push({ range, rangeLength, text });
        }
        this.onDidChangeTextDocumentEmitter.fire({
            textDocument,
            contentChanges
        });
    }

    protected setModel(uri: string, model: IModel): TextDocument {
        const document = TextDocument.create(uri, model.getModeId(), model.getVersionId(), model.getValue());
        this.documents.set(uri, document);
        return document;
    }

    get textDocuments(): TextDocument[] {
        return Array.from(this.documents.values());
    }

    get onDidOpenTextDocument(): Event<TextDocument> {
        return this.onDidOpenTextDocumentEmitter.event;
    }

    get onDidCloseTextDocument(): Event<TextDocument> {
        return this.onDidCloseTextDocumentEmitter.event;
    }

    get onDidChangeTextDocument(): Event<TextDocumentDidChangeEvent> {
        return this.onDidChangeTextDocumentEmitter.event;
    }

}
