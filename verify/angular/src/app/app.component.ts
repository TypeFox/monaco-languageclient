/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { LogLevel } from '@codingame/monaco-vscode-api';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { firstValueFrom } from 'rxjs';
import * as vscode from 'vscode';
import { MonacoAngularWrapperComponent } from '../monaco-angular-wrapper/monaco-angular-wrapper.component';
import { SaveCodeService } from '../save-code.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [MonacoAngularWrapperComponent],
})
export class AppComponent implements AfterViewInit {
    private saveCodeService = inject(SaveCodeService);
    monacoVscodeApiConfig = signal<MonacoVscodeApiConfig | undefined>(undefined);
    languageClientConfig = signal<LanguageClientConfig | undefined>(undefined);
    editorAppConfig = signal<EditorAppConfig | undefined>(undefined);

    title = 'angular demo for saving code';
    editorId = 'monaco-editor-root'; // this can be parameterized or it can be in a loop to support multiple editors
    editorInlineStyle = signal('height: 50vh;');
    readonly codeText = signal('');

    private buildConfig(htmlContainer: HTMLElement) {
        const lsConfig = {
            port: 30000,
            path: '/sampleServer',
            basePath: '/home/mlc/packages/examples/resources/json',
            languageId: 'json'
        };
        const helloJsonCode = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;
        const helloUri = vscode.Uri.file(`${lsConfig.basePath}/workspace/hello.${lsConfig.languageId}`);

        this.monacoVscodeApiConfig.set({
            $type: 'extended',
            viewsConfig: {
                $type: 'EditorService',
                htmlContainer
            },
            logLevel: LogLevel.Debug,
            serviceOverrides: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.lightbulb.enabled': 'On',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            },
            monacoWorkerFactory: configureDefaultWorkerFactory
        });

        this.languageClientConfig.set({
            languageId: lsConfig.languageId,
            connection: {
                options: {
                    $type: 'WebSocketUrl',
                    url: `ws://localhost:${lsConfig.port}${lsConfig.path}`,
                    startOptions: {
                        onCall: () => {
                            console.log('Connected to socket.');
                        },
                        reportStatus: true
                    },
                    stopOptions: {
                        onCall: () => {
                            console.log('Disconnected from socket.');
                        },
                        reportStatus: true
                    }
                },
            },
            clientOptions: {
                documentSelector: [lsConfig.languageId],
                workspaceFolder: {
                    index: 0,
                    name: 'workspace',
                    uri: vscode.Uri.parse(`${lsConfig.basePath}/workspace`)
                }
            }
        });

        this.editorAppConfig.set({
            codeResources: {
                modified: {
                    text: helloJsonCode,
                    uri: helloUri.path
                }
            }
        });
    }

    async ngAfterViewInit(): Promise<void> {
        const editorDom = document.getElementById(this.editorId);
        if (editorDom) {
            this.buildConfig(editorDom);
        }
    }

    onTextChanged(text: string) {
        this.codeText.set(text);
    }

    save = async () => {
        try {
            const response = await firstValueFrom(
                this.saveCodeService.saveCode(this.codeText())
            );
            alert('Code saved:' + JSON.stringify(response));
        } catch (error) {
            console.error('Error saving code:', error);
        }
    };
}
