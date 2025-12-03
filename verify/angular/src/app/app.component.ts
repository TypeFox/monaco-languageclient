/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// this import is required beacuse @analogjs/vite-plugin-angular is instead of the angular builder
import 'zone.js';

import { type AfterViewInit, Component } from '@angular/core';

// import { runExtendedClient } from '../../production/mlc-bundle.js';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import * as vscode from 'vscode';
// this is required syntax highlighting
import { LogLevel } from '@codingame/monaco-vscode-api';
import '@codingame/monaco-vscode-json-default-extension';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true
})
export class MonacoEditorComponent implements AfterViewInit {
    title = 'angular-client';
    initDone = false;

    async ngAfterViewInit(): Promise<void> {
        await runExtendedClient();
    }
}

export const runExtendedClient = async () => {
    const lsConfig = {
        port: 30000,
        path: '/sampleServer',
        basePath: '/home/mlc/packages/examples/resources/json',
        languageId: 'json'
    };
    const helloCode = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;
    const helloUri = vscode.Uri.file(`${lsConfig.basePath}/workspace/hello.${lsConfig.languageId}`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloUri, helloCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer
        },
        logLevel: LogLevel.Debug,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.experimental.asyncTokenization': false
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const languageClientConfig: LanguageClientConfig = {
        languageId: lsConfig.languageId,
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: `ws://localhost:${lsConfig.port}${lsConfig.path}`,
            }
        },
        clientOptions: {
            documentSelector: [lsConfig.languageId],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.parse(`${lsConfig.basePath}/workspace`)
            }
        }
    };

    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: helloCode,
                uri: helloUri.path
            }
        }
    };

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
    const editorApp = new EditorApp(editorAppConfig);

    await editorApp.start(htmlContainer);
    await lcWrapper.start();

    // open files, so the LS can pick it up
    await vscode.workspace.openTextDocument(helloUri);
};
