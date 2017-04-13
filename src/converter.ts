import * as is from 'vscode-languageclient/lib/utils/is';
import { TextDocumentPositionParams } from 'vscode-languageclient/lib/protocol';
import { Position, TextDocumentIdentifier, CompletionItem, CompletionList, InsertTextFormat, Range, Diagnostic, CompletionItemKind } from 'vscode-languageserver-types';
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
        }  else if (typeof source.insertText === 'string') {
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
}

export class ProtocolToMonacoConverter {

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
