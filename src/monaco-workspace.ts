/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from './monaco-converter';
import { Workspace, WorkspaceEdit, TextDocumentDidChangeEvent, TextDocument, Event, Emitter } from './services';
import IModel = monaco.editor.IModel;
import IIdentifiedSingleEditOperation = monaco.editor.IIdentifiedSingleEditOperation;

export class MonacoWorkspace implements Workspace {

    protected readonly documents = new Map<string, TextDocument>();
    protected readonly onDidOpenTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidCloseTextDocumentEmitter = new Emitter<TextDocument>();
    protected readonly onDidChangeTextDocumentEmitter = new Emitter<TextDocumentDidChangeEvent>();

    constructor(
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter,
        protected _rootUri: string | null = null) {
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

    public applyEdit(workspaceEdit: WorkspaceEdit): Promise<boolean> {
        const edit: monaco.languages.WorkspaceEdit = this.p2m.asWorkspaceEdit(workspaceEdit);

        // Collect all referenced models
        const models: { [uri: string]: monaco.editor.IModel } = edit.edits ? edit.edits.reduce(
            (acc: { [uri: string]: monaco.editor.IModel }, currentEdit) => {
                const textEdit = currentEdit as monaco.languages.ResourceTextEdit;
                acc[textEdit.resource.toString()] = monaco.editor.getModel(textEdit.resource) as monaco.editor.ITextModel;
                return acc;
            }, {}
        ) : {};

        // If any of the models do not exist, refuse to apply the edit.
        if (!Object.keys(models).map(uri => models[uri]).every(model => !!model)) {
            return Promise.resolve(false);
        }

        // Group edits by resource so we can batch them when applying
        const editsByResource: { [uri: string]: IIdentifiedSingleEditOperation[] } = edit.edits ? edit.edits.reduce(
            (acc: { [uri: string]: IIdentifiedSingleEditOperation[] }, currentEdit) => {
                const textEdit = currentEdit as monaco.languages.ResourceTextEdit;
                const uri = textEdit.resource.toString();
                if (!(uri in acc)) {
                    acc[uri] = [];
                }
                const operations = textEdit.edits.map(edit => {
                    return {
                        range: monaco.Range.lift(edit.range as monaco.IRange),
                        text: edit.text as string,
                    }
                });
                acc[uri].push(...operations);
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
