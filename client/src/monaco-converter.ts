/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as ls from 'vscode-languageserver-protocol';
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
    Definition, DefinitionLink, Location, LocationLink, DocumentHighlight, DocumentHighlightKind,
    SymbolInformation, DocumentSymbolParams, CodeActionContext, DiagnosticSeverity,
    Command, CodeLens, FormattingOptions, TextEdit, WorkspaceEdit, DocumentLinkParams, DocumentLink,
    MarkedString, MarkupContent, ColorInformation, ColorPresentation, FoldingRange, FoldingRangeKind,
    DiagnosticRelatedInformation, MarkupKind, SymbolKind, DocumentSymbol, CodeAction, SignatureHelpContext, SignatureHelpTriggerKind
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

export interface ProtocolCodeLens extends monaco.languages.CodeLens {
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

type RangeReplace = { insert: monaco.IRange; replace: monaco.IRange}

function isRangeReplace(v: Partial<monaco.IRange> | RangeReplace) : v is RangeReplace {
    return (v as RangeReplace).insert !== undefined;
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
    asRange(range: monaco.IRange | { insert: monaco.IRange; replace: monaco.IRange}) : Range;
    asRange(range: Partial<monaco.IRange>): RecursivePartial<Range>;
    asRange(range: Partial<monaco.IRange> | undefined): RecursivePartial<Range> | undefined;
    asRange(range: Partial<monaco.IRange> | null): RecursivePartial<Range> | null;
    asRange(range: Partial<monaco.IRange> | undefined | null | RangeReplace): RecursivePartial<Range> | undefined | null {
        if (range === undefined) {
            return undefined;
        }
        if (range === null) {
            return null;
        }

        if (isRangeReplace(range)) {
            return this.asRange(range.insert);

        } else {
            const start = this.asPosition(range.startLineNumber, range.startColumn);
            const end = this.asPosition(range.endLineNumber, range.endColumn);
            return {
                start, end
            };
        }
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
            triggerKind: this.asCompletionTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter
        }
    }

    asSignatureHelpContext(context: monaco.languages.SignatureHelpContext) : SignatureHelpContext {
        return {
            triggerKind: this.asSignatureHelpTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter,
            isRetrigger: context.isRetrigger,
            activeSignatureHelp: this.asSignatureHelp(context.activeSignatureHelp)
        };
    }

    asSignatureHelp(signatureHelp: monaco.languages.SignatureHelp | undefined) : SignatureHelp | undefined {
        if(signatureHelp === undefined) {
            return undefined;
        }
        return {
            signatures: signatureHelp.signatures.map(signatureInfo => this.asSignatureInformation(signatureInfo)),
            activeParameter: signatureHelp.activeParameter,
            activeSignature: signatureHelp.activeSignature
        };
    }

    asSignatureInformation(signatureInformation: monaco.languages.SignatureInformation) : SignatureInformation {
        return {
            documentation: this.asMarkupContent(signatureInformation.documentation),
            label: signatureInformation.label,
            parameters: signatureInformation.parameters.map(paramInfo => this.asParameterInformation(paramInfo))
        };
    }

    asParameterInformation(parameterInformation: monaco.languages.ParameterInformation) : ParameterInformation {
        return {
            documentation: this.asMarkupContent(parameterInformation.documentation),
            label: parameterInformation.label
        };
    }

    asMarkupContent(markupContent: (string | monaco.IMarkdownString | undefined)): string | MarkupContent | undefined {
        if(markupContent === undefined) {
            return undefined;
        }
        if(typeof markupContent === "string") {
            return markupContent;
        }
        return {
            kind: MarkupKind.Markdown,
            value: markupContent.value
        };
    }

    asSignatureHelpTriggerKind(triggerKind: monaco.languages.SignatureHelpTriggerKind) : SignatureHelpTriggerKind {
        switch  (triggerKind) {
            case monaco.languages.SignatureHelpTriggerKind.ContentChange:
                return SignatureHelpTriggerKind.ContentChange;
            case monaco.languages.SignatureHelpTriggerKind.TriggerCharacter:
                return SignatureHelpTriggerKind.TriggerCharacter;
            default:
                return SignatureHelpTriggerKind.Invoke;
        }
    }

    asCompletionTriggerKind(triggerKind: monaco.languages.CompletionTriggerKind): CompletionTriggerKind {
        switch (triggerKind) {
            case monaco.languages.CompletionTriggerKind.TriggerCharacter:
                return CompletionTriggerKind.TriggerCharacter;
            case monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions:
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
        switch (value) {
            case monaco.languages.CompletionItemKind.Method: return CompletionItemKind.Method;
            case monaco.languages.CompletionItemKind.Function: return CompletionItemKind.Function;
            case monaco.languages.CompletionItemKind.Constructor: return CompletionItemKind.Constructor;
            case monaco.languages.CompletionItemKind.Field: return CompletionItemKind.Field;
            case monaco.languages.CompletionItemKind.Variable: return CompletionItemKind.Variable;
            case monaco.languages.CompletionItemKind.Class: return CompletionItemKind.Class;
            case monaco.languages.CompletionItemKind.Struct: return CompletionItemKind.Struct;
            case monaco.languages.CompletionItemKind.Interface: return CompletionItemKind.Interface;
            case monaco.languages.CompletionItemKind.Module: return CompletionItemKind.Module;
            case monaco.languages.CompletionItemKind.Property: return CompletionItemKind.Property;
            case monaco.languages.CompletionItemKind.Event: return CompletionItemKind.Event;
            case monaco.languages.CompletionItemKind.Operator: return CompletionItemKind.Operator;
            case monaco.languages.CompletionItemKind.Unit: return CompletionItemKind.Unit;
            case monaco.languages.CompletionItemKind.Value: return CompletionItemKind.Value;
            case monaco.languages.CompletionItemKind.Constant: return CompletionItemKind.Constant;
            case monaco.languages.CompletionItemKind.Enum: return CompletionItemKind.Enum;
            case monaco.languages.CompletionItemKind.EnumMember: return CompletionItemKind.EnumMember;
            case monaco.languages.CompletionItemKind.Keyword: return CompletionItemKind.Keyword;
            case monaco.languages.CompletionItemKind.Text: return CompletionItemKind.Text;
            case monaco.languages.CompletionItemKind.Color: return CompletionItemKind.Color;
            case monaco.languages.CompletionItemKind.File: return CompletionItemKind.File;
            case monaco.languages.CompletionItemKind.Reference: return CompletionItemKind.Reference;
            case monaco.languages.CompletionItemKind.Customcolor: return CompletionItemKind.Color;
            case monaco.languages.CompletionItemKind.Folder: return CompletionItemKind.Folder;
            case monaco.languages.CompletionItemKind.TypeParameter: return CompletionItemKind.TypeParameter;
            case monaco.languages.CompletionItemKind.Snippet: return CompletionItemKind.Snippet;
            default: return value + 1 as CompletionItemKind;
        }
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
        if (source.insertTextRules !== undefined && (source.insertTextRules & monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet) === 0) {
            format = InsertTextFormat.Snippet;
            text = source.insertText;
        }
        target.insertTextFormat = format;

        text = source.insertText;
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
            newText: edit.text || ''
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

    asCodeLens(item: monaco.languages.CodeLens): CodeLens {
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
        if (item.url) { result.target = typeof item.url === 'string' ? item.url : item.url.toString(); }
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
        const edits: (monaco.languages.ResourceTextEdit | monaco.languages.ResourceFileEdit)[] = [];
        if (item.documentChanges) {
            item.documentChanges.forEach(change => {
                if (ls.CreateFile.is(change)) {
                    edits.push(<monaco.languages.ResourceFileEdit>{
                        newUri: monaco.Uri.parse(change.uri),
                        options: change.options
                    });
                } else if (ls.RenameFile.is(change)) {
                    edits.push(<monaco.languages.ResourceFileEdit>{
                        oldUri: monaco.Uri.parse(change.oldUri),
                        newUri: monaco.Uri.parse(change.newUri),
                        options: change.options
                    });
                } else if (ls.DeleteFile.is(change)) {
                    edits.push(<monaco.languages.ResourceFileEdit>{
                        oldUri: monaco.Uri.parse(change.uri),
                        options: change.options
                    });
                } else if (ls.TextDocumentEdit.is(change)) {
                    const resource = monaco.Uri.parse(change.textDocument.uri);
                    const version = typeof change.textDocument.version === 'number' ? change.textDocument.version : undefined;
                    edits.push(this.asResourceEdits(resource, change.edits, version));
                } else {
                    console.error(`Unknown workspace edit change received:\n${JSON.stringify(change, undefined, 4)}`);
                }
            });
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

    asTextEdits(items: TextEdit[]): monaco.languages.TextEdit[];
    asTextEdits(items: undefined | null): undefined;
    asTextEdits(items: TextEdit[] | undefined | null): monaco.languages.TextEdit[] | undefined;
    asTextEdits(items: TextEdit[] | undefined | null): monaco.languages.TextEdit[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map(item => this.asTextEdit(item));
    }

    asCodeLens(item: CodeLens): monaco.languages.CodeLens;
    asCodeLens(item: undefined | null): undefined;
    asCodeLens(item: CodeLens | undefined | null): monaco.languages.CodeLens | undefined;
    asCodeLens(item: CodeLens | undefined | null): monaco.languages.CodeLens | undefined {
        if (!item) {
            return undefined;
        }
        const range = this.asRange(item.range);
        let result = <ProtocolCodeLens>{ range };
        if (item.command) { result.command = this.asCommand(item.command); }
        if (item.data !== void 0 && item.data !== null) { result.data = item.data; }
        return result;
    }

    asCodeLensList(items: CodeLens[]): monaco.languages.CodeLensList;
    asCodeLensList(items: undefined | null): undefined;
    asCodeLensList(items: CodeLens[] | undefined | null): monaco.languages.CodeLensList | undefined;
    asCodeLensList(items: CodeLens[] | undefined | null): monaco.languages.CodeLensList | undefined {
        if (!items) {
            return undefined;
        }
        return {
            lenses: items.map((codeLens) => this.asCodeLens(codeLens)),
            dispose: () => {}
        };
    }

    asCodeActionList(actions: (Command | CodeAction)[]): monaco.languages.CodeActionList {
        return {
            actions: actions.map(action => this.asCodeAction(action)),
            dispose: () => {}
        };
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
            tags: [],
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
            tags: [],
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
    asDefinitionResult(item: DefinitionLink[]): monaco.languages.Definition;
    asDefinitionResult(item: undefined | null): undefined;
    asDefinitionResult(item: Definition | DefinitionLink[] | undefined | null): monaco.languages.Definition | undefined;
    asDefinitionResult(item: Definition | DefinitionLink[] | undefined | null): monaco.languages.Definition | undefined {
        if (!item) {
            return undefined;
        }
        if (Is.array(item)) {
            if (item.length == 0) {
                return undefined;
            } else if (LocationLink.is(item[0])) {
                let links: LocationLink[] = item as LocationLink[];
                return links.map((location) => this.asLocationLink(location));
            } else {
                let locations: Location[] = item as Location[];
                return locations.map((location) => this.asLocation(location));
            }
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

    asLocationLink(item: undefined | null): undefined;
	asLocationLink(item: ls.LocationLink): monaco.languages.LocationLink;
	asLocationLink(item: ls.LocationLink | undefined | null): monaco.languages.LocationLink | undefined {
		if (!item) {
			return undefined;
		}
		let result: monaco.languages.LocationLink = {
			uri: monaco.Uri.parse(item.targetUri),
			range: this.asRange(item.targetSelectionRange)!, // See issue: https://github.com/Microsoft/vscode/issues/58649
			originSelectionRange: this.asRange(item.originSelectionRange),
			targetSelectionRange: this.asRange(item.targetSelectionRange)
		};
		if (!result.targetSelectionRange) {
			throw new Error(`targetSelectionRange must not be undefined or null`);
		}
		return result;
	}

    asSignatureHelpResult(item: undefined | null): undefined;
    asSignatureHelpResult(item: SignatureHelp): monaco.languages.SignatureHelpResult;
    asSignatureHelpResult(item: SignatureHelp | undefined | null): monaco.languages.SignatureHelpResult | undefined;
    asSignatureHelpResult(item: SignatureHelp | undefined | null): monaco.languages.SignatureHelpResult | undefined {
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
        return {
            value: result,
            dispose: () => {}
        };
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

    asCompletionResult(result: CompletionItem[] | CompletionList | null | undefined, defaultRange: monaco.IRange): monaco.languages.CompletionList {
        if (!result) {
            return {
                incomplete: false,
                suggestions: []
            }
        }
        if (Array.isArray(result)) {
            const suggestions = result.map(item => this.asCompletionItem(item, defaultRange));
            return {
                incomplete: false,
                suggestions
            }
        }
        return {
            incomplete: result.isIncomplete,
            suggestions: result.items.map(item => this.asCompletionItem(item, defaultRange))
        }
    }

    asCompletionItem(item: CompletionItem, defaultRange: monaco.IRange | RangeReplace): ProtocolCompletionItem {
        const result = <ProtocolCompletionItem>{ label: item.label };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) {
            result.documentation = this.asDocumentation(item.documentation);
            result.documentationFormat = Is.string(item.documentation) ? undefined : item.documentation.kind;
        };
        if (item.filterText) { result.filterText = item.filterText; }
        const insertText = this.asCompletionInsertText(item, defaultRange);
        result.insertText = insertText.insertText;
        result.range = insertText.range;
        result.fromEdit = insertText.fromEdit;
        if (insertText.isSnippet) {
            result.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
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
        if (item.preselect === true || item.preselect === false) { result.preselect = item.preselect; }
        if (item.data !== undefined) { result.data = item.data; }
        if (item.deprecated === true || item.deprecated === false) {
            result.deprecated = item.deprecated;
        }
        return result;
    }

    asCompletionItemKind(value: CompletionItemKind): [monaco.languages.CompletionItemKind, CompletionItemKind | undefined] {
        if (CompletionItemKind.Text <= value && value <= CompletionItemKind.TypeParameter) {
            switch (value) {
                case CompletionItemKind.Text: return [monaco.languages.CompletionItemKind.Text, undefined];
                case CompletionItemKind.Method: return [monaco.languages.CompletionItemKind.Method, undefined];
                case CompletionItemKind.Function: return [monaco.languages.CompletionItemKind.Function, undefined];
                case CompletionItemKind.Constructor: return [monaco.languages.CompletionItemKind.Constructor, undefined];
                case CompletionItemKind.Field: return [monaco.languages.CompletionItemKind.Field, undefined];
                case CompletionItemKind.Variable: return [monaco.languages.CompletionItemKind.Variable, undefined];
                case CompletionItemKind.Class: return [monaco.languages.CompletionItemKind.Class, undefined];
                case CompletionItemKind.Interface: return [monaco.languages.CompletionItemKind.Interface, undefined];
                case CompletionItemKind.Module: return [monaco.languages.CompletionItemKind.Module, undefined];
                case CompletionItemKind.Property: return [monaco.languages.CompletionItemKind.Property, undefined];
                case CompletionItemKind.Unit: return [monaco.languages.CompletionItemKind.Unit, undefined];
                case CompletionItemKind.Value: return [monaco.languages.CompletionItemKind.Value, undefined];
                case CompletionItemKind.Enum: return [monaco.languages.CompletionItemKind.Enum, undefined];
                case CompletionItemKind.Keyword: return [monaco.languages.CompletionItemKind.Keyword, undefined];
                case CompletionItemKind.Snippet: return [monaco.languages.CompletionItemKind.Snippet, undefined];
                case CompletionItemKind.Color: return [monaco.languages.CompletionItemKind.Color, undefined];
                case CompletionItemKind.File: return [monaco.languages.CompletionItemKind.File, undefined];
                case CompletionItemKind.Reference: return [monaco.languages.CompletionItemKind.Reference, undefined];
                case CompletionItemKind.Folder: return [monaco.languages.CompletionItemKind.Folder, undefined];
                case CompletionItemKind.EnumMember: return [monaco.languages.CompletionItemKind.EnumMember, undefined];
                case CompletionItemKind.Constant: return [monaco.languages.CompletionItemKind.Constant, undefined];
                case CompletionItemKind.Struct: return [monaco.languages.CompletionItemKind.Struct, undefined];
                case CompletionItemKind.Event: return [monaco.languages.CompletionItemKind.Event, undefined];
                case CompletionItemKind.Operator: return [monaco.languages.CompletionItemKind.Operator, undefined];
                case CompletionItemKind.TypeParameter: return [monaco.languages.CompletionItemKind.TypeParameter, undefined];
                default: return [value - 1, undefined];
            }

        };
        return [CompletionItemKind.Text, value];
    }

    asCompletionInsertText(item: CompletionItem, defaultRange: monaco.IRange | RangeReplace)
        : { insertText: string, range: monaco.IRange | RangeReplace, fromEdit: boolean, isSnippet: boolean } {
        const isSnippet = item.insertTextFormat === InsertTextFormat.Snippet;
        if (item.textEdit) {
            const range = this.asRange(item.textEdit.range);
            const value = item.textEdit.newText;
            return { isSnippet, insertText: value, range, fromEdit: true, };
        }
        if (item.insertText) {
            return { isSnippet, insertText: item.insertText, fromEdit: false, range: defaultRange };
        }
        return { insertText: item.label, range: defaultRange, fromEdit: false, isSnippet: false };
    }

    asDocumentLinks(documentLinks: DocumentLink[]): monaco.languages.ILinksList {
        const links = documentLinks.map(link => this.asDocumentLink(link));
        return { links };
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
