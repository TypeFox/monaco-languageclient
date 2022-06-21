/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as ls from 'vscode-languageserver-protocol';
import * as Is from 'vscode-languageserver-protocol/lib/common/utils/is';
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
    DiagnosticRelatedInformation, MarkupKind, SymbolKind, DocumentSymbol, CodeAction, SignatureHelpContext, SignatureHelpTriggerKind,
    SemanticTokens, InsertTextMode, AnnotatedTextEdit, ChangeAnnotation, InlayHint, InlayHintLabelPart
} from 'vscode-languageserver-protocol/lib/common/api';

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface ProtocolDocumentLink extends monaco.languages.ILink {
    data?: unknown;
}

export namespace ProtocolDocumentLink {
    export function is (item: any): item is ProtocolDocumentLink {
        return !!item && 'data' in item;
    }
}

export interface ProtocolCodeLens extends monaco.languages.CodeLens {
    data?: unknown;
}

export namespace ProtocolCodeLens {
    export function is (item: any): item is ProtocolCodeLens {
        return !!item && 'data' in item;
    }
}

export interface ProtocolCompletionItem extends monaco.languages.CompletionItem {
    data?: unknown;
    fromEdit?: boolean;
    documentationFormat?: string;
    originalItemKind?: CompletionItemKind;
    deprecated?: boolean;
    insertTextMode?: InsertTextMode;
}
export namespace ProtocolCompletionItem {
    export function is (item: any): item is ProtocolCompletionItem {
        return !!item && 'data' in item;
    }
}

export interface ProtocolCodeAction extends monaco.languages.CodeAction {
    data?: unknown;
}
export namespace ProtocolCodeAction {
    export function is (item: any): item is ProtocolCodeAction {
        return !!item && 'data' in item;
    }
}

export interface ProtocolInlayHint extends monaco.languages.InlayHint {
    data?: unknown;
}
export namespace ProtocolInlayHint {
    export function is (item: any): item is ProtocolInlayHint {
        return !!item && 'data' in item;
    }
}

type RangeReplace = { insert: monaco.IRange; replace: monaco.IRange }

function isRangeReplace (v: Partial<monaco.IRange> | RangeReplace): v is RangeReplace {
    return (v as RangeReplace).insert !== undefined;
}

/**
 * @deprecated use @CodinGame/monaco-vscode-api and vscode-languageclient/lib/common/codeConverter (see browser example)
 */
export class MonacoToProtocolConverter {
    public constructor (protected readonly _monaco: typeof monaco) { }

    asPosition(lineNumber: undefined | null, column: undefined | null): {};
    asPosition(lineNumber: number, column: undefined | null): Pick<Position, 'line'>;
    asPosition(lineNumber: undefined | null, column: number): Pick<Position, 'character'>;
    asPosition(lineNumber: number, column: number): Position;
    asPosition(lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position>;
    asPosition (lineNumber: number | undefined | null, column: number | undefined | null): Partial<Position> {
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
    asRange(range: monaco.IRange | { insert: monaco.IRange; replace: monaco.IRange }): Range;
    asRange(range: Partial<monaco.IRange>): RecursivePartial<Range>;
    asRange(range: Partial<monaco.IRange> | undefined): RecursivePartial<Range> | undefined;
    asRange(range: Partial<monaco.IRange> | null): RecursivePartial<Range> | null;
    asRange (range: Partial<monaco.IRange> | undefined | null | RangeReplace): RecursivePartial<Range> | undefined | null {
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

    asLocation(item: monaco.languages.Location): Location;
    asLocation(item: undefined | null): undefined;
    asLocation(item: monaco.languages.Location | undefined | null): Location | undefined;
    asLocation (item: monaco.languages.Location | undefined | null): Location | undefined {
        if (!item) {
            return undefined;
        }
        const uri = item.uri.toString();
        const range = this.asRange(item.range);
        return {
            uri,
            range
        };
    }

    asTextDocumentIdentifier (model: monaco.editor.IReadOnlyModel): TextDocumentIdentifier {
        return {
            uri: model.uri.toString()
        };
    }

    asTextDocumentPositionParams (model: monaco.editor.IReadOnlyModel, position: monaco.Position): TextDocumentPositionParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column)
        };
    }

    asCompletionParams (model: monaco.editor.IReadOnlyModel, position: monaco.Position, context: monaco.languages.CompletionContext): CompletionParams {
        return Object.assign(this.asTextDocumentPositionParams(model, position), {
            context: this.asCompletionContext(context)
        });
    }

    asCompletionContext (context: monaco.languages.CompletionContext): CompletionContext {
        return {
            triggerKind: this.asCompletionTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter
        };
    }

    asSignatureHelpContext (context: monaco.languages.SignatureHelpContext): SignatureHelpContext {
        return {
            triggerKind: this.asSignatureHelpTriggerKind(context.triggerKind),
            triggerCharacter: context.triggerCharacter,
            isRetrigger: context.isRetrigger,
            activeSignatureHelp: this.asSignatureHelp(context.activeSignatureHelp)
        };
    }

    asSignatureHelp (signatureHelp: monaco.languages.SignatureHelp | undefined): SignatureHelp | undefined {
        if (signatureHelp === undefined) {
            return undefined;
        }
        return {
            signatures: signatureHelp.signatures.map(signatureInfo => this.asSignatureInformation(signatureInfo)),
            activeParameter: signatureHelp.activeParameter,
            activeSignature: signatureHelp.activeSignature
        };
    }

    asSignatureInformation (signatureInformation: monaco.languages.SignatureInformation): SignatureInformation {
        return {
            documentation: this.asMarkupContent(signatureInformation.documentation),
            label: signatureInformation.label,
            parameters: signatureInformation.parameters.map(paramInfo => this.asParameterInformation(paramInfo)),
            activeParameter: signatureInformation.activeParameter
        };
    }

    asParameterInformation (parameterInformation: monaco.languages.ParameterInformation): ParameterInformation {
        return {
            documentation: this.asMarkupContent(parameterInformation.documentation),
            label: parameterInformation.label
        };
    }

    asMarkupContent (markupContent: (string | monaco.IMarkdownString | undefined)): string | MarkupContent | undefined {
        if (markupContent === undefined) {
            return undefined;
        }
        if (typeof markupContent === 'string') {
            return markupContent;
        }
        return {
            kind: MarkupKind.Markdown,
            value: markupContent.value
        };
    }

    asSignatureHelpTriggerKind (triggerKind: monaco.languages.SignatureHelpTriggerKind): SignatureHelpTriggerKind {
        switch (triggerKind) {
            case this._monaco.languages.SignatureHelpTriggerKind.ContentChange:
                return SignatureHelpTriggerKind.ContentChange;
            case this._monaco.languages.SignatureHelpTriggerKind.TriggerCharacter:
                return SignatureHelpTriggerKind.TriggerCharacter;
            default:
                return SignatureHelpTriggerKind.Invoked;
        }
    }

    asCompletionTriggerKind (triggerKind: monaco.languages.CompletionTriggerKind): CompletionTriggerKind {
        switch (triggerKind) {
            case this._monaco.languages.CompletionTriggerKind.TriggerCharacter:
                return CompletionTriggerKind.TriggerCharacter;
            case this._monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions:
                return CompletionTriggerKind.TriggerForIncompleteCompletions;
            default:
                return CompletionTriggerKind.Invoked;
        }
    }

    asCompletionItem (item: monaco.languages.CompletionItem): CompletionItem {
        const result: CompletionItem = { label: item.label as string };
        const protocolItem = ProtocolCompletionItem.is(item) ? item : undefined;
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) {
            if (typeof item.documentation === 'string') {
                result.documentation = item.documentation;
            } else {
                result.documentation = this.asDocumentation(protocolItem?.documentationFormat ?? MarkupKind.Markdown, item.documentation);
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
        if (item.preselect === true || item.preselect === false) { result.preselect = item.preselect; }
        if (protocolItem) {
            if (protocolItem.data !== undefined) {
                result.data = protocolItem.data;
            }
            if (protocolItem.deprecated === true || protocolItem.deprecated === false) {
                result.deprecated = protocolItem.deprecated;
            }
        }
        if (item.tags) { result.tags = item.tags?.slice(); }
        return result;
    }

    protected asCompletionItemKind (value: monaco.languages.CompletionItemKind, original: CompletionItemKind | undefined): CompletionItemKind {
        if (original !== undefined) {
            return original;
        }
        switch (value) {
            case this._monaco.languages.CompletionItemKind.Method: return CompletionItemKind.Method;
            case this._monaco.languages.CompletionItemKind.Function: return CompletionItemKind.Function;
            case this._monaco.languages.CompletionItemKind.Constructor: return CompletionItemKind.Constructor;
            case this._monaco.languages.CompletionItemKind.Field: return CompletionItemKind.Field;
            case this._monaco.languages.CompletionItemKind.Variable: return CompletionItemKind.Variable;
            case this._monaco.languages.CompletionItemKind.Class: return CompletionItemKind.Class;
            case this._monaco.languages.CompletionItemKind.Struct: return CompletionItemKind.Struct;
            case this._monaco.languages.CompletionItemKind.Interface: return CompletionItemKind.Interface;
            case this._monaco.languages.CompletionItemKind.Module: return CompletionItemKind.Module;
            case this._monaco.languages.CompletionItemKind.Property: return CompletionItemKind.Property;
            case this._monaco.languages.CompletionItemKind.Event: return CompletionItemKind.Event;
            case this._monaco.languages.CompletionItemKind.Operator: return CompletionItemKind.Operator;
            case this._monaco.languages.CompletionItemKind.Unit: return CompletionItemKind.Unit;
            case this._monaco.languages.CompletionItemKind.Value: return CompletionItemKind.Value;
            case this._monaco.languages.CompletionItemKind.Constant: return CompletionItemKind.Constant;
            case this._monaco.languages.CompletionItemKind.Enum: return CompletionItemKind.Enum;
            case this._monaco.languages.CompletionItemKind.EnumMember: return CompletionItemKind.EnumMember;
            case this._monaco.languages.CompletionItemKind.Keyword: return CompletionItemKind.Keyword;
            case this._monaco.languages.CompletionItemKind.Text: return CompletionItemKind.Text;
            case this._monaco.languages.CompletionItemKind.Color: return CompletionItemKind.Color;
            case this._monaco.languages.CompletionItemKind.File: return CompletionItemKind.File;
            case this._monaco.languages.CompletionItemKind.Reference: return CompletionItemKind.Reference;
            case this._monaco.languages.CompletionItemKind.Customcolor: return CompletionItemKind.Color;
            case this._monaco.languages.CompletionItemKind.Folder: return CompletionItemKind.Folder;
            case this._monaco.languages.CompletionItemKind.TypeParameter: return CompletionItemKind.TypeParameter;
            case this._monaco.languages.CompletionItemKind.Snippet: return CompletionItemKind.Snippet;
            default: return value + 1 as CompletionItemKind;
        }
    }

    protected asDocumentation (format: string, documentation: string | monaco.IMarkdownString): string | MarkupContent {
        switch (format) {
            case MarkupKind.PlainText:
                return { kind: format, value: documentation as string };
            case MarkupKind.Markdown:
                return { kind: format, value: (documentation as monaco.IMarkdownString).value };
            default:
                return `Unsupported Markup content received. Kind is: ${format}`;
        }
    }

    protected fillPrimaryInsertText (target: CompletionItem, source: ProtocolCompletionItem): void {
        let format: InsertTextFormat = InsertTextFormat.PlainText;
        let text: string | undefined;
        let range: Range | undefined;
        if (source.insertTextRules !== undefined && (source.insertTextRules & this._monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet) === 0) {
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
            target.textEdit = { newText: text, range };
        } else {
            target.insertText = text;
        }
        target.insertTextMode = source.insertTextMode;
    }

    asTextEdit (edit: monaco.editor.ISingleEditOperation): TextEdit {
        const range = this.asRange(edit.range)!;
        return {
            range,
            newText: edit.text || ''
        };
    }

    asTextEdits(items: monaco.editor.ISingleEditOperation[]): TextEdit[];
    asTextEdits(items: undefined | null): undefined;
    asTextEdits(items: monaco.editor.ISingleEditOperation[] | undefined | null): TextEdit[] | undefined;
    asTextEdits (items: monaco.editor.ISingleEditOperation[] | undefined | null): TextEdit[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map(item => this.asTextEdit(item));
    }

    asReferenceParams (model: monaco.editor.IReadOnlyModel, position: monaco.Position, options: { includeDeclaration: boolean; }): ReferenceParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            context: { includeDeclaration: options.includeDeclaration }
        };
    }

    asDocumentSymbolParams (model: monaco.editor.IReadOnlyModel): DocumentSymbolParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        };
    }

    asCodeLensParams (model: monaco.editor.IReadOnlyModel): CodeLensParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        };
    }

    asDiagnosticSeverity (value: monaco.MarkerSeverity): DiagnosticSeverity | undefined {
        switch (value) {
            case this._monaco.MarkerSeverity.Error:
                return DiagnosticSeverity.Error;
            case this._monaco.MarkerSeverity.Warning:
                return DiagnosticSeverity.Warning;
            case this._monaco.MarkerSeverity.Info:
                return DiagnosticSeverity.Information;
            case this._monaco.MarkerSeverity.Hint:
                return DiagnosticSeverity.Hint;
        }
        return undefined;
    }

    asDiagnostic (marker: monaco.editor.IMarkerData): Diagnostic {
        const range = this.asRange(new this._monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn));
        const severity = this.asDiagnosticSeverity(marker.severity);
        const diag = Diagnostic.create(range, marker.message, severity, marker.code as string, marker.source);
        return diag;
    }

    asDiagnostics (markers: monaco.editor.IMarkerData[]): Diagnostic[] {
        if (markers === void 0 || markers === null) {
            return markers;
        }
        return markers.map(marker => this.asDiagnostic(marker));
    }

    asCodeActionContext (context: monaco.languages.CodeActionContext, diagnostics: Diagnostic[]): CodeActionContext {
        if (context === void 0 || context === null) {
            return context;
        }
        // FIXME: CodeActionTriggerKind is missing
        return CodeActionContext.create(diagnostics, Is.string(context.only) ? [context.only] : undefined, undefined);
    }

    asCodeActionParams (model: monaco.editor.IReadOnlyModel, range: monaco.Range, context: monaco.languages.CodeActionContext, diagnostics: Diagnostic[]): CodeActionParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            range: this.asRange(range),
            context: this.asCodeActionContext(context, diagnostics)
        };
    }

    asCommand (item: monaco.languages.Command | undefined | null): Command | undefined {
        if (item) {
            const args = item.arguments || [];
            return Command.create(item.title, item.id, ...args);
        }
        return undefined;
    }

    asCodeLens (item: monaco.languages.CodeLens): CodeLens {
        const result = CodeLens.create(this.asRange(item.range));
        if (item.command) { result.command = this.asCommand(item.command); }
        if (ProtocolCodeLens.is(item)) {
            if (item.data) { result.data = item.data; }
        }
        return result;
    }

    asFormattingOptions (options: monaco.languages.FormattingOptions): FormattingOptions {
        return { tabSize: options.tabSize, insertSpaces: options.insertSpaces };
    }

    asDocumentFormattingParams (model: monaco.editor.IReadOnlyModel, options: monaco.languages.FormattingOptions): DocumentFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            options: this.asFormattingOptions(options)
        };
    }

    asDocumentRangeFormattingParams (model: monaco.editor.IReadOnlyModel, range: monaco.Range, options: monaco.languages.FormattingOptions): DocumentRangeFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            range: this.asRange(range),
            options: this.asFormattingOptions(options)
        };
    }

    asDocumentOnTypeFormattingParams (model: monaco.editor.IReadOnlyModel, position: monaco.IPosition, ch: string, options: monaco.languages.FormattingOptions): DocumentOnTypeFormattingParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            ch,
            options: this.asFormattingOptions(options)
        };
    }

    asRenameParams (model: monaco.editor.IReadOnlyModel, position: monaco.IPosition, newName: string): RenameParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model),
            position: this.asPosition(position.lineNumber, position.column),
            newName
        };
    }

    asDocumentLinkParams (model: monaco.editor.IReadOnlyModel): DocumentLinkParams {
        return {
            textDocument: this.asTextDocumentIdentifier(model)
        };
    }

    asDocumentLink (item: monaco.languages.ILink): DocumentLink {
        const result = DocumentLink.create(this.asRange(item.range));
        if (item.url) { result.target = typeof item.url === 'string' ? item.url : item.url.toString(); }
        if (ProtocolDocumentLink.is(item) && item.data) {
            result.data = item.data;
        }
        if (item.tooltip) { result.tooltip = item.tooltip; }
        return result;
    }

    asCodeAction (item: monaco.languages.CodeAction): CodeAction {
        const result: CodeAction = { title: item.title };
        const protocolCodeAction = ProtocolCodeAction.is(item) ? item : undefined;
        if (Is.number(item.kind)) {
            result.kind = item.kind;
        }
        if (item.diagnostics) {
            result.diagnostics = this.asDiagnostics(item.diagnostics);
        }
        if (item.edit) {
            throw new Error('VS Code code actions can only be converted to a protocol code action without an edit.');
        }
        if (item.command) {
            result.command = this.asCommand(item.command);
        }
        if (item.isPreferred !== undefined) {
            result.isPreferred = item.isPreferred;
        }
        if (item.disabled) {
            result.disabled = { reason: item.disabled };
        }
        if (protocolCodeAction) {
            if (protocolCodeAction.data !== undefined) {
                result.data = protocolCodeAction.data;
            }
        }
        return result;
    }

    asInlayHintLabelPart (part: monaco.languages.InlayHintLabelPart): InlayHintLabelPart {
        return {
            value: part.label,
            command: this.asCommand(part.command),
            location: this.asLocation(part.location),
            tooltip: this.asMarkupContent(part.tooltip)
        };
    }

    asInlayHintLabel (label: string | monaco.languages.InlayHintLabelPart[]): string | InlayHintLabelPart[] {
        if (Array.isArray(label)) {
            return label.map(part => this.asInlayHintLabelPart(part));
        }
        return label;
    }

    asInlayHint (item: monaco.languages.InlayHint): InlayHint {
        const result = InlayHint.create(
            this.asPosition(item.position.lineNumber, item.position.column),
            this.asInlayHintLabel(item.label),
            item.kind
        );
        if (ProtocolInlayHint.is(item)) {
            if (item.data) { result.data = item.data; }
        }
        return result;
    }
}

/**
 * @deprecated use @CodinGame/monaco-vscode-api and vscode-languageclient/lib/common/protocolConverter (see browser example)
 */
export class ProtocolToMonacoConverter {
    public constructor (protected readonly _monaco: typeof monaco) { }

    asResourceEdits (resource: monaco.Uri, edits: (TextEdit | AnnotatedTextEdit)[], asMetadata: (annotation: ls.ChangeAnnotationIdentifier | undefined) => monaco.languages.WorkspaceEditMetadata | undefined, modelVersionId?: number): monaco.languages.WorkspaceTextEdit[] {
        return edits.map(edit => ({
            resource,
            edit: this.asTextEdit(edit),
            modelVersionId,
            metadata: AnnotatedTextEdit.is(edit) ? asMetadata(edit.annotationId) : undefined
        }));
    }

    asWorkspaceEditMetadata (changeAnnotation: ChangeAnnotation): monaco.languages.WorkspaceEditMetadata {
        return {
            needsConfirmation: changeAnnotation.needsConfirmation === true,
            label: changeAnnotation.label,
            description: changeAnnotation.description
        };
    }

    asWorkspaceEdit(item: WorkspaceEdit): monaco.languages.WorkspaceEdit;
    asWorkspaceEdit(item: undefined | null): undefined;
    asWorkspaceEdit(item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined;
    asWorkspaceEdit (item: WorkspaceEdit | undefined | null): monaco.languages.WorkspaceEdit | undefined {
        if (!item) {
            return undefined;
        }
        const sharedMetadata: Map<string, monaco.languages.WorkspaceEditMetadata> = new Map();
        if (item.changeAnnotations !== undefined) {
            for (const key of Object.keys(item.changeAnnotations)) {
                const metaData = this.asWorkspaceEditMetadata(item.changeAnnotations[key]);
                sharedMetadata.set(key, metaData);
            }
        }
        const asMetadata = (annotation: ls.ChangeAnnotationIdentifier | undefined): monaco.languages.WorkspaceEditMetadata | undefined => {
            if (annotation === undefined) {
                return undefined;
            } else {
                return sharedMetadata.get(annotation);
            }
        };
        const edits: (monaco.languages.WorkspaceTextEdit | monaco.languages.WorkspaceFileEdit)[] = [];
        if (item.documentChanges) {
            item.documentChanges.forEach(change => {
                if (ls.CreateFile.is(change)) {
                    edits.push(<monaco.languages.WorkspaceFileEdit>{
                        newUri: this._monaco.Uri.parse(change.uri),
                        options: change.options,
                        metadata: asMetadata(change.annotationId)
                    });
                } else if (ls.RenameFile.is(change)) {
                    edits.push(<monaco.languages.WorkspaceFileEdit>{
                        oldUri: this._monaco.Uri.parse(change.oldUri),
                        newUri: this._monaco.Uri.parse(change.newUri),
                        options: change.options,
                        metadata: asMetadata(change.annotationId)
                    });
                } else if (ls.DeleteFile.is(change)) {
                    edits.push(<monaco.languages.WorkspaceFileEdit>{
                        oldUri: this._monaco.Uri.parse(change.uri),
                        options: change.options,
                        metadata: asMetadata(change.annotationId)
                    });
                } else if (ls.TextDocumentEdit.is(change)) {
                    const resource = this._monaco.Uri.parse(change.textDocument.uri);
                    const version = typeof change.textDocument.version === 'number' ? change.textDocument.version : undefined;
                    edits.push(...this.asResourceEdits(resource, change.edits, asMetadata, version));
                } else {
                    console.error(`Unknown workspace edit change received:\n${JSON.stringify(change, undefined, 4)}`);
                }
            });
        } else if (item.changes) {
            for (const key of Object.keys(item.changes)) {
                const resource = this._monaco.Uri.parse(key);
                edits.push(...this.asResourceEdits(resource, item.changes[key], asMetadata));
            }
        }
        return {
            edits
        };
    }

    asTextEdit(edit: TextEdit): monaco.languages.TextEdit;
    asTextEdit(edit: undefined | null): undefined;
    asTextEdit(edit: TextEdit | undefined | null): undefined;
    asTextEdit (edit: TextEdit | undefined | null): monaco.languages.TextEdit | undefined {
        if (!edit) {
            return undefined;
        }
        const range = this.asRange(edit.range)!;
        return {
            range,
            text: edit.newText
        };
    }

    asTextEdits(items: TextEdit[]): monaco.languages.TextEdit[];
    asTextEdits(items: undefined | null): undefined;
    asTextEdits(items: TextEdit[] | undefined | null): monaco.languages.TextEdit[] | undefined;
    asTextEdits (items: TextEdit[] | undefined | null): monaco.languages.TextEdit[] | undefined {
        if (!items) {
            return undefined;
        }
        return items.map(item => this.asTextEdit(item));
    }

    asCodeLens(item: CodeLens): monaco.languages.CodeLens;
    asCodeLens(item: undefined | null): undefined;
    asCodeLens(item: CodeLens | undefined | null): monaco.languages.CodeLens | undefined;
    asCodeLens (item: CodeLens | undefined | null): monaco.languages.CodeLens | undefined {
        if (!item) {
            return undefined;
        }
        const range = this.asRange(item.range);
        const result = <ProtocolCodeLens>{ range };
        if (item.command) { result.command = this.asCommand(item.command); }
        if (item.data !== void 0 && item.data !== null) { result.data = item.data; }
        return result;
    }

    asCodeLensList(items: CodeLens[]): monaco.languages.CodeLensList;
    asCodeLensList(items: undefined | null): undefined;
    asCodeLensList(items: CodeLens[] | undefined | null): monaco.languages.CodeLensList | undefined;
    asCodeLensList (items: CodeLens[] | undefined | null): monaco.languages.CodeLensList | undefined {
        if (!items) {
            return undefined;
        }
        return {
            lenses: items.map((codeLens) => this.asCodeLens(codeLens)),
            dispose: () => { }
        };
    }

    asCodeActionList (actions: (Command | CodeAction)[]): monaco.languages.CodeActionList {
        return {
            actions: actions.map(action => this.asCodeAction(action)),
            dispose: () => { }
        };
    }

    asCodeAction (item: Command | CodeAction): ProtocolCodeAction {
        if (Command.is(item)) {
            return {
                command: {
                    id: item.command,
                    title: item.title,
                    arguments: item.arguments
                },
                title: item.title
            };
        }
        return {
            title: item.title,
            command: this.asCommand(item.command),
            edit: this.asWorkspaceEdit(item.edit),
            diagnostics: this.asDiagnostics(item.diagnostics),
            kind: item.kind,
            disabled: item.disabled ? item.disabled.reason : undefined,
            isPreferred: item.isPreferred,
            data: item.data
        };
    }

    asCommand(command: Command): monaco.languages.Command;
    asCommand(command: undefined): undefined;
    asCommand(command: Command | undefined): monaco.languages.Command | undefined;
    asCommand (command: Command | undefined): monaco.languages.Command | undefined {
        if (!command) {
            return undefined;
        }
        return {
            id: command.command,
            title: command.title,
            arguments: command.arguments
        };
    }

    asDocumentSymbol (value: DocumentSymbol): monaco.languages.DocumentSymbol {
        const children = value.children && value.children.map(c => this.asDocumentSymbol(c));
        return {
            name: value.name,
            detail: value.detail || '',
            kind: this.asSymbolKind(value.kind),
            tags: value.tags || [],
            range: this.asRange(value.range),
            selectionRange: this.asRange(value.selectionRange),
            children
        };
    }

    asDocumentSymbols (values: SymbolInformation[] | DocumentSymbol[]): monaco.languages.DocumentSymbol[] {
        if (DocumentSymbol.is(values[0])) {
            return (values as DocumentSymbol[]).map(s => this.asDocumentSymbol(s));
        }
        return this.asSymbolInformations(values as SymbolInformation[]);
    }

    asSymbolInformations(values: SymbolInformation[], uri?: monaco.Uri): monaco.languages.DocumentSymbol[];
    asSymbolInformations(values: undefined | null, uri?: monaco.Uri): undefined;
    asSymbolInformations(values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.DocumentSymbol[] | undefined;
    asSymbolInformations (values: SymbolInformation[] | undefined | null, uri?: monaco.Uri): monaco.languages.DocumentSymbol[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(information => this.asSymbolInformation(information, uri));
    }

    asSymbolInformation (item: SymbolInformation, uri?: monaco.Uri): monaco.languages.DocumentSymbol {
        const location = this.asLocation(uri ? { ...item.location, uri: uri.toString() } : item.location);
        return {
            name: item.name,
            detail: '',
            containerName: item.containerName,
            kind: this.asSymbolKind(item.kind),
            tags: item.tags || [],
            range: location.range,
            selectionRange: location.range
        };
    }

    asSymbolKind (item: SymbolKind): monaco.languages.SymbolKind {
        if (item <= SymbolKind.TypeParameter) {
            // Symbol kind is one based in the protocol and zero based in code.
            return item - 1;
        }
        return this._monaco.languages.SymbolKind.Property;
    }

    asDocumentHighlights(values: DocumentHighlight[]): monaco.languages.DocumentHighlight[];
    asDocumentHighlights(values: undefined | null): undefined;
    asDocumentHighlights(values: DocumentHighlight[] | undefined | null): monaco.languages.DocumentHighlight[] | undefined;
    asDocumentHighlights (values: DocumentHighlight[] | undefined | null): monaco.languages.DocumentHighlight[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(item => this.asDocumentHighlight(item));
    }

    asDocumentHighlight (item: DocumentHighlight): monaco.languages.DocumentHighlight {
        const range = this.asRange(item.range)!;
        const kind = Is.number(item.kind) ? this.asDocumentHighlightKind(item.kind) : undefined!;
        return { range, kind };
    }

    asDocumentHighlightKind (item: number): monaco.languages.DocumentHighlightKind {
        switch (item) {
            case DocumentHighlightKind.Text:
                return this._monaco.languages.DocumentHighlightKind.Text;
            case DocumentHighlightKind.Read:
                return this._monaco.languages.DocumentHighlightKind.Read;
            case DocumentHighlightKind.Write:
                return this._monaco.languages.DocumentHighlightKind.Write;
        }
        return this._monaco.languages.DocumentHighlightKind.Text;
    }

    asReferences(values: Location[]): monaco.languages.Location[];
    asReferences(values: undefined | null): monaco.languages.Location[] | undefined;
    asReferences(values: Location[] | undefined | null): monaco.languages.Location[] | undefined;
    asReferences (values: Location[] | undefined | null): monaco.languages.Location[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(location => this.asLocation(location));
    }

    asDefinitionResult(item: Definition): monaco.languages.Definition;
    asDefinitionResult(item: DefinitionLink[]): monaco.languages.Definition;
    asDefinitionResult(item: undefined | null): undefined;
    asDefinitionResult(item: Definition | DefinitionLink[] | undefined | null): monaco.languages.Definition | undefined;
    asDefinitionResult (item: Definition | DefinitionLink[] | undefined | null): monaco.languages.Definition | undefined {
        if (!item) {
            return undefined;
        }
        if (Is.array(item)) {
            if (item.length === 0) {
                return undefined;
            } else if (LocationLink.is(item[0])) {
                const links: LocationLink[] = item as LocationLink[];
                return links.map((location) => this.asLocationLink(location));
            } else {
                const locations: Location[] = item as Location[];
                return locations.map((location) => this.asLocation(location));
            }
        } else {
            return this.asLocation(item);
        }
    }

    asLocation(item: Location): monaco.languages.Location;
    asLocation(item: undefined | null): undefined;
    asLocation(item: Location | undefined | null): monaco.languages.Location | undefined;
    asLocation (item: Location | undefined | null): monaco.languages.Location | undefined {
        if (!item) {
            return undefined;
        }
        const uri = this._monaco.Uri.parse(item.uri);
        const range = this.asRange(item.range)!;
        return {
            uri, range
        };
    }

    asLocationLink(item: undefined | null): undefined;
    asLocationLink(item: ls.LocationLink): monaco.languages.LocationLink;
    asLocationLink (item: ls.LocationLink | undefined | null): monaco.languages.LocationLink | undefined {
        if (!item) {
            return undefined;
        }
        const result: monaco.languages.LocationLink = {
            uri: this._monaco.Uri.parse(item.targetUri),
            range: this.asRange(item.targetSelectionRange)!, // See issue: https://github.com/Microsoft/vscode/issues/58649
            originSelectionRange: this.asRange(item.originSelectionRange),
            targetSelectionRange: this.asRange(item.targetSelectionRange)
        };
        if (!result.targetSelectionRange) {
            throw new Error('targetSelectionRange must not be undefined or null');
        }
        return result;
    }

    asSignatureHelpResult(item: undefined | null): undefined;
    asSignatureHelpResult(item: SignatureHelp): monaco.languages.SignatureHelpResult;
    asSignatureHelpResult(item: SignatureHelp | undefined | null): monaco.languages.SignatureHelpResult | undefined;
    asSignatureHelpResult (item: SignatureHelp | undefined | null): monaco.languages.SignatureHelpResult | undefined {
        if (!item) {
            return undefined;
        }
        const result = <monaco.languages.SignatureHelp>{};
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
            dispose: () => { }
        };
    }

    asSignatureInformations (items: SignatureInformation[]): monaco.languages.SignatureInformation[] {
        return items.map(item => this.asSignatureInformation(item));
    }

    asSignatureInformation (item: SignatureInformation): monaco.languages.SignatureInformation {
        const result = <monaco.languages.SignatureInformation>{ label: item.label };
        if (item.documentation) { result.documentation = this.asDocumentation(item.documentation); }
        if (item.parameters) {
            result.parameters = this.asParameterInformations(item.parameters);
        } else {
            result.parameters = [];
        }
        if (item.activeParameter) { result.activeParameter = item.activeParameter; }
        return result;
    }

    asParameterInformations (item: ParameterInformation[]): monaco.languages.ParameterInformation[] {
        return item.map(item => this.asParameterInformation(item));
    }

    asParameterInformation (item: ParameterInformation): monaco.languages.ParameterInformation {
        const result = <monaco.languages.ParameterInformation>{ label: item.label };
        if (item.documentation) { result.documentation = this.asDocumentation(item.documentation); }
        return result;
    }

    asHover(hover: Hover): monaco.languages.Hover;
    asHover(hover: undefined | null): undefined;
    asHover(hover: Hover | undefined | null): monaco.languages.Hover | undefined;
    asHover (hover: Hover | undefined | null): monaco.languages.Hover | undefined {
        if (!hover) {
            return undefined;
        }
        return {
            contents: this.asHoverContent(hover.contents),
            range: this.asRange(hover.range)
        };
    }

    asHoverContent (contents: MarkedString | MarkedString[] | MarkupContent): monaco.IMarkdownString[] {
        if (Array.isArray(contents)) {
            return contents.map(content => this.asMarkdownString(content));
        }
        return [this.asMarkdownString(contents)];
    }

    asDocumentation (value: string | MarkupContent): string | monaco.IMarkdownString {
        if (Is.string(value)) {
            return value;
        }
        if (value.kind === MarkupKind.PlainText) {
            return value.value;
        }
        return this.asMarkdownString(value);
    }

    asMarkdownString (content: MarkedString | MarkupContent): monaco.IMarkdownString {
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

    asSeverity (severity?: ls.DiagnosticSeverity): monaco.MarkerSeverity {
        if (severity === 1) {
            return this._monaco.MarkerSeverity.Error;
        }
        if (severity === 2) {
            return this._monaco.MarkerSeverity.Warning;
        }
        if (severity === 3) {
            return this._monaco.MarkerSeverity.Info;
        }
        return this._monaco.MarkerSeverity.Hint;
    }

    asDiagnostics(diagnostics: undefined): undefined;
    asDiagnostics(diagnostics: Diagnostic[]): monaco.editor.IMarkerData[];
    asDiagnostics(diagnostics: Diagnostic[] | undefined): monaco.editor.IMarkerData[] | undefined;
    asDiagnostics (diagnostics: Diagnostic[] | undefined): monaco.editor.IMarkerData[] | undefined {
        if (!diagnostics) {
            return undefined;
        }
        return diagnostics.map(diagnostic => this.asDiagnostic(diagnostic));
    }

    asDiagnostic (diagnostic: Diagnostic): monaco.editor.IMarkerData {
        return {
            code: typeof diagnostic.code === 'number' ? diagnostic.code.toString() : diagnostic.code,
            severity: this.asSeverity(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source,
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            relatedInformation: this.asRelatedInformations(diagnostic.relatedInformation),
            tags: diagnostic.tags
        };
    }

    asRelatedInformations (relatedInformation?: DiagnosticRelatedInformation[]): monaco.editor.IRelatedInformation[] | undefined {
        if (!relatedInformation) {
            return undefined;
        }
        return relatedInformation.map(item => this.asRelatedInformation(item));
    }

    asRelatedInformation (relatedInformation: DiagnosticRelatedInformation): monaco.editor.IRelatedInformation {
        return {
            resource: this._monaco.Uri.parse(relatedInformation.location.uri),
            startLineNumber: relatedInformation.location.range.start.line + 1,
            startColumn: relatedInformation.location.range.start.character + 1,
            endLineNumber: relatedInformation.location.range.end.line + 1,
            endColumn: relatedInformation.location.range.end.character + 1,
            message: relatedInformation.message
        };
    }

    asCompletionResult (result: CompletionItem[] | CompletionList | null | undefined, defaultMonacoRange: monaco.IRange): monaco.languages.CompletionList {
        if (!result) {
            return {
                incomplete: false,
                suggestions: []
            };
        }
        if (Array.isArray(result)) {
            const suggestions = result.map(item => this.asCompletionItem(item, defaultMonacoRange, defaultRange));
            return {
                incomplete: false,
                suggestions
            };
        }
        const defaultRange = this.getCompletionItemDefaultRange(result);
        return {
            incomplete: result.isIncomplete,
            suggestions: result.items.map(item => this.asCompletionItem(item, defaultMonacoRange, defaultRange, result.itemDefaults))
        };
    }

    asCompletionItem (item: CompletionItem, defaultMonacoRange: monaco.IRange | RangeReplace, defaultRange?: monaco.IRange | RangeReplace, itemDefaults?: CompletionList['itemDefaults']): ProtocolCompletionItem {
        const result = <ProtocolCompletionItem>{ label: this.asCompletionItemLabel(item) };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) {
            result.documentation = this.asDocumentation(item.documentation);
            result.documentationFormat = Is.string(item.documentation) ? undefined : item.documentation.kind;
        }
        if (item.filterText) { result.filterText = item.filterText; }
        const insertText = this.asCompletionInsertText(item, defaultRange, itemDefaults?.insertTextFormat);
        result.insertText = insertText.insertText;
        result.range = insertText.range ?? defaultMonacoRange;
        result.fromEdit = insertText.fromEdit;
        if (insertText.isSnippet) {
            result.insertTextRules = this._monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
        }
        if (Is.number(item.kind)) {
            const [itemKind, original] = this.asCompletionItemKind(item.kind);
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
        const data = item.data ?? itemDefaults?.data;
        if (data !== undefined) { result.data = data; }
        if (item.deprecated === true || item.deprecated === false) {
            result.deprecated = item.deprecated;
        }
        const insertTextMode = item.insertTextMode ?? itemDefaults?.insertTextMode;
        if (insertTextMode) { result.insertTextMode = insertTextMode; }
        if (item.tags) { result.tags = item.tags; }
        return result;
    }

    getCompletionItemDefaultRange (list: CompletionList): monaco.Range | RangeReplace | undefined {
        const rangeDefaults = list.itemDefaults?.editRange;
        return ls.Range.is(rangeDefaults)
            ? this.asRange(rangeDefaults)
            : rangeDefaults !== undefined
                ? { insert: this.asRange(rangeDefaults.insert), replace: this.asRange(rangeDefaults.replace) }
                : undefined;
    }

    asCompletionItemLabel (item: ls.CompletionItem): monaco.languages.CompletionItemLabel | string {
        if (ls.CompletionItemLabelDetails.is(item.labelDetails)) {
            return {
                label: item.label,
                detail: item.labelDetails.detail,
                description: item.labelDetails.description
            };
        } else {
            return item.label;
        }
    }

    asCompletionItemKind (value: CompletionItemKind): [monaco.languages.CompletionItemKind, CompletionItemKind | undefined] {
        if (CompletionItemKind.Text <= value && value <= CompletionItemKind.TypeParameter) {
            switch (value) {
                case CompletionItemKind.Text: return [this._monaco.languages.CompletionItemKind.Text, undefined];
                case CompletionItemKind.Method: return [this._monaco.languages.CompletionItemKind.Method, undefined];
                case CompletionItemKind.Function: return [this._monaco.languages.CompletionItemKind.Function, undefined];
                case CompletionItemKind.Constructor: return [this._monaco.languages.CompletionItemKind.Constructor, undefined];
                case CompletionItemKind.Field: return [this._monaco.languages.CompletionItemKind.Field, undefined];
                case CompletionItemKind.Variable: return [this._monaco.languages.CompletionItemKind.Variable, undefined];
                case CompletionItemKind.Class: return [this._monaco.languages.CompletionItemKind.Class, undefined];
                case CompletionItemKind.Interface: return [this._monaco.languages.CompletionItemKind.Interface, undefined];
                case CompletionItemKind.Module: return [this._monaco.languages.CompletionItemKind.Module, undefined];
                case CompletionItemKind.Property: return [this._monaco.languages.CompletionItemKind.Property, undefined];
                case CompletionItemKind.Unit: return [this._monaco.languages.CompletionItemKind.Unit, undefined];
                case CompletionItemKind.Value: return [this._monaco.languages.CompletionItemKind.Value, undefined];
                case CompletionItemKind.Enum: return [this._monaco.languages.CompletionItemKind.Enum, undefined];
                case CompletionItemKind.Keyword: return [this._monaco.languages.CompletionItemKind.Keyword, undefined];
                case CompletionItemKind.Snippet: return [this._monaco.languages.CompletionItemKind.Snippet, undefined];
                case CompletionItemKind.Color: return [this._monaco.languages.CompletionItemKind.Color, undefined];
                case CompletionItemKind.File: return [this._monaco.languages.CompletionItemKind.File, undefined];
                case CompletionItemKind.Reference: return [this._monaco.languages.CompletionItemKind.Reference, undefined];
                case CompletionItemKind.Folder: return [this._monaco.languages.CompletionItemKind.Folder, undefined];
                case CompletionItemKind.EnumMember: return [this._monaco.languages.CompletionItemKind.EnumMember, undefined];
                case CompletionItemKind.Constant: return [this._monaco.languages.CompletionItemKind.Constant, undefined];
                case CompletionItemKind.Struct: return [this._monaco.languages.CompletionItemKind.Struct, undefined];
                case CompletionItemKind.Event: return [this._monaco.languages.CompletionItemKind.Event, undefined];
                case CompletionItemKind.Operator: return [this._monaco.languages.CompletionItemKind.Operator, undefined];
                case CompletionItemKind.TypeParameter: return [this._monaco.languages.CompletionItemKind.TypeParameter, undefined];
                default: return [value - 1, undefined];
            }
        }
        return [CompletionItemKind.Text, value];
    }

    asCompletionInsertText (item: CompletionItem, defaultRange?: monaco.IRange | RangeReplace, defaultInsertTextFormat?: InsertTextFormat): { insertText: string, range?: monaco.IRange | RangeReplace, fromEdit: boolean, isSnippet: boolean } {
        const insertTextFormat = item.insertTextFormat ?? defaultInsertTextFormat;

        const isSnippet = insertTextFormat === InsertTextFormat.Snippet;
        if (item.textEdit !== undefined || defaultRange !== undefined) {
            const [range, newText] = item.textEdit !== undefined
                ? this.getCompletionRangeAndText(item.textEdit)
                : [defaultRange, item.textEditText ?? item.label];

            return { insertText: newText, range, fromEdit: true, isSnippet };
        } else if (item.insertText) {
            return { isSnippet, insertText: item.insertText, fromEdit: false, range: defaultRange };
        }
        return { insertText: item.label, range: defaultRange, fromEdit: false, isSnippet: false };
    }

    getCompletionRangeAndText (value: ls.TextEdit | ls.InsertReplaceEdit): [monaco.Range | RangeReplace, string] {
        if (ls.InsertReplaceEdit.is(value)) {
            return [{ insert: this.asRange(value.insert), replace: this.asRange(value.replace) }, value.newText];
        } else {
            return [this.asRange(value.range), value.newText];
        }
    }

    asDocumentLinks (documentLinks: DocumentLink[]): monaco.languages.ILinksList {
        const links = documentLinks.map(link => this.asDocumentLink(link));
        return { links };
    }

    asDocumentLink (documentLink: DocumentLink): ProtocolDocumentLink {
        return {
            range: this.asRange(documentLink.range),
            url: documentLink.target,
            data: documentLink.data,
            tooltip: documentLink.tooltip
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
    asRange (range: RecursivePartial<Range> | undefined | null): monaco.Range | Partial<monaco.IRange> | undefined | null {
        if (range === undefined) {
            return undefined;
        }
        if (range === null) {
            return null;
        }
        const start = this.asPosition(range.start);
        const end = this.asPosition(range.end);
        if (start instanceof this._monaco.Position && end instanceof this._monaco.Position) {
            return new this._monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
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
    asPosition (position: Partial<Position> | undefined | null): monaco.Position | Partial<monaco.IPosition> | undefined | null {
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
            return new this._monaco.Position(lineNumber, column);
        }
        return { lineNumber, column };
    }

    asColorInformations (items: ColorInformation[]): monaco.languages.IColorInformation[] {
        return items.map(item => this.asColorInformation(item));
    }

    asColorInformation (item: ColorInformation): monaco.languages.IColorInformation {
        return {
            range: this.asRange(item.range),
            color: item.color
        };
    }

    asColorPresentations (items: ColorPresentation[]): monaco.languages.IColorPresentation[] {
        return items.map(item => this.asColorPresentation(item));
    }

    asColorPresentation (item: ColorPresentation): monaco.languages.IColorPresentation {
        return {
            label: item.label,
            textEdit: this.asTextEdit(item.textEdit),
            additionalTextEdits: this.asTextEdits(item.additionalTextEdits)
        };
    }

    asFoldingRanges(items: undefined | null): undefined | null;
    asFoldingRanges(items: FoldingRange[]): monaco.languages.FoldingRange[];
    asFoldingRanges (items: FoldingRange[] | undefined | null): monaco.languages.FoldingRange[] | undefined | null {
        if (!items) {
            return items;
        }
        return items.map(item => this.asFoldingRange(item));
    }

    asFoldingRange (item: FoldingRange): monaco.languages.FoldingRange {
        return {
            start: item.startLine + 1,
            end: item.endLine + 1,
            kind: this.asFoldingRangeKind(item.kind)
        };
    }

    asFoldingRangeKind (kind?: string): monaco.languages.FoldingRangeKind | undefined {
        if (kind) {
            switch (kind) {
                case FoldingRangeKind.Comment:
                    return this._monaco.languages.FoldingRangeKind.Comment;
                case FoldingRangeKind.Imports:
                    return this._monaco.languages.FoldingRangeKind.Imports;
                case FoldingRangeKind.Region:
                    return this._monaco.languages.FoldingRangeKind.Region;
            }
        }
        return undefined;
    }

    asSemanticTokens (semanticTokens: SemanticTokens): monaco.languages.SemanticTokens {
        return {
            resultId: semanticTokens.resultId,
            data: Uint32Array.from(semanticTokens.data)
        };
    }

    asInlayHintLabelPart (part: InlayHintLabelPart): monaco.languages.InlayHintLabelPart {
        return {
            label: part.value,
            command: this.asCommand(part.command),
            location: this.asLocation(part.location),
            tooltip: part.tooltip && this.asMarkdownString(part.tooltip)
        };
    }

    asInlayHintLabel (label: string | InlayHintLabelPart[]): string | monaco.languages.InlayHintLabelPart[] {
        if (Array.isArray(label)) {
            return label.map(part => this.asInlayHintLabelPart(part));
        }
        return label;
    }

    asInlayHint (inlayHint: InlayHint): ProtocolInlayHint {
        return {
            data: inlayHint.data,
            label: this.asInlayHintLabel(inlayHint.label),
            position: this.asPosition(inlayHint.position),
            kind: inlayHint.kind,
            paddingLeft: inlayHint.paddingLeft,
            paddingRight: inlayHint.paddingRight,
            tooltip: inlayHint.tooltip && this.asMarkdownString(inlayHint.tooltip)
        };
    }

    asInlayHintList(items: InlayHint[]): monaco.languages.InlayHintList;
    asInlayHintList(items: undefined | null): undefined;
    asInlayHintList(items: InlayHint[] | undefined | null): monaco.languages.InlayHintList | undefined;
    asInlayHintList (items: InlayHint[] | undefined | null): monaco.languages.InlayHintList | undefined {
        if (!items) {
            return undefined;
        }
        return {
            hints: items.map((hint) => this.asInlayHint(hint)),
            dispose: () => { }
        };
    }
}
