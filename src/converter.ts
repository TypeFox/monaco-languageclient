/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as is from 'vscode-base-languageclient/lib/utils/is';
import {
    CodeActionParams, CodeLensParams,
    DocumentFormattingParams, DocumentOnTypeFormattingParams,
    DocumentRangeFormattingParams, ReferenceParams,
    RenameParams, TextDocumentPositionParams,
    Position, TextDocumentIdentifier, CompletionItem, CompletionList,
    InsertTextFormat, Range, Diagnostic, CompletionItemKind,
    Hover, SignatureHelp, SignatureInformation, ParameterInformation,
    Definition, Location, DocumentHighlight, DocumentHighlightKind,
    SymbolInformation, DocumentSymbolParams, CodeActionContext, DiagnosticSeverity,
    Command, CodeLens, FormattingOptions, TextEdit, WorkspaceEdit
} from 'vscode-base-languageclient/lib/base';
import IReadOnlyModel = monaco.editor.IReadOnlyModel;

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ProtocolCodeLens extends monaco.languages.ICodeLensSymbol {
    data?: any;
}

export namespace ProtocolCodeLens {
    export function is(item: any): item is ProtocolCodeLens {
        return !!item && 'data' in item;
    }
}

export interface ProtocolCompletionItem extends monaco.languages.CompletionItem {
    data?: any;
    fromEdit?: boolean;
}

export namespace ProtocolCompletionItem {
    export function is(item: any): item is ProtocolCompletionItem {
        return !!item && 'data' in item;
    }
}

export class MonacoToProtocolConverter {
    asPosition(lineNumber: undefined | null, column: undefined | null): {};
    asPosition(lineNumber: number, column: undefined | null): Pick<Position, 'line'>;
    asPosition(lineNumber: undefined | null, column: number): Pick<Position, 'character'>;
    asPosition(lineNumber: number, column: number): Position;
    asPosition(lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position>;
    asPosition(lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position> {
        const line = lineNumber === undefined || lineNumber === null ? undefined : lineNumber - 1;
        const character = column === undefined || column === null ? undefined : column - 1;
        return {
            line, character
        };
    }

    asRange(range: null): null;
    asRange(range: undefined): undefined;
    asRange(range: monaco.IRange): Range;
    asRange(range: monaco.IRange | undefined): Range | undefined;
    asRange(range: monaco.IRange | null): Range | null;
    asRange(range: Partial<monaco.IRange>): RecursivePartial<Range>;
    asRange(range: Partial<monaco.IRange> | undefined): RecursivePartial<Range> | undefined;
    asRange(range: Partial<monaco.IRange> | null): RecursivePartial<Range> | null;
    asRange(range: Partial<monaco.IRange> | undefined | null): RecursivePartial<Range> | undefined | null {
        if (range === undefined) {
            return undefined;
        }
        if (range === null) {
            return null;
        }
        const start = this.asPosition(range.startLineNumber, range.startColumn);
        const end = this.asPosition(range.endLineNumber, range.endColumn);
        return {
            start, end
        };
    }

    asTextDocumentIdentifier(model: IReadOnlyModel): TextDocumentIdentifier {
        return {
            uri: model.uri.toString()
        }
    }

    asTextDocumentPositionParams(model: IReadOnlyModel, position: monaco.Position): TextDocumentPositionParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column)
        };
    }

    asCompletionItem(item: monaco.languages.CompletionItem): CompletionItem {
        const result: CompletionItem = { label: item.label };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) { result.documentation = item.documentation; }
        if (item.filterText) { result.filterText = item.filterText; }
        this.fillPrimaryInsertText(result, item as ProtocolCompletionItem);
        // Protocol item kind is 1 based, codes item kind is zero based.
        if (is.number(item.kind)) {
            if (monaco.languages.CompletionItemKind.Text <= item.kind && item.kind <= monaco.languages.CompletionItemKind.Reference) {
                result.kind = (item.kind + 1) as CompletionItemKind;
            } else {
                result.kind = CompletionItemKind.Text;
            }
        }
        if (item.sortText) { result.sortText = item.sortText; }
        // TODO: if (item.additionalTextEdits) { result.additionalTextEdits = asTextEdits(item.additionalTextEdits); }
        // TODO: if (item.command) { result.command = asCommand(item.command); }
        if (ProtocolCompletionItem.is(item)) {
            result.data = item.data;
        }
        return result;
    }

    protected fillPrimaryInsertText(target: CompletionItem, source: ProtocolCompletionItem): void {
        let format: InsertTextFormat = InsertTextFormat.PlainText;
        let text: string | undefined;
        let range: Range | undefined;
        if (source.textEdit) {
            text = source.textEdit.text;
            range = this.asRange(source.textEdit.range);
        } else if (typeof source.insertText === 'string') {
            text = source.insertText;
        } else if (source.insertText) {
            format = InsertTextFormat.Snippet;
            text = source.insertText.value;
        }
        if (source.range) {
            range = this.asRange(source.range);
        }

        target.insertTextFormat = format;
        if (source.fromEdit && text && range) {
            target.textEdit = { newText: text, range: range };
        } else {
            target.insertText = text;
        }
    }

    asReferenceParams(model: IReadOnlyModel, position: monaco.Position, options: { includeDeclaration: boolean; }): ReferenceParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            context: { includeDeclaration: options.includeDeclaration }
        };
    }

    asDocumentSymbolParams(model: IReadOnlyModel): DocumentSymbolParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        }
    }

    asCodeLensParams(model: IReadOnlyModel): CodeLensParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        }
    }

    asDiagnosticSeverity(value: monaco.Severity): DiagnosticSeverity | undefined {
        switch (value) {
            case monaco.Severity.Error:
                return DiagnosticSeverity.Error;
            case monaco.Severity.Warning:
                return DiagnosticSeverity.Warning;
            case monaco.Severity.Info:
                return DiagnosticSeverity.Information;
        }
        return undefined;
    }

    asDiagnostic(marker: monaco.editor.IMarkerData): Diagnostic {
        const range = this.asRange(new monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn))
        const severity = this.asDiagnosticSeverity(marker.severity);
        return Diagnostic.create(range, marker.message, severity, marker.code, marker.source);
    }

    asDiagnostics(markers: monaco.editor.IMarkerData[]): Diagnostic[] {
        if (markers === void 0 || markers === null) {
            return markers;
        }
        return markers.map(marker => this.asDiagnostic(marker));
    }

    asCodeActionContext(context: monaco.languages.CodeActionContext): CodeActionContext {
        if (context === void 0 || context === null) {
            return context;
        }
        const diagnostics = this.asDiagnostics(context.markers);
        return {
            diagnostics
        }
    }

    asCodeActionParams(model: IReadOnlyModel, range: monaco.Range, context: monaco.languages.CodeActionContext): CodeActionParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            range: this.asRange(range),
            context: this.asCodeActionContext(context)
        }
    }

    asCommand(item: monaco.languages.Command | undefined | null): Command | undefined {
        if (item) {
            let args = item.arguments || [];
            return Command.create(item.title, item.id, ...args);
        }
        return undefined;
    }

    asCodeLens(item: monaco.languages.ICodeLensSymbol): CodeLens {
        const range = this.asRange(item.range);
        const data = ProtocolCodeLens.is(item) ? item.data : undefined;
        const command = this.asCommand(item.command);
        return {
            range, data, command
        }
    }

    asFormattingOptions(options: monaco.languages.FormattingOptions): FormattingOptions {
        return { tabSize: options.tabSize, insertSpaces: options.insertSpaces };
    }

    asDocumentFormattingParams(model: IReadOnlyModel, options: monaco.languages.FormattingOptions): DocumentFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            options: this.asFormattingOptions(options)
        }
    }

    asDocumentRangeFormattingParams(model: IReadOnlyModel, range: monaco.Range, options: monaco.languages.FormattingOptions): DocumentRangeFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            range: this.asRange(range),
            options: this.asFormattingOptions(options)
        }
    }

    asDocumentOnTypeFormattingParams(model: IReadOnlyModel, position: monaco.IPosition, ch: string, options: monaco.languages.FormattingOptions): DocumentOnTypeFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            ch,
            options: this.asFormattingOptions(options)
        }
    }

    asRenameParams(model: IReadOnlyModel, position: monaco.IPosition, newName: string): RenameParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            newName
        }
    }
}

export class ProtocolToMonacoConverter {

    asResourceEdits(resource: monaco.Uri, edits: TextEdit[]): monaco.languages.IResourceEdit[] {
        return edits.map(edit => {
            const range = this.asRange(edit.range)!;
            return {
                resource,
                range,
                newText: edit.newText
            }
        })
    }

    asWorkspaceEdit(item: WorkspaceEdit): monaco.languages.WorkspaceEdit;
    asWorkspaceEdit(item: undefined | null): undefined;
    asWorkspaceEdit(item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined;
    asWorkspaceEdit(item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined {
        if (!item) {
            return undefined;
        }
        const edits: monaco.languages.IResourceEdit[] = [];
        if (item.documentChanges) {
            for (const change of item.documentChanges) {
                const resource = monaco.Uri.parse(change.textDocument.uri);
                edits.push(...this.asResourceEdits(resource, change.edits));
            }
        } else if (item.changes) {
            for (const key of Object.keys(item.changes)) {
                const resource = monaco.Uri.parse(key);
                edits.push(...this.asResourceEdits(resource, item.changes[key]));
            }
        }
        return {
            edits
        };
    }

    asTextEdit(edit: TextEdit): monaco.editor.ISingleEditOperation {
        const range = this.asRange(edit.range)!;
        return {
            range,
            text: edit.newText
        }
    }

    asTextEdits(items: TextEdit[]): monaco.editor.ISingleEditOperation[];
    asTextEdits(items: undefined | null): undefined;
    asTextEdits(items: TextEdit[] | undefined | null): monaco.editor.ISingleEditOperation[] | undefined;
    asTextEdits(items: TextEdit[] | undefined | null): monaco.editor.ISingleEditOperation[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map(item => this.asTextEdit(item));
    }

    asCodeLens(item: CodeLens): monaco.languages.ICodeLensSymbol;
    asCodeLens(item: undefined | null): undefined;
    asCodeLens(item: CodeLens | undefined | null): monaco.languages.ICodeLensSymbol | undefined;
    asCodeLens(item: CodeLens | undefined | null): monaco.languages.ICodeLensSymbol | undefined {
        if (!item) {
            return undefined;
        }
        const range = this.asRange(item.range);
        let result = <ProtocolCodeLens>{ range };
        if (item.command) { result.command = this.asCommand(item.command); }
        if (item.data !== void 0 && item.data !== null) { result.data = item.data; }
        return result;
    }

    asCodeLenses(items: CodeLens[]): monaco.languages.ICodeLensSymbol[];
    asCodeLenses(items: undefined | null): undefined;
    asCodeLenses(items: CodeLens[] | undefined | null): monaco.languages.ICodeLensSymbol[] | undefined;
    asCodeLenses(items: CodeLens[] | undefined | null): monaco.languages.ICodeLensSymbol[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map((codeLens) => this.asCodeLens(codeLens));
    }


    asCodeActions(commands: Command[]): monaco.languages.CodeAction[] {
        return this.asCommands(commands).map((command, score) => ({ command, score }));
    }

    asCommand(command: Command): monaco.languages.Command {
        return {
            id: command.command,
            title: command.title,
            arguments: command.arguments
        };
    }

    asCommands(commands: Command[]): monaco.languages.Command[] {
        return commands.map(command => this.asCommand(command));
    }

    asSymbolInformations(values: SymbolInformation[], uri?: monaco.Uri): monaco.languages.SymbolInformation[];
    asSymbolInformations(values: undefined | null, uri?: monaco.Uri): undefined;
    asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.SymbolInformation[] | undefined;
    asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.SymbolInformation[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(information => this.asSymbolInformation(information, uri));
    }

    asSymbolInformation(item: SymbolInformation, uri?: monaco.Uri): monaco.languages.SymbolInformation {
        // Symbol kind is one based in the protocol and zero based in code.
        return {
            name: item.name,
            containerName: item.containerName,
            kind: item.kind - 1,
            location: this.asLocation(uri ? { ...item.location, uri: uri.toString() } : item.location)
        };
    }

    asDocumentHighlights(values: DocumentHighlight[]): monaco.languages.DocumentHighlight[];
    asDocumentHighlights(values: undefined | null): undefined;
    asDocumentHighlights(values: DocumentHighlight[] | undefined | null): monaco.languages.DocumentHighlight[] | undefined;
    asDocumentHighlights(values: DocumentHighlight[] | undefined | null): monaco.languages.DocumentHighlight[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(item => this.asDocumentHighlight(item));
    }

    asDocumentHighlight(item: DocumentHighlight): monaco.languages.DocumentHighlight {
        const range = this.asRange(item.range)!;
        const kind = is.number(item.kind) ? this.asDocumentHighlightKind(item.kind) : undefined!;
        return { range, kind };
    }

    asDocumentHighlightKind(item: number): monaco.languages.DocumentHighlightKind {
        switch (item) {
            case DocumentHighlightKind.Text:
                return monaco.languages.DocumentHighlightKind.Text;
            case DocumentHighlightKind.Read:
                return monaco.languages.DocumentHighlightKind.Read;
            case DocumentHighlightKind.Write:
                return monaco.languages.DocumentHighlightKind.Write;
        }
        return monaco.languages.DocumentHighlightKind.Text;
    }

    asReferences(values: Location[]): monaco.languages.Location[];
    asReferences(values: undefined | null): monaco.languages.Location[] | undefined;
    asReferences(values: Location[] | undefined | null): monaco.languages.Location[] | undefined;
    asReferences(values: Location[] | undefined | null): monaco.languages.Location[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(location => this.asLocation(location));
    }

    asDefinitionResult(item: Definition): monaco.languages.Definition;
    asDefinitionResult(item: undefined | null): undefined;
    asDefinitionResult(item: Definition | undefined | null): monaco.languages.Definition | undefined;
    asDefinitionResult(item: Definition | undefined | null): monaco.languages.Definition | undefined {
        if (!item) {
            return undefined;
        }
        if (is.array(item)) {
            return item.map((location) => this.asLocation(location));
        } else {
            return this.asLocation(item);
        }
    }

    asLocation(item: Location): monaco.languages.Location;
    asLocation(item: undefined | null): undefined;
    asLocation(item: Location | undefined | null): monaco.languages.Location | undefined;
    asLocation(item: Location | undefined | null): monaco.languages.Location | undefined {
        if (!item) {
            return undefined;
        }
        const uri = monaco.Uri.parse(item.uri);
        const range = this.asRange(item.range)!;
        return {
            uri, range
        }
    }

    asSignatureHelp(item: undefined | null): undefined;
    asSignatureHelp(item: SignatureHelp): monaco.languages.SignatureHelp;
    asSignatureHelp(item: SignatureHelp | undefined | null): monaco.languages.SignatureHelp | undefined;
    asSignatureHelp(item: SignatureHelp | undefined | null): monaco.languages.SignatureHelp | undefined {
        if (!item) {
            return undefined;
        }
        let result = <monaco.languages.SignatureHelp>{};
        if (is.number(item.activeSignature)) {
            result.activeSignature = item.activeSignature;
        } else {
            // activeSignature was optional in the past
            result.activeSignature = 0;
        }
        if (is.number(item.activeParameter)) {
            result.activeParameter = item.activeParameter;
        } else {
            // activeParameter was optional in the past
            result.activeParameter = 0;
        }
        if (item.signatures) { result.signatures = this.asSignatureInformations(item.signatures); }
        return result;
    }

    asSignatureInformations(items: SignatureInformation[]): monaco.languages.SignatureInformation[] {
        return items.map(item => this.asSignatureInformation(item));
    }

    asSignatureInformation(item: SignatureInformation): monaco.languages.SignatureInformation {
        let result = <monaco.languages.SignatureInformation>{ label: item.label };
        if (item.documentation) { result.documentation = item.documentation; }
        if (item.parameters) { result.parameters = this.asParameterInformations(item.parameters); }
        return result;
    }

    asParameterInformations(item: ParameterInformation[]): monaco.languages.ParameterInformation[] {
        return item.map(item => this.asParameterInformation(item));
    }

    asParameterInformation(item: ParameterInformation): monaco.languages.ParameterInformation {
        let result = <monaco.languages.ParameterInformation>{ label: item.label };
        if (item.documentation) { result.documentation = item.documentation };
        return result;
    }

    asHover(hover: Hover): monaco.languages.Hover;
    asHover(hover: undefined | null): undefined;
    asHover(hover: Hover | undefined | null): monaco.languages.Hover | undefined;
    asHover(hover: Hover | undefined | null): monaco.languages.Hover | undefined {
        if (!hover) {
            return undefined;
        }
        const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
        const range = this.asRange(hover.range)!;
        return {
            contents, range
        }
    }

    asSeverity(severity?: number): monaco.Severity {
        if (severity === 1) {
            return monaco.Severity.Error;
        }
        if (severity === 2) {
            return monaco.Severity.Warning;
        }
        if (severity === 3) {
            return monaco.Severity.Info;
        }
        return monaco.Severity.Ignore;
    }

    asMarker(diagnostic: Diagnostic): monaco.editor.IMarkerData {
        return {
            code: typeof diagnostic.code === "number" ? diagnostic.code.toString() : diagnostic.code,
            severity: this.asSeverity(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source,
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1
        }
    }

    asCompletionResult(result: CompletionItem[] | CompletionList | undefined): monaco.languages.CompletionItem[] | monaco.languages.CompletionList | undefined {
        if (!result) {
            return undefined;
        }
        if (Array.isArray(result)) {
            return result.map(item => this.asCompletionItem(item));
        }
        return <monaco.languages.CompletionList>{
            isIncomplete: result.isIncomplete,
            items: result.items.map(this.asCompletionItem.bind(this))
        }
    }

    asCompletionItem(item: CompletionItem): ProtocolCompletionItem {
        const result = <ProtocolCompletionItem>{ label: item.label };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) { result.documentation = item.documentation };
        if (item.filterText) { result.filterText = item.filterText; }
        let insertText = this.asCompletionInsertText(item);
        if (insertText) {
            result.insertText = insertText.text;
            result.range = insertText.range;
            result.fromEdit = insertText.fromEdit;
        }
        // Protocol item kind is 1 based, codes item kind is zero based.
        if (is.number(item.kind) && item.kind > 0) { result.kind = item.kind - 1; }
        if (item.sortText) { result.sortText = item.sortText; }
        // TODO: if (item.additionalTextEdits) { result.additionalTextEdits = asTextEdits(item.additionalTextEdits); }
        // TODO: if (item.command) { result.command = asCommand(item.command); }
        if (item.data !== void 0 && item.data !== null) { result.data = item.data; }
        return result;
    }

    asCompletionInsertText(item: CompletionItem): { text: string | monaco.languages.SnippetString, range?: monaco.Range, fromEdit: boolean } | undefined {
        if (item.textEdit) {
            const range = this.asRange(item.textEdit.range)!;
            const value = item.textEdit.newText;
            const text = item.insertTextFormat === InsertTextFormat.Snippet ? { value } : value;
            return {
                text, range, fromEdit: true
            };
        }
        if (item.insertText) {
            const value = item.insertText;
            const text = item.insertTextFormat === InsertTextFormat.Snippet ? { value } : value;
            return { text, fromEdit: false };
        }
        return undefined;
    }

    asRange(range: null): null;
    asRange(range: undefined): undefined;
    asRange(range: Range): monaco.Range;
    asRange(range: Range | undefined): monaco.Range | undefined;
    asRange(range: Range | null): monaco.Range | null;
    asRange(range: RecursivePartial<Range>): Partial<monaco.IRange>;
    asRange(range: RecursivePartial<Range> | undefined): monaco.Range | Partial<monaco.IRange> | undefined;
    asRange(range: RecursivePartial<Range> | null): monaco.Range | Partial<monaco.IRange> | null;
    asRange(range: RecursivePartial<Range> | undefined | null): monaco.Range | Partial<monaco.IRange> | undefined | null {
        if (range === undefined) {
            return undefined;
        }
        if (range === null) {
            return null;
        }
        const start = this.asPosition(range.start);
        const end = this.asPosition(range.end);
        if (start instanceof monaco.Position && end instanceof monaco.Position) {
            return new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        const startLineNumber = !start || start.lineNumber === undefined ? undefined : start.lineNumber;
        const startColumn = !start || start.column === undefined ? undefined : start.column;
        const endLineNumber = !end || end.lineNumber === undefined ? undefined : end.lineNumber;
        const endColumn = !end || end.column === undefined ? undefined : end.column;
        return { startLineNumber, startColumn, endLineNumber, endColumn };
    }

    asPosition(position: null): null;
    asPosition(position: undefined): undefined;
    asPosition(position: Position): monaco.Position;
    asPosition(position: Position | undefined): monaco.Position | undefined;
    asPosition(position: Position | null): monaco.Position | null;
    asPosition(position: Partial<Position>): Partial<monaco.IPosition>;
    asPosition(position: Partial<Position> | undefined): monaco.Position | Partial<monaco.IPosition> | undefined;
    asPosition(position: Partial<Position> | null): monaco.Position | Partial<monaco.IPosition> | null;
    asPosition(position: Partial<Position> | undefined | null): monaco.Position | Partial<monaco.IPosition> | undefined | null {
        if (position === undefined) {
            return undefined;
        }
        if (position === null) {
            return null;
        }
        const { line, character } = position;
        const lineNumber = line === undefined ? undefined : line + 1;
        const column = character === undefined ? undefined : character + 1;
        if (lineNumber !== undefined && column !== undefined) {
            return new monaco.Position(lineNumber, column);
        }
        return { lineNumber, column };
    }

}
