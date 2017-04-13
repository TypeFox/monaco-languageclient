import * as is from 'vscode-languageclient/lib/utils/is';
import { TextDocumentPositionParams, ReferenceParams } from 'vscode-languageclient/lib/protocol';
import {
    Position, TextDocumentIdentifier, CompletionItem, CompletionList,
    InsertTextFormat, Range, Diagnostic, CompletionItemKind,
    Hover, SignatureHelp, SignatureInformation, ParameterInformation,
    Definition, Location, DocumentHighlight, DocumentHighlightKind
} from 'vscode-languageserver-types';
import IReadOnlyModel = monaco.editor.IReadOnlyModel;
import languages = monaco.languages;

export interface ProtocolCompletionItem extends languages.CompletionItem {
    data?: any;
    fromEdit?: boolean;
}

export namespace ProtocolCompletionItem {
    export function is(item: any): item is ProtocolCompletionItem {
        return !!item && 'data' in item;
    }
}

export class MonacoToProtocolConverter {
    asPosition(lineNumber: number, column: number): Position {
        return Position.create(lineNumber - 1, column - 1)
    }

    asRange(range: undefined): undefined;
    asRange(range: null): null;
    asRange(range: monaco.IRange): Range;
    asRange(range: monaco.IRange | undefined | null): Range | undefined | null {
        if (range === undefined) {
            return undefined
        }

        if (!range) {
            return null
        }

        return Range.create(
            this.asPosition(range.startLineNumber, range.startColumn),
            this.asPosition(range.endLineNumber, range.endColumn)
        )
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

    asCompletionItem(item: languages.CompletionItem): CompletionItem {
        const result: CompletionItem = { label: item.label };
        if (item.detail) { result.detail = item.detail; }
        if (item.documentation) { result.documentation = item.documentation; }
        if (item.filterText) { result.filterText = item.filterText; }
        this.fillPrimaryInsertText(result, item as ProtocolCompletionItem);
        // Protocol item kind is 1 based, codes item kind is zero based.
        if (is.number(item.kind)) {
            if (languages.CompletionItemKind.Text <= item.kind && item.kind <= languages.CompletionItemKind.Reference) {
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
}

export class ProtocolToMonacoConverter {

    asDocumentHighlights(values: DocumentHighlight[]): languages.DocumentHighlight[];
    asDocumentHighlights(values: undefined | null): undefined;
    asDocumentHighlights(values: DocumentHighlight[] | undefined | null): languages.DocumentHighlight[] | undefined;
    asDocumentHighlights(values: DocumentHighlight[] | undefined | null): languages.DocumentHighlight[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(item => this.asDocumentHighlight(item));
    }

    asDocumentHighlight(item: DocumentHighlight): languages.DocumentHighlight {
        const range = this.asRange(item.range)!;
        const kind = is.number(item.kind) ? this.asDocumentHighlightKind(item.kind) : undefined!;
        return { range, kind };
    }

    asDocumentHighlightKind(item: number): languages.DocumentHighlightKind {
        switch (item) {
            case DocumentHighlightKind.Text:
                return languages.DocumentHighlightKind.Text;
            case DocumentHighlightKind.Read:
                return languages.DocumentHighlightKind.Read;
            case DocumentHighlightKind.Write:
                return languages.DocumentHighlightKind.Write;
        }
        return languages.DocumentHighlightKind.Text;
    }

    asReferences(values: Location[]): languages.Location[];
    asReferences(values: undefined | null): languages.Location[] | undefined;
    asReferences(values: Location[] | undefined | null): languages.Location[] | undefined;
    asReferences(values: Location[] | undefined | null): languages.Location[] | undefined {
        if (!values) {
            return undefined;
        }
        return values.map(location => this.asLocation(location));
    }

    asDefinitionResult(item: Definition): languages.Definition;
    asDefinitionResult(item: undefined | null): undefined;
    asDefinitionResult(item: Definition | undefined | null): languages.Definition | undefined;
    asDefinitionResult(item: Definition | undefined | null): languages.Definition | undefined {
        if (!item) {
            return undefined;
        }
        if (is.array(item)) {
            return item.map((location) => this.asLocation(location));
        } else {
            return this.asLocation(item);
        }
    }

    asLocation(item: Location): languages.Location;
    asLocation(item: undefined | null): undefined;
    asLocation(item: Location | undefined | null): languages.Location | undefined;
    asLocation(item: Location | undefined | null): languages.Location | undefined {
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
    asSignatureHelp(item: SignatureHelp): languages.SignatureHelp;
    asSignatureHelp(item: SignatureHelp | undefined | null): languages.SignatureHelp | undefined;
    asSignatureHelp(item: SignatureHelp | undefined | null): languages.SignatureHelp | undefined {
        if (!item) {
            return undefined;
        }
        let result = <languages.SignatureHelp>{};
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

    asSignatureInformations(items: SignatureInformation[]): languages.SignatureInformation[] {
        return items.map(item => this.asSignatureInformation(item));
    }

    asSignatureInformation(item: SignatureInformation): languages.SignatureInformation {
        let result = <languages.SignatureInformation>{ label: item.label };
        if (item.documentation) { result.documentation = item.documentation; }
        if (item.parameters) { result.parameters = this.asParameterInformations(item.parameters); }
        return result;
    }

    asParameterInformations(item: ParameterInformation[]): languages.ParameterInformation[] {
        return item.map(item => this.asParameterInformation(item));
    }

    asParameterInformation(item: ParameterInformation): languages.ParameterInformation {
        let result = <languages.ParameterInformation>{ label: item.label };
        if (item.documentation) { result.documentation = item.documentation };
        return result;
    }

    asHover(hover: Hover): languages.Hover;
    asHover(hover: undefined | null): undefined;
    asHover(hover: Hover | undefined | null): languages.Hover | undefined;
    asHover(hover: Hover | undefined | null): languages.Hover | undefined {
        if (!hover) {
            return undefined;
        }
        const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
        return {
            contents,
            range: this.asRange(hover.range)!
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
            code: diagnostic.code as string,
            severity: this.asSeverity(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source,
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1
        }
    }

    asCompletionResult(result: CompletionItem[] | CompletionList | undefined): languages.CompletionItem[] | languages.CompletionList | undefined {
        if (!result) {
            return undefined;
        }
        if (Array.isArray(result)) {
            return result.map(item => this.asCompletionItem(item));
        }
        return <languages.CompletionList>{
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

    asCompletionInsertText(item: CompletionItem): { text: string | languages.SnippetString, range?: monaco.Range, fromEdit: boolean } | undefined {
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

    asRange(range: Range | undefined | null): monaco.Range | undefined | null {
        if (range === undefined) {
            return undefined;
        }
        if (!range) {
            return null;
        }
        return new monaco.Range(
            range.start.line + 1,
            range.start.character + 1,
            range.end.line + 1,
            range.end.character + 1
        );
    }

}
