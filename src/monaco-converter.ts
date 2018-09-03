/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as Is from 'vscode-languageserver-protocol/lib/utils/is';
import {
    CodeActionParams, CodeLensParams,
    DocumentFormattingParams, DocumentOnTypeFormattingParams,
    DocumentRangeFormattingParams, ReferenceParams,
    RenameParams, TextDocumentPositionParams,
    Position, TextDocumentIdentifier, CompletionItem, CompletionList,
    CompletionParams, CompletionContext, CompletionTriggerKind,
    InsertTextFormat, Range, Diagnostic, CompletionItemKind,
    Hover, SignatureHelp, SignatureInformation, ParameterInformation,
    Definition, Location, DocumentHighlight, DocumentHighlightKind,
    SymbolInformation, DocumentSymbolParams, CodeActionContext, DiagnosticSeverity,
    Command, CodeLens, FormattingOptions, TextEdit, WorkspaceEdit, DocumentLinkParams, DocumentLink,
    MarkedString, MarkupContent, ColorInformation, ColorPresentation, FoldingRange, FoldingRangeKind,
    DiagnosticRelatedInformation, MarkupKind, SymbolKind, DocumentSymbol, CodeAction
} from './services';
import IReadOnlyModel = monaco.editor.IReadOnlyModel;

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ProtocolDocumentLink extends monaco.languages.ILink {
    data?: any;
}
export namespace ProtocolDocumentLink {
    export function is(item: any): item is ProtocolDocumentLink {
        return !!item && 'data' in item;
    }
}

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
    documentationFormat?: string;
    originalItemKind?: CompletionItemKind;
    deprecated?: boolean;
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

    asCompletionParams(model: IReadOnlyModel, position: monaco.Position, context: monaco.languages.CompletionContext): CompletionParams {
        return Object.assign(this.asTextDocumentPositionParams(model, position), {
            context: this.asCompletionContext(context)
        });
    }

    asCompletionContext(context: monaco.languages.CompletionContext): CompletionContext {
        return {
            triggerKind: this.asTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter
        }
    }

    asTriggerKind(triggerKind: monaco.languages.SuggestTriggerKind): CompletionTriggerKind {
        switch (triggerKind) {
            case monaco.languages.SuggestTriggerKind.TriggerCharacter:
                return CompletionTriggerKind.TriggerCharacter;
            case monaco.languages.SuggestTriggerKind.TriggerForIncompleteCompletions:
                return CompletionTriggerKind.TriggerForIncompleteCompletions;
            default:
                return CompletionTriggerKind.Invoked;
        }
    }

    asCompletionItem(item: monaco.languages.CompletionItem): CompletionItem {
        const result: CompletionItem = { label: item.label };
        const protocolItem = ProtocolCompletionItem.is(item) ? item : undefined;
        if (item.detail) { result.detail = item.detail; }
        // We only send items back we created. So this can't be something else than
        // a string right now.
        if (item.documentation) {
            if (!protocolItem || !protocolItem.documentationFormat) {
                result.documentation = item.documentation as string;
            } else {
                result.documentation = this.asDocumentation(protocolItem.documentationFormat, item.documentation);
            }
        }
        if (item.filterText) { result.filterText = item.filterText; }
        this.fillPrimaryInsertText(result, item as ProtocolCompletionItem);
        if (Is.number(item.kind)) {
            result.kind = this.asCompletionItemKind(item.kind, protocolItem && protocolItem.originalItemKind);
        }
        if (item.sortText) { result.sortText = item.sortText; }
        if (item.additionalTextEdits) { result.additionalTextEdits = this.asTextEdits(item.additionalTextEdits); }
        if (item.command) { result.command = this.asCommand(item.command); }
        if (item.commitCharacters) { result.commitCharacters = item.commitCharacters.slice(); }
        if (item.command) { result.command = this.asCommand(item.command); }
        // TODO if (item.preselect === true || item.preselect === false) { result.preselect = item.preselect; }
        if (protocolItem) {
            if (protocolItem.data !== undefined) {
                result.data = protocolItem.data;
            }
            if (protocolItem.deprecated === true || protocolItem.deprecated === false) {
                result.deprecated = protocolItem.deprecated;
            }
        }
        return result;
    }

    protected asCompletionItemKind(value: monaco.languages.CompletionItemKind, original: CompletionItemKind | undefined): CompletionItemKind {
        if (original !== undefined) {
            return original;
        }
        return value + 1 as CompletionItemKind;
    }

    protected asDocumentation(format: string, documentation: string | monaco.IMarkdownString): string | MarkupContent {
        switch (format) {
            case MarkupKind.PlainText:
                return { kind: format, value: documentation as string };
            case MarkupKind.Markdown:
                return { kind: format, value: (documentation as monaco.IMarkdownString).value };
            default:
                return `Unsupported Markup content received. Kind is: ${format}`;
        }
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

    asTextEdit(edit: monaco.editor.ISingleEditOperation): TextEdit {
        const range = this.asRange(edit.range)!;
        return {
            range,
            newText: edit.text
        }
    }

    asTextEdits(items: monaco.editor.ISingleEditOperation[]): TextEdit[];
    asTextEdits(items: undefined | null): undefined;
    asTextEdits(items: monaco.editor.ISingleEditOperation[] | undefined | null): TextEdit[] | undefined;
    asTextEdits(items: monaco.editor.ISingleEditOperation[] | undefined | null): TextEdit[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map(item => this.asTextEdit(item));
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

    asDiagnosticSeverity(value: monaco.MarkerSeverity): DiagnosticSeverity | undefined {
        switch (value) {
            case monaco.MarkerSeverity.Error:
                return DiagnosticSeverity.Error;
            case monaco.MarkerSeverity.Warning:
                return DiagnosticSeverity.Warning;
            case monaco.MarkerSeverity.Info:
                return DiagnosticSeverity.Information;
            case monaco.MarkerSeverity.Hint:
                return DiagnosticSeverity.Hint;
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
        return CodeActionContext.create(diagnostics, Is.string(context.only) ? [context.only] : undefined);
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
        let result = CodeLens.create(this.asRange(item.range));
        if (item.command) { result.command = this.asCommand(item.command); }
        if (ProtocolCodeLens.is(item)) {
            if (item.data) { result.data = item.data };
        }
        return result;
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

    asDocumentLinkParams(model: IReadOnlyModel): DocumentLinkParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        }
    }

    asDocumentLink(item: monaco.languages.ILink): DocumentLink {
        let result = DocumentLink.create(this.asRange(item.range));
        if (item.url) { result.target = item.url; }
        if (ProtocolDocumentLink.is(item) && item.data) {
            result.data = item.data;
        }
        return result;
    }
}

export class ProtocolToMonacoConverter {

    asResourceEdits(resource: monaco.Uri, edits: TextEdit[], modelVersionId?: number): monaco.languages.ResourceTextEdit {
        return {
            resource: resource,
            edits: this.asTextEdits(edits),
            modelVersionId
        }
    }

    asWorkspaceEdit(item: WorkspaceEdit): monaco.languages.WorkspaceEdit;
    asWorkspaceEdit(item: undefined | null): undefined;
    asWorkspaceEdit(item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined;
    asWorkspaceEdit(item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined {
        if (!item) {
            return undefined;
        }
        const edits: monaco.languages.ResourceTextEdit[] = [];
        if (item.documentChanges) {
            for (const change of item.documentChanges) {
                const resource = monaco.Uri.parse(change.textDocument.uri);
                const version = typeof change.textDocument.version === 'number' ? change.textDocument.version : undefined;
                edits.push(this.asResourceEdits(resource, change.edits, version));
            }
        } else if (item.changes) {
            for (const key of Object.keys(item.changes)) {
                const resource = monaco.Uri.parse(key);
                edits.push(this.asResourceEdits(resource, item.changes[key]));
            }
        }
        return {
            edits
        };
    }

    asTextEdit(edit: TextEdit): monaco.languages.TextEdit;
    asTextEdit(edit: undefined | null): undefined;
    asTextEdit(edit: TextEdit | undefined | null): undefined;
    asTextEdit(edit: TextEdit | undefined | null): monaco.languages.TextEdit | undefined {
        if (!edit) {
            return undefined;
        }
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

    asCodeActions(actions: (Command | CodeAction)[]): monaco.languages.CodeAction[] {
        return actions.map(action => this.asCodeAction(action));
    }

    asCodeAction(item: Command | CodeAction): monaco.languages.CodeAction {
        if (CodeAction.is(item)) {
            return {
                title: item.title,
                command: this.asCommand(item.command),
                edit: this.asWorkspaceEdit(item.edit),
                diagnostics: this.asDiagnostics(item.diagnostics),
                kind: item.kind
            };
        }
        return {
            command: {
                id: item.command,
                title: item.title,
                arguments: item.arguments
            },
            title: item.title
        };
    }

    asCommand(command: Command): monaco.languages.Command;
    asCommand(command: undefined): undefined;
    asCommand(command: Command | undefined): monaco.languages.Command | undefined;
    asCommand(command: Command | undefined): monaco.languages.Command | undefined {
        if (!command) {
            return undefined;
        }
        return {
            id: command.command,
            title: command.title,
            arguments: command.arguments
        };
    }

    asDocumentSymbol(value: DocumentSymbol): monaco.languages.DocumentSymbol {
        const children = value.children && value.children.map(c => this.asDocumentSymbol(c));
        return {
            name: value.name,
            detail: value.detail || "",
            kind: this.asSymbolKind(value.kind),
            range: this.asRange(value.range),
            selectionRange: this.asRange(value.selectionRange),
            children
        };
    }

    asDocumentSymbols(values: SymbolInformation[] | DocumentSymbol[]): monaco.languages.DocumentSymbol[] {
        if (DocumentSymbol.is(values[0])) {
            return (values as DocumentSymbol[]).map(s => this.asDocumentSymbol(s));
        }
        return this.asSymbolInformations(values as SymbolInformation[]);
    }

    asSymbolInformations(values: SymbolInformation[], uri?: monaco.Uri): monaco.languages.DocumentSymbol[];
    asSymbolInformations(values: undefined | null, uri?: monaco.Uri): undefined;
    asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.DocumentSymbol[] | undefined;
    asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.DocumentSymbol[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(information => this.asSymbolInformation(information, uri));
    }

    asSymbolInformation(item: SymbolInformation, uri?: monaco.Uri): monaco.languages.DocumentSymbol {
        const location = this.asLocation(uri ? { ...item.location, uri: uri.toString() } : item.location);
        return {
            name: item.name,
            detail: '',
            containerName: item.containerName,
            kind: this.asSymbolKind(item.kind),
            range: location.range,
            selectionRange: location.range
        };
    }

    asSymbolKind(item: SymbolKind): monaco.languages.SymbolKind {
        if (item <= SymbolKind.TypeParameter) {
            // Symbol kind is one based in the protocol and zero based in code.
            return item - 1;
        }
        return monaco.languages.SymbolKind.Property;
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
        const kind = Is.number(item.kind) ? this.asDocumentHighlightKind(item.kind) : undefined!;
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
        if (Is.array(item)) {
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
        if (Is.number(item.activeSignature)) {
            result.activeSignature = item.activeSignature;
        } else {
            // activeSignature was optional in the past
            result.activeSignature = 0;
        }
        if (Is.number(item.activeParameter)) {
            result.activeParameter = item.activeParameter;
        } else {
            // activeParameter was optional in the past
            result.activeParameter = 0;
        }
        if (item.signatures) {
            result.signatures = this.asSignatureInformations(item.signatures);
        } else {
            result.signatures = [];
        }
        return result;
    }

    asSignatureInformations(items: SignatureInformation[]): monaco.languages.SignatureInformation[] {
        return items.map(item => this.asSignatureInformation(item));
    }

    asSignatureInformation(item: SignatureInformation): monaco.languages.SignatureInformation {
        let result = <monaco.languages.SignatureInformation>{ label: item.label };
        if (item.documentation) { result.documentation = this.asDocumentation(item.documentation); }
        if (item.parameters) {
            result.parameters = this.asParameterInformations(item.parameters);
        } else {
            result.parameters = [];
        }
        return result;
    }

    asParameterInformations(item: ParameterInformation[]): monaco.languages.ParameterInformation[] {
        return item.map(item => this.asParameterInformation(item));
    }

    asParameterInformation(item: ParameterInformation): monaco.languages.ParameterInformation {
        let result = <monaco.languages.ParameterInformation>{ label: item.label };
        if (item.documentation) { result.documentation = this.asDocumentation(item.documentation) };
        return result;
    }

    asHover(hover: Hover): monaco.languages.Hover;
    asHover(hover: undefined | null): undefined;
    asHover(hover: Hover | undefined | null): monaco.languages.Hover | undefined;
    asHover(hover: Hover | undefined | null): monaco.languages.Hover | undefined {
        if (!hover) {
            return undefined;
        }
        return {
            contents: this.asHoverContent(hover.contents),
            range: this.asRange(hover.range)
        };
    }

    asHoverContent(contents: MarkedString | MarkedString[] | MarkupContent): monaco.IMarkdownString[] {
        if (Array.isArray(contents)) {
            return contents.map(content => this.asMarkdownString(content));
        }
        return [this.asMarkdownString(contents)];
    }

    asDocumentation(value: string | MarkupContent): string | monaco.IMarkdownString {
        if (Is.string(value)) {
            return value;
        }
        if (value.kind === MarkupKind.PlainText) {
            return value.value;
        }
        return this.asMarkdownString(value);
    }

    asMarkdownString(content: MarkedString | MarkupContent): monaco.IMarkdownString {
        if (MarkupContent.is(content)) {
            return {
                value: content.value
            };
        }
        if (Is.string(content)) {
            return { value: content };
        }
        const { language, value } = content;
        return {
            value: '```' + language + '\n' + value + '\n```'
        };
    }

    asSeverity(severity?: number): monaco.MarkerSeverity {
        if (severity === 1) {
            return monaco.MarkerSeverity.Error;
        }
        if (severity === 2) {
            return monaco.MarkerSeverity.Warning;
        }
        if (severity === 3) {
            return monaco.MarkerSeverity.Info;
        }
        return monaco.MarkerSeverity.Hint;
    }

    asDiagnostics(diagnostics: undefined): undefined;
    asDiagnostics(diagnostics: Diagnostic[]): monaco.editor.IMarkerData[];
    asDiagnostics(diagnostics: Diagnostic[] | undefined): monaco.editor.IMarkerData[] | undefined;
    asDiagnostics(diagnostics: Diagnostic[] | undefined): monaco.editor.IMarkerData[] | undefined {
        if (!diagnostics) {
            return undefined;
        }
        return diagnostics.map(diagnostic => this.asDiagnostic(diagnostic));
    }

    asDiagnostic(diagnostic: Diagnostic): monaco.editor.IMarkerData {
        return {
            code: typeof diagnostic.code === "number" ? diagnostic.code.toString() : diagnostic.code,
            severity: this.asSeverity(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source,
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            relatedInformation: this.asRelatedInformations(diagnostic.relatedInformation)
        }
    }

    asRelatedInformations(relatedInformation?: DiagnosticRelatedInformation[]): monaco.editor.IRelatedInformation[] | undefined {
        if (!relatedInformation) {
            return undefined;
        }
        return relatedInformation.map(item => this.asRelatedInformation(item));
    }

    asRelatedInformation(relatedInformation: DiagnosticRelatedInformation): monaco.editor.IRelatedInformation {
        return {
            resource: monaco.Uri.parse(relatedInformation.location.uri),
            startLineNumber: relatedInformation.location.range.start.line + 1,
            startColumn: relatedInformation.location.range.start.character + 1,
            endLineNumber: relatedInformation.location.range.end.line + 1,
            endColumn: relatedInformation.location.range.end.character + 1,
            message: relatedInformation.message
        }
    }

    asCompletionResult(result: CompletionItem[] | CompletionList | null | undefined): monaco.languages.CompletionList {
        if (!result) {
            return {
                isIncomplete: false,
                items: []
            }
        }
        if (Array.isArray(result)) {
            const items = result.map(item => this.asCompletionItem(item));
            return {
                isIncomplete: false,
                items
            }
        }
        return {
            isIncomplete: result.isIncomplete,
            items: result.items.map(this.asCompletionItem.bind(this))
        }
    }

    asCompletionItem(item: CompletionItem): ProtocolCompletionItem {
        const result = <ProtocolCompletionItem>{ label: item.label };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) {
            result.documentation = this.asDocumentation(item.documentation);
            result.documentationFormat = Is.string(item.documentation) ? undefined : item.documentation.kind;
        };
        if (item.filterText) { result.filterText = item.filterText; }
        let insertText = this.asCompletionInsertText(item);
        if (insertText) {
            result.insertText = insertText.text;
            result.range = insertText.range;
            result.fromEdit = insertText.fromEdit;
        }
        if (Is.number(item.kind)) {
            let [itemKind, original] = this.asCompletionItemKind(item.kind);
            result.kind = itemKind;
            if (original) {
                result.originalItemKind = original;
            }
        }
        if (item.sortText) { result.sortText = item.sortText; }
        if (item.additionalTextEdits) { result.additionalTextEdits = this.asTextEdits(item.additionalTextEdits); }
        if (Is.stringArray(item.commitCharacters)) { result.commitCharacters = item.commitCharacters.slice(); }
        if (item.command) { result.command = this.asCommand(item.command); }
        if (item.deprecated === true || item.deprecated === false) { result.deprecated = item.deprecated; }
        // TODO if (item.preselect === true || item.preselect === false) { result.preselect = item.preselect; }
        if (item.data !== undefined) { result.data = item.data; }
        return result;
    }

    asCompletionItemKind(value: CompletionItemKind): [monaco.languages.CompletionItemKind, CompletionItemKind | undefined] {
        // Protocol item kind is 1 based, codes item kind is zero based.
        if (CompletionItemKind.Text <= value && value <= CompletionItemKind.TypeParameter) {
            return [value - 1, undefined];
        };
        return [CompletionItemKind.Text, value];
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

    asDocumentLinks(documentLinks: DocumentLink[]): ProtocolDocumentLink[] {
        return documentLinks.map(link => this.asDocumentLink(link));
    }

    asDocumentLink(documentLink: DocumentLink): ProtocolDocumentLink {
        return {
            range: this.asRange(documentLink.range),
            url: documentLink.target,
            data: documentLink.data
        };
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

    asColorInformations(items: ColorInformation[]): monaco.languages.IColorInformation[] {
        return items.map(item => this.asColorInformation(item));
    }

    asColorInformation(item: ColorInformation): monaco.languages.IColorInformation {
        return {
            range: this.asRange(item.range),
            color: item.color
        }
    }

    asColorPresentations(items: ColorPresentation[]): monaco.languages.IColorPresentation[] {
        return items.map(item => this.asColorPresentation(item));
    }

    asColorPresentation(item: ColorPresentation): monaco.languages.IColorPresentation {
        return {
            label: item.label,
            textEdit: this.asTextEdit(item.textEdit),
            additionalTextEdits: this.asTextEdits(item.additionalTextEdits)
        }
    }

    asFoldingRanges(items: undefined | null): undefined | null;
    asFoldingRanges(items: FoldingRange[]): monaco.languages.FoldingRange[];
    asFoldingRanges(items: FoldingRange[] | undefined | null): monaco.languages.FoldingRange[] | undefined | null {
        if (!items) {
            return items;
        }
        return items.map(item => this.asFoldingRange(item));
    }

    asFoldingRange(item: FoldingRange): monaco.languages.FoldingRange {
        return {
            start: item.startLine + 1,
            end: item.endLine + 1,
            kind: this.asFoldingRangeKind(item.kind)
        };
    }

    asFoldingRangeKind(kind?: string): monaco.languages.FoldingRangeKind | undefined {
        if (kind) {
            switch (kind) {
                case FoldingRangeKind.Comment:
                    return monaco.languages.FoldingRangeKind.Comment;
                case FoldingRangeKind.Imports:
                    return monaco.languages.FoldingRangeKind.Imports;
                case FoldingRangeKind.Region:
                    return monaco.languages.FoldingRangeKind.Region;
            };
        }
        return undefined;
    }

}
