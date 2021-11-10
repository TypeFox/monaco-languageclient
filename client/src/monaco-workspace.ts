/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor-core';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from './monaco-converter';
import { Workspace, WorkspaceEdit, TextDocumentDidChangeEvent, Event, Emitter } from './services';
import { TextDocument } from 'vscode-languageserver-textdocument'

export class MonacoWorkspace implements Workspace {

    protected readonly documents = new Map<string, TextDocument>();
    protected readonly onDidOpenTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidCloseTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidChangeTextDocumentEmitter = new Emitter<TextDocumentDidChangeEvent>();

    constructor(
        protected readonly _monaco: typeof monaco,
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter,
        protected _rootUri: string | null = null) {
        for (const model of this._monaco.editor.getModels()) {
            this.addModel(model);
        }
        this._monaco.editor.onDidCreateModel(model => this.addModel(model));
        this._monaco.editor.onWillDisposeModel(model => this.removeModel(model));
        this._monaco.editor.onDidChangeModelLanguage((event) => {
            this.removeModel(event.model);
            this.addModel(event.model);
        });
    }

    get rootUri() {
        return this._rootUri;
    }

    protected removeModel(model: monaco.editor.IModel): void {
        const uri = model.uri.toString();
        const document = this.documents.get(uri);
        if (document) {
            this.documents.delete(uri);
            this.onDidCloseTextDocumentEmitter.fire(document);
        }
    }

    protected addModel(model: monaco.editor.IModel): void {
        const uri = model.uri.toString();
        const document = this.setModel(uri, model);
        this.onDidOpenTextDocumentEmitter.fire(document)
        model.onDidChangeContent(event =>
            this.onDidChangeContent(uri, model, event)
        );
    }

    protected onDidChangeContent(uri: string, model: monaco.editor.IModel, event: monaco.editor.IModelContentChangedEvent) {
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

    protected setModel(uri: string, model: monaco.editor.IModel): TextDocument {
        const document = TextDocument.create(uri, model.getLanguageId(), model.getVersionId(), model.getValue());
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

    public applyEdit(workspaceEdit: WorkspaceEdit): Promise<boolean> {
        const edit: monaco.languages.WorkspaceEdit = this.p2m.asWorkspaceEdit(workspaceEdit);

        // Collect all referenced models
        const models: { [uri: string]: monaco.editor.IModel } = edit.edits ? edit.edits.reduce(
            (acc: { [uri: string]: monaco.editor.IModel }, currentEdit) => {
                const textEdit = currentEdit as monaco.languages.WorkspaceTextEdit;
                acc[textEdit.resource.toString()] = this._monaco.editor.getModel(textEdit.resource) as monaco.editor.ITextModel;
                return acc;
            }, {}
        ) : {};

        // If any of the models do not exist, refuse to apply the edit.
        if (!Object.keys(models).map(uri => models[uri]).every(model => !!model)) {
            return Promise.resolve(false);
        }

        // Group edits by resource so we can batch them when applying
        const editsByResource: { [uri: string]: monaco.editor.IIdentifiedSingleEditOperation[] } = edit.edits ? edit.edits.reduce(
            (acc: { [uri: string]: monaco.editor.IIdentifiedSingleEditOperation[] }, currentEdit) => {
                const textEdit = currentEdit as monaco.languages.WorkspaceTextEdit;
                const uri = textEdit.resource.toString();
                if (!(uri in acc)) {
                    acc[uri] = [];
                }
                acc[uri].push({
                    range: this._monaco.Range.lift(textEdit.edit.range as monaco.IRange),
                    text: textEdit.edit.text as string,
                });
                return acc;
            }, {}
        ) : {};

        // Apply edits for each resource
        Object.keys(editsByResource).forEach(uri => {
            models[uri].pushEditOperations(
                [],  // Do not try and preserve editor selections.
                editsByResource[uri].map(resourceEdit => {
                    return {
                        identifier: { major: 1, minor: 0 },
                        range: resourceEdit.range,
                        text: resourceEdit.text,
                        forceMoveMarkers: true,
                    };
                }),
                () => [],  // Do not try and preserve editor selections.
            );
        });
        return Promise.resolve(true);
    }

}
