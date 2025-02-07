/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import type { ExtensionConfig } from 'monaco-editor-wrapper';
import type { ConfigParams, InitMessage } from '../common/definitions.js';

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/features/debugger.ts
// The client configuration is generic and can be used for a another language

export const provideDebuggerExtensionConfig = (config: ConfigParams): ExtensionConfig => {
    const filesOrContents = new Map<string, string | URL>();
    filesOrContents.set('./extension.js', '// nothing');

    return {
        config: {
            name: config.extensionName,
            publisher: 'TypeFox',
            version: '1.0.0',
            engines: {
                vscode: '*'
            },
            // A browser field is mandatory for the extension to be flagged as `web`
            browser: 'extension.js',
            contributes: {
                debuggers: [
                    {
                        type: config.languageId,
                        label: 'Test',
                        languages: [config.languageId]
                    }
                ],
                breakpoints: [
                    {
                        language: config.languageId
                    }
                ]
            }
        },
        filesOrContents
    };
};

export const confiugureDebugging = async (api: typeof vscode, config: ConfigParams) => {
    class WebsocketDebugAdapter implements vscode.DebugAdapter {
        private websocket: WebSocket;

        constructor(websocket: WebSocket) {
            this.websocket = websocket;
            this.websocket.onmessage = (message) => {
                this._onDidSendMessage.fire(JSON.parse(message.data));
            };
        }

        _onDidSendMessage = new api.EventEmitter<vscode.DebugProtocolMessage>();
        onDidSendMessage = this._onDidSendMessage.event;

        handleMessage(message: vscode.DebugProtocolMessage): void {
            this.websocket.send(JSON.stringify(message));
        }

        dispose() {
            this.websocket.close();
        }
    }

    api.debug.registerDebugAdapterDescriptorFactory(config.languageId, {
        async createDebugAdapterDescriptor() {
            const websocket = new WebSocket(`${config.protocol}://${config.hostname}:${config.port}`);

            await new Promise((resolve, reject) => {
                websocket.onopen = resolve;
                websocket.onerror = () =>
                    reject(new Error(`Unable to connect to debugger server. Run "${config.helpContainerCmd}"`));
            });

            const adapter = new WebsocketDebugAdapter(websocket);

            const initMessage: InitMessage = {
                id: 'init',
                files: {},
                // the default file is the one that will be used by the debugger
                defaultFile: config.defaultFile,
                debuggerExecCall: config.debuggerExecCall
            };
            for (const [name, fileDef] of config.files.entries()) {
                console.log(`Found: ${name} Sending file: ${fileDef.path}`);
                initMessage.files[name] = {
                    path: fileDef.path,
                    code: fileDef.code,
                    uri: fileDef.uri
                };
            }
            websocket.send(JSON.stringify(initMessage));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            adapter.onDidSendMessage((message: any) => {
                if (message.type === 'event' && message.event === 'output') {
                    console.log('OUTPUT', message.body.output);
                }
            });
            return new api.DebugAdapterInlineImplementation(adapter);
        }
    });
};
