/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor-core';
import { DiagnosticCollection, Diagnostic } from './services';
import { DisposableCollection, Disposable } from './disposable';
import { ProtocolToMonacoConverter } from './monaco-converter';

export class MonacoDiagnosticCollection implements DiagnosticCollection {

    protected readonly diagnostics = new Map<string, MonacoModelDiagnostics | undefined>();
    protected readonly toDispose = new DisposableCollection();

    constructor(
        protected readonly _monaco: typeof monaco,
        protected readonly name: string,
        protected readonly p2m: ProtocolToMonacoConverter) {
    }

    dispose() {
        this.toDispose.dispose();
    }

    get(uri: string): Diagnostic[] {
        const diagnostics = this.diagnostics.get(uri);
        return !!diagnostics ? diagnostics.diagnostics : [];
    }

    set(uri: string, diagnostics: Diagnostic[]): void {
        const existing = this.diagnostics.get(uri);
        if (existing) {
            existing.diagnostics = diagnostics;
        } else {
            const modelDiagnostics = new MonacoModelDiagnostics(this._monaco, uri, diagnostics, this.name, this.p2m);
            this.diagnostics.set(uri, modelDiagnostics);
            this.toDispose.push(Disposable.create(() => {
                this.diagnostics.delete(uri);
                modelDiagnostics.dispose();
            }));
        }
    }

}

export class MonacoModelDiagnostics implements Disposable {
    readonly uri: monaco.Uri;
    protected _markers: monaco.editor.IMarkerData[] = [];
    protected _diagnostics: Diagnostic[] = [];
    protected readonly toDispose = new DisposableCollection();

    constructor(
        protected readonly _monaco: typeof monaco,
        uri: string,
        diagnostics: Diagnostic[],
        readonly owner: string,
        protected readonly p2m: ProtocolToMonacoConverter
    ) {
        this.uri = this._monaco.Uri.parse(uri);
        this.diagnostics = diagnostics;
        this.toDispose.push(this._monaco.editor.onDidCreateModel(model => this.doUpdateModelMarkers(model)));
    }

    set diagnostics(diagnostics: Diagnostic[]) {
        this._diagnostics = diagnostics;
        this._markers = this.p2m.asDiagnostics(diagnostics);
        this.updateModelMarkers();
    }

    get diagnostics(): Diagnostic[] {
        return this._diagnostics;
    }

    get markers(): ReadonlyArray<monaco.editor.IMarkerData> {
        return this._markers;
    }

    dispose(): void {
        this._markers = [];
        this.updateModelMarkers();
        this.toDispose.dispose();
    }

    updateModelMarkers(): void {
        const model = this._monaco.editor.getModel(this.uri);
        this.doUpdateModelMarkers(model ? model : undefined);
    }

    protected doUpdateModelMarkers(model: monaco.editor.IModel | undefined): void {
        if (model && this.uri.toString() === model.uri.toString()) {
            this._monaco.editor.setModelMarkers(model, this.owner, this._markers);
        }
    }
}
