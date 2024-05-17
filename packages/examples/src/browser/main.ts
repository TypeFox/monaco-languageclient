/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import { getLanguageService, TextDocument } from 'vscode-json-languageservice';
import { createConverter as createCodeConverter } from 'vscode-languageclient/lib/common/codeConverter.js';
import { createConverter as createProtocolConverter } from 'vscode-languageclient/lib/common/protocolConverter.js';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runBrowserEditor = async () => {
    const codeConverter = createCodeConverter();
    const protocolConverter = createProtocolConverter(undefined, true, true);

    let mainVscodeDocument: vscode.TextDocument | undefined;
    const htmlElement = document.getElementById('monaco-editor-root');
    const languageId = 'json';
    const code = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
    const codeUri = '/workspace/model.json';

    const wrapper = new MonacoEditorLanguageClientWrapper();
    const jsonClientUserConfig: UserConfig = {
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride(),
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: code,
                        uri: codeUri
                    }
                },
                useDiffEditor: false,
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.guides.bracketPairsHorizontal': 'active',
                        'editor.lightbulb.enabled': 'On'
                    })
                }
            }
        }
    };
    await wrapper.init(jsonClientUserConfig);

    vscode.workspace.onDidOpenTextDocument((_event) => {
        mainVscodeDocument = _event;
    });

    const createDocument = (vscodeDocument: vscode.TextDocument) => {
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

    vscode.languages.registerCompletionItemProvider(languageId, {
        async provideCompletionItems(vscodeDocument, position, _token, _context) {
            const document = createDocument(vscodeDocument);
            const jsonDocument = jsonService.parseJSONDocument(document);
            const completionList = await jsonService.doComplete(document, codeConverter.asPosition(position), jsonDocument);
            return protocolConverter.asCompletionResult(completionList);
        },

        async resolveCompletionItem(item, _token) {
            return await jsonService.doResolve(codeConverter.asCompletionItem(item)).then(result => protocolConverter.asCompletionItem(result));
        }
    });

    vscode.languages.registerDocumentRangeFormattingEditProvider(languageId, {
        provideDocumentRangeFormattingEdits(vscodeDocument, range, options, _token) {
            const document = createDocument(vscodeDocument);
            const edits = jsonService.format(document, codeConverter.asRange(range), codeConverter.asFormattingOptions(options, {}));
            return protocolConverter.asTextEdits(edits);
        }
    });

    vscode.languages.registerDocumentSymbolProvider(languageId, {
        provideDocumentSymbols(vscodeDocument, _token) {
            const document = createDocument(vscodeDocument);
            const jsonDocument = jsonService.parseJSONDocument(document);
            return protocolConverter.asSymbolInformations(jsonService.findDocumentSymbols(document, jsonDocument));
        }
    });

    vscode.languages.registerHoverProvider(languageId, {
        async provideHover(vscodeDocument, position, _token) {
            const document = createDocument(vscodeDocument);
            const jsonDocument = jsonService.parseJSONDocument(document);
            return await jsonService.doHover(document, codeConverter.asPosition(position), jsonDocument).then((hover) => {
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

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('json');
    const doValidate = (document: TextDocument) => {
        if (document.getText().length === 0) {
            cleanDiagnostics();
            return;
        }
        const jsonDocument = jsonService.parseJSONDocument(document);

        jsonService.doValidation(document, jsonDocument).then(async (pDiagnostics) => {
            const diagnostics = await protocolConverter.asDiagnostics(pDiagnostics);
            diagnosticCollection.set(vscode.Uri.parse(codeUri), diagnostics);
        });
    };

    const cleanDiagnostics = () => {
        diagnosticCollection.clear();
    };

    await wrapper.start(htmlElement);

    wrapper.getTextModels()?.text?.onDidChangeContent(() => {
        validate();
    });
};
