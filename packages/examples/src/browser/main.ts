/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import { getLanguageService, TextDocument } from 'vscode-json-languageservice';
import * as codeConverter from 'vscode-languageclient/$test/common/codeConverter';
import * as protocolConverter from 'vscode-languageclient/$test/common/protocolConverter';
import { LogLevel } from '@codingame/monaco-vscode-api';

import '../../resources/vsix/github-vscode-theme.vsix';

import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

export const runBrowserEditor = async () => {
  const c2p: codeConverter.Converter = codeConverter.createConverter();
  const p2c: protocolConverter.Converter = protocolConverter.createConverter(undefined, true, true, false);

  let mainVscodeDocument: vscode.TextDocument | undefined;
  const languageId = 'json';
  const code = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": "unix"
}`;
  const codeUri = '/workspace/model.json';

  const htmlContainer = document.getElementById('monaco-editor-root')!;
  const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    viewsConfig: {
      $type: 'EditorService',
      htmlContainer
    },
    logLevel: LogLevel.Debug,
    serviceOverrides: {
      ...getKeybindingsServiceOverride()
    },
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'GitHub Dark High Contrast',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.lightbulb.enabled': 'On',
        'editor.experimental.asyncTokenization': true
      })
    },
    monacoWorkerFactory: configureDefaultWorkerFactory
  };
  const editorAppConfig: EditorAppConfig = {
    codeResources: {
      modified: {
        text: code,
        uri: codeUri
      }
    }
  };
  const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
  await apiWrapper.start();

  const editorApp = new EditorApp(editorAppConfig);

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
      const completionList = await jsonService.doComplete(document, c2p.asPosition(position), jsonDocument);
      return p2c.asCompletionResult(completionList);
    },

    async resolveCompletionItem(item, _token) {
      return await jsonService.doResolve(c2p.asCompletionItem(item)).then((result) => p2c.asCompletionItem(result));
    }
  });

  vscode.languages.registerDocumentRangeFormattingEditProvider(languageId, {
    provideDocumentRangeFormattingEdits(vscodeDocument, range, options, _token) {
      const document = createDocument(vscodeDocument);
      const edits = jsonService.format(document, c2p.asRange(range), c2p.asFormattingOptions(options, {}));
      return p2c.asTextEdits(edits);
    }
  });

  vscode.languages.registerDocumentSymbolProvider(languageId, {
    provideDocumentSymbols(vscodeDocument, _token) {
      const document = createDocument(vscodeDocument);
      const jsonDocument = jsonService.parseJSONDocument(document);
      return p2c.asSymbolInformations(jsonService.findDocumentSymbols(document, jsonDocument));
    }
  });

  vscode.languages.registerHoverProvider(languageId, {
    async provideHover(vscodeDocument, position, _token) {
      const document = createDocument(vscodeDocument);
      const jsonDocument = jsonService.parseJSONDocument(document);
      return await jsonService.doHover(document, c2p.asPosition(position), jsonDocument).then((hover) => {
        return p2c.asHover(hover)!;
      });
    }
  });

  const validate = () => {
    const document = createDocument(mainVscodeDocument!);
    cleanPendingValidation(document);
    pendingValidationRequests.set(
      document.uri,
      window.setTimeout(() => {
        pendingValidationRequests.delete(document.uri);
        doValidate(document);
      })
    );
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
      const diagnostics = await p2c.asDiagnostics(pDiagnostics);
      diagnosticCollection.set(vscode.Uri.parse(codeUri), diagnostics);
    });
  };

  const cleanDiagnostics = () => {
    diagnosticCollection.clear();
  };

  await editorApp.start(htmlContainer);

  editorApp.getTextModels().modified?.onDidChangeContent(() => {
    validate();
  });
};
