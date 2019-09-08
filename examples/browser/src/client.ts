/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { getLanguageService, TextDocument } from "vscode-json-languageservice";
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient/lib/monaco-converter';

const LANGUAGE_ID = 'json';
const MODEL_URI = 'inmemory://model.json'
const MONACO_URI = monaco.Uri.parse(MODEL_URI);

// register the JSON language with Monaco
monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json'],
});

// create the Monaco editor
const value = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
monaco.editor.create(document.getElementById("container")!, {
    model: monaco.editor.createModel(value, LANGUAGE_ID, MONACO_URI),
    glyphMargin: true,
    lightbulb: {
        enabled: true
    }
});

function getModel(): monaco.editor.IModel {
    return monaco.editor.getModel(MONACO_URI) as monaco.editor.IModel;
}

function createDocument(model: monaco.editor.IReadOnlyModel) {
    return TextDocument.create(MODEL_URI, model.getModeId(), model.getVersionId(), model.getValue());
}

function resolveSchema(url: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.open("GET", url, true);
        xhr.send();
    });
    return promise;
}

const m2p = new MonacoToProtocolConverter();
const p2m = new ProtocolToMonacoConverter();
const jsonService = getLanguageService({
    schemaRequestService: resolveSchema
});
const pendingValidationRequests = new Map<string, number>();

monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    provideCompletionItems(model, position, context, token): monaco.Thenable<monaco.languages.CompletionList> {
        const document = createDocument(model);
        const wordUntil = model.getWordUntilPosition(position);
        const defaultRange = new monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
        const jsonDocument = jsonService.parseJSONDocument(document);
        return jsonService.doComplete(document, m2p.asPosition(position.lineNumber, position.column), jsonDocument).then((list) => {
            return p2m.asCompletionResult(list, defaultRange);
        });
    },

    resolveCompletionItem(model, position, item, token): monaco.languages.CompletionItem | monaco.Thenable<monaco.languages.CompletionItem> {
        return jsonService.doResolve(m2p.asCompletionItem(item)).then(result => p2m.asCompletionItem(result, item.range));
    }
});

monaco.languages.registerDocumentRangeFormattingEditProvider(LANGUAGE_ID, {
    provideDocumentRangeFormattingEdits(model, range, options, token): monaco.languages.TextEdit[] | monaco.Thenable<monaco.languages.TextEdit[]> {
        const document = createDocument(model);
        const edits = jsonService.format(document, m2p.asRange(range), m2p.asFormattingOptions(options));
        return p2m.asTextEdits(edits);
    }
});

monaco.languages.registerDocumentSymbolProvider(LANGUAGE_ID, {
    provideDocumentSymbols(model, token): monaco.languages.DocumentSymbol[] | monaco.Thenable<monaco.languages.DocumentSymbol[]> {
        const document = createDocument(model);
        const jsonDocument = jsonService.parseJSONDocument(document);
        return p2m.asSymbolInformations(jsonService.findDocumentSymbols(document, jsonDocument));
    }
});

monaco.languages.registerHoverProvider(LANGUAGE_ID, {
    provideHover(model, position, token): monaco.languages.Hover | monaco.Thenable<monaco.languages.Hover> {
        const document = createDocument(model);
        const jsonDocument = jsonService.parseJSONDocument(document);
        return jsonService.doHover(document, m2p.asPosition(position.lineNumber, position.column), jsonDocument).then((hover) => {
            return p2m.asHover(hover)!;
        });
    }
});

getModel().onDidChangeContent((event) => {
    validate();
});

function validate(): void {
    const document = createDocument(getModel());
    cleanPendingValidation(document);
    pendingValidationRequests.set(document.uri, setTimeout(() => {
        pendingValidationRequests.delete(document.uri);
        doValidate(document);
    }));
}

function cleanPendingValidation(document: TextDocument): void {
    const request = pendingValidationRequests.get(document.uri);
    if (request !== undefined) {
        clearTimeout(request);
        pendingValidationRequests.delete(document.uri);
    }
}

function doValidate(document: TextDocument): void {
    if (document.getText().length === 0) {
        cleanDiagnostics();
        return;
    }
    const jsonDocument = jsonService.parseJSONDocument(document);
    jsonService.doValidation(document, jsonDocument).then((diagnostics) => {
        const markers = p2m.asDiagnostics(diagnostics);
        monaco.editor.setModelMarkers(getModel(), 'default', markers);
    });
}

function cleanDiagnostics(): void {
    monaco.editor.setModelMarkers(getModel(), 'default', []);
}
