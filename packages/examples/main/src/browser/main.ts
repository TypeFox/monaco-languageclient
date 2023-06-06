/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { languages, workspace, TextDocument as VsCodeTextDocument } from 'vscode';
import { getLanguageService, TextDocument } from 'vscode-json-languageservice';
import { createConverter as createCodeConverter } from 'vscode-languageclient/lib/common/codeConverter.js';
import { createConverter as createProtocolConverter } from 'vscode-languageclient/lib/common/protocolConverter.js';
import { createDefaultJsonContent, createJsonEditor } from '../common.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const codeConverter = createCodeConverter();
const protocolConverter = createProtocolConverter(undefined, true, true);

const createEditor = async () => {
    let mainVscodeDocument: VsCodeTextDocument | undefined;
    const languageId = 'json';
    const jsonEditor = await createJsonEditor({
        htmlElement: document.getElementById('container')!,
        content: createDefaultJsonContent(),
        init: true
    });

    const createDocument = (vscodeDocument: VsCodeTextDocument) => {
        return TextDocument.create(vscodeDocument.uri.toString(), vscodeDocument.languageId, vscodeDocument.version, vscodeDocument.getText());
    };

    const resolveSchema = (url: string): Promise<string> => {
        const promise = new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.responseText);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.open('GET', url, true);
            xhr.send();
        });
        return promise;
    };

    const jsonService = getLanguageService({
        schemaRequestService: resolveSchema
    });
    const pendingValidationRequests = new Map<string, number>();

    languages.registerCompletionItemProvider(languageId, {
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

    languages.registerDocumentRangeFormattingEditProvider(languageId, {
        provideDocumentRangeFormattingEdits(vscodeDocument, range, options, _token) {
            const document = createDocument(vscodeDocument);
            const edits = jsonService.format(document, codeConverter.asRange(range), codeConverter.asFormattingOptions(options, {}));
            return protocolConverter.asTextEdits(edits);
        }
    });

    languages.registerDocumentSymbolProvider(languageId, {
        provideDocumentSymbols(vscodeDocument, _token) {
            const document = createDocument(vscodeDocument);
            const jsonDocument = jsonService.parseJSONDocument(document);
            return protocolConverter.asSymbolInformations(jsonService.findDocumentSymbols(document, jsonDocument));
        }
    });

    languages.registerHoverProvider(languageId, {
        provideHover(vscodeDocument, position, _token) {
            const document = createDocument(vscodeDocument);
            const jsonDocument = jsonService.parseJSONDocument(document);
            return jsonService.doHover(document, codeConverter.asPosition(position), jsonDocument).then((hover) => {
                return protocolConverter.asHover(hover)!;
            });
        }
    });

    const validate = () => {
        const document = createDocument(mainVscodeDocument!);
        cleanPendingValidation(document);
        pendingValidationRequests.set(document.uri, window.setTimeout(() => {
            pendingValidationRequests.delete(document.uri);
            doValidate(document);
        }));
    };

    const cleanPendingValidation = (document: TextDocument) => {
        const request = pendingValidationRequests.get(document.uri);
        if (request !== undefined) {
            window.clearTimeout(request);
            pendingValidationRequests.delete(document.uri);
        }
    };

    const diagnosticCollection = languages.createDiagnosticCollection('json');
    const doValidate = (document: TextDocument) => {
        if (document.getText().length === 0) {
            cleanDiagnostics();
            return;
        }
        const jsonDocument = jsonService.parseJSONDocument(document);

        jsonService.doValidation(document, jsonDocument).then(async (pDiagnostics) => {
            const diagnostics = await protocolConverter.asDiagnostics(pDiagnostics);
            diagnosticCollection.set(jsonEditor.uri, diagnostics);
        });
    };

    const cleanDiagnostics = () => {
        diagnosticCollection.clear();
    };

    jsonEditor.modelRef.object.textEditorModel!.onDidChangeContent(() => {
        validate();
    });

    workspace.onDidOpenTextDocument((_event) => {
        mainVscodeDocument = workspace.textDocuments[0];
        validate();
    });
};

createEditor();
