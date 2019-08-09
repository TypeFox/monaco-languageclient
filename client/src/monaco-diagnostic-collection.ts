/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { DiagnosticCollection, Diagnostic } from './services';
import { DisposableCollection, Disposable } from './disposable';
import { ProtocolToMonacoConverter } from './monaco-converter';
import IModel = monaco.editor.IModel;
import IMarkerData = monaco.editor.IMarkerData;

export class MonacoDiagnosticCollection implements DiagnosticCollection {

    protected readonly diagnostics = new Map<string, MonacoModelDiagnostics | undefined>();
    protected readonly toDispose = new DisposableCollection();

    constructor(
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
            const modelDiagnostics = new MonacoModelDiagnostics(uri, diagnostics, this.name, this.p2m);
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
    protected _markers: IMarkerData[] = [];
    protected _diagnostics: Diagnostic[] = [];
    constructor(
        uri: string,
        diagnostics: Diagnostic[],
        readonly owner: string,
        protected readonly p2m: ProtocolToMonacoConverter
    ) {
        this.uri = monaco.Uri.parse(uri);
        this.diagnostics = diagnostics;
        monaco.editor.onDidCreateModel(model => this.doUpdateModelMarkers(model));
    }

    set diagnostics(diagnostics: Diagnostic[]) {
        this._diagnostics = diagnostics;
        this._markers = this.p2m.asDiagnostics(diagnostics);
        this.updateModelMarkers();
    }

    get diagnostics(): Diagnostic[] {
        return this._diagnostics;
    }

    get markers(): ReadonlyArray<IMarkerData> {
        return this._markers;
    }

    dispose(): void {
        this._markers = [];
        this.updateModelMarkers();
    }

    updateModelMarkers(): void {
        const model = monaco.editor.getModel(this.uri);
        this.doUpdateModelMarkers(model ? model : undefined);
    }

    protected doUpdateModelMarkers(model: IModel | undefined): void {
        if (model && this.uri.toString() === model.uri.toString()) {
            monaco.editor.setModelMarkers(model, this.owner, this._markers);
        }
    }
}
