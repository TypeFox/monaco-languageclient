/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import * as vscode from 'vscode';
import { createConfiguredEditor, createModelReference, IReference, ITextFileEditorModel } from 'vscode/monaco';
import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import { getLanguageService, TextDocument } from 'vscode-json-languageservice';
import { createConverter as createCodeConverter } from 'vscode-languageclient/lib/common/codeConverter.js';
import { createConverter as createProtocolConverter } from 'vscode-languageclient/lib/common/protocolConverter.js';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { createUrl } from 'monaco-editor-wrapper';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';

const codeConverter = createCodeConverter();
const protocolConverter = createProtocolConverter(undefined, true, true);

export const startJsonClient = async () => {
    // use the same common method to create a monaco editor for json
    await performInit(true);
    await createJsonEditor({
        htmlElement: document.getElementById('container')!,
        content: createDefaultJsonContent()
    });

    const url = createUrl({
        $type: 'WebSocket',
        secured: false,
        host: 'localhost',
        port: 30000,
        path: '/sampleServer'
    });
    createWebSocketAndStartClient(url);
};

export const createLanguageClient = (transports: MessageTransports, languageId: string): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: 'Sample Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: [languageId],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            }
        }
    });
};

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (url: string, languageId: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        const languageClient = createLanguageClient({
            reader,
            writer
        }, languageId);
        languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

/** backwards compatible wrapper for legacy version, only support json as languageId */
export const createWebSocketAndStartClient = (url: string): WebSocket => {
    return initWebSocketAndStartClient(url, 'json');
};

export const createDefaultJsonContent = (): string => {
    return `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
};

/* backwards compatible wrapper for legacy version, for json lang only */
export const performInit = async (vscodeApiInit: boolean) => {
    return doInit(vscodeApiInit, {
        id: 'json',
        extensions: ['.json', '.jsonc'],
        aliases: ['JSON', 'json'],
        mimetypes: ['application/json']
    });
};

export type ExampleJsonEditor = {
    languageId: string;
    editor: monaco.editor.IStandaloneCodeEditor;
    uri: vscode.Uri;
    modelRef: IReference<ITextFileEditorModel>;
}

/* parameterized version, support for any lang */
export const doInit = async (vscodeApiInit: boolean, registerConfig: monaco.languages.ILanguageExtensionPoint) => {
    if (vscodeApiInit === true) {
        await initServices({
            userServices: {
                ...getThemeServiceOverride(),
                ...getTextmateServiceOverride(),
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride()
            },
            debugLogging: true,
            workspaceConfig: {
                workspaceProvider: {
                    trusted: true,
                    workspace: {
                        workspaceUri: vscode.Uri.file('/workspace')
                    },
                    async open() {
                        return false;
                    }
                }
            }
        });

        // register the JSON language with Monaco
        monaco.languages.register(registerConfig);
    }
};

/* parameterized version, support for any lang */
export const createMonacoEditor = async (config: {
    htmlElement: HTMLElement,
    content: string,
    languageId: string
}) => {
    // create the model
    const uri = vscode.Uri.parse('/workspace/model.json');
    const modelRef = await createModelReference(uri, config.content);
    modelRef.object.setLanguageId(config.languageId);

    // create monaco editor
    const editor = createConfiguredEditor(config.htmlElement, {
        model: modelRef.object.textEditorModel,
        glyphMargin: true,
        lightbulb: {
            enabled: monaco.editor.ShowLightbulbIconMode.On
        },
        automaticLayout: true,
        wordBasedSuggestions: 'off'
    });

    const result = {
        editor,
        uri,
        modelRef
    } as ExampleJsonEditor;
    return Promise.resolve(result);
};

export const createJsonEditor = async (config: {
    htmlElement: HTMLElement,
    content: string
}) => {
    return createMonacoEditor({
        htmlElement: config.htmlElement,
        content: config.content,
        languageId: 'json'
    });
};

export const startBrowserEditor = async () => {
    let mainVscodeDocument: vscode.TextDocument | undefined;
    const languageId = 'json';

    await performInit(true);

    vscode.workspace.onDidOpenTextDocument((_event) => {
        mainVscodeDocument = vscode.workspace.textDocuments[0];
    });

    const jsonEditor = await createJsonEditor({
        htmlElement: document.getElementById('container')!,
        content: createDefaultJsonContent()
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
            diagnosticCollection.set(jsonEditor.uri, diagnostics);
        });
    };

    const cleanDiagnostics = () => {
        diagnosticCollection.clear();
    };

    jsonEditor.modelRef.object.textEditorModel!.onDidChangeContent(() => {
        validate();
    });
};
