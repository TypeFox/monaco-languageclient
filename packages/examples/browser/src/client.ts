/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'monaco-editor/esm/vs/editor/editor.all.js';

// support all editor features
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as vscode from 'vscode';

import { buildWorkerDefinition } from 'monaco-editor-workers';

import { getLanguageService, TextDocument } from 'vscode-json-languageservice';
import { createConverter as createCodeConverter } from 'vscode-languageclient/lib/common/codeConverter.js';
import { createConverter as createProtocolConverter } from 'vscode-languageclient/lib/common/protocolConverter.js';
import { StandaloneServices } from 'vscode/services';
import getMessageServiceOverride from 'vscode/service-override/messages';

StandaloneServices.initialize({
    ...getMessageServiceOverride(document.body)
});

buildWorkerDefinition('dist', new URL('', window.location.href).href, false);
const codeConverter = createCodeConverter();
const protocolConverter = createProtocolConverter(undefined, true, true);

const LANGUAGE_ID = 'json';
const MODEL_URI = 'inmemory://model.json';
const MONACO_URI = monaco.Uri.parse(MODEL_URI);

// register the JSON language with Monaco
monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.json', '.bowerrc', '.jshintrc', '.jscsrc', '.eslintrc', '.babelrc'],
    aliases: ['JSON', 'json'],
    mimetypes: ['application/json']
});

// create the Monaco editor
const value = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
const model = monaco.editor.createModel(value, LANGUAGE_ID, MONACO_URI);
monaco.editor.create(document.getElementById('container')!, {
    model,
    glyphMargin: true,
    lightbulb: {
        enabled: true
    }
});

const vscodeDocument = vscode.workspace.textDocuments[0];

function createDocument(vscodeDocument: vscode.TextDocument) {
    return TextDocument.create(MODEL_URI, vscodeDocument.languageId, vscodeDocument.version, vscodeDocument.getText());
}

function resolveSchema(url: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.open('GET', url, true);
        xhr.send();
    });
    return promise;
}

const jsonService = getLanguageService({
    schemaRequestService: resolveSchema
});
const pendingValidationRequests = new Map<string, number>();

vscode.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    async provideCompletionItems(vscodeDocument, position, _token, _context) {
        const document = createDocument(vscodeDocument);
        const jsonDocument = jsonService.parseJSONDocument(document);
        const completionList = await jsonService.doComplete(document, codeConverter.asPosition(position), jsonDocument);
        return protocolConverter.asCompletionResult(completionList);
    },

    resolveCompletionItem(item, _token) {
        return jsonService.doResolve(codeConverter.asCompletionItem(item)).then(result => protocolConverter.asCompletionItem(result));
    }
});

vscode.languages.registerDocumentRangeFormattingEditProvider(LANGUAGE_ID, {
    provideDocumentRangeFormattingEdits(vscodeDocument, range, options, _token) {
        const document = createDocument(vscodeDocument);
        const edits = jsonService.format(document, codeConverter.asRange(range), codeConverter.asFormattingOptions(options, {}));
        return protocolConverter.asTextEdits(edits);
    }
});

vscode.languages.registerDocumentSymbolProvider(LANGUAGE_ID, {
    provideDocumentSymbols(vscodeDocument, _token) {
        const document = createDocument(vscodeDocument);
        const jsonDocument = jsonService.parseJSONDocument(document);
        return protocolConverter.asSymbolInformations(jsonService.findDocumentSymbols(document, jsonDocument));
    }
});

vscode.languages.registerHoverProvider(LANGUAGE_ID, {
    provideHover(vscodeDocument, position, _token) {
        const document = createDocument(vscodeDocument);
        const jsonDocument = jsonService.parseJSONDocument(document);
        return jsonService.doHover(document, codeConverter.asPosition(position), jsonDocument).then((hover) => {
            return protocolConverter.asHover(hover)!;
        });
    }
});

model.onDidChangeContent((_event) => {
    validate();
});
validate();

function validate(): void {
    const document = createDocument(vscodeDocument);
    cleanPendingValidation(document);
    pendingValidationRequests.set(document.uri, window.setTimeout(() => {
        pendingValidationRequests.delete(document.uri);
        doValidate(document);
    }));
}

function cleanPendingValidation(document: TextDocument): void {
    const request = pendingValidationRequests.get(document.uri);
    if (request !== undefined) {
        window.clearTimeout(request);
        pendingValidationRequests.delete(document.uri);
    }
}

const diagnosticCollection = vscode.languages.createDiagnosticCollection('json');
function doValidate(document: TextDocument): void {
    if (document.getText().length === 0) {
        cleanDiagnostics();
        return;
    }
    const jsonDocument = jsonService.parseJSONDocument(document);

    jsonService.doValidation(document, jsonDocument).then(async (pDiagnostics) => {
        const diagnostics = await protocolConverter.asDiagnostics(pDiagnostics);
        diagnosticCollection.set(MONACO_URI, diagnostics);
    });
}

function cleanDiagnostics(): void {
    diagnosticCollection.clear();
}
