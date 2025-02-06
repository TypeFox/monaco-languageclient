/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import type { ExtensionConfig } from 'monaco-editor-wrapper';
import type { ConfigParams } from '../../python/client/config.js';
import type { InitMessage } from '../common/definitions.js';

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/features/debugger.ts

export const provideDebuggerExtensionConfig = (config: ConfigParams): ExtensionConfig => {
    const filesOrContents = new Map<string, string | URL>();
    filesOrContents.set('./extension.js', '// nothing');

    return {
        config: {
            name: 'debugger-py-client',
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

    api.debug.registerDebugConfigurationProvider(config.languageId, {
        resolveDebugConfiguration() {
            return {
                name: 'Test debugger',
                type: config.languageId,
                request: 'launch'
            };
        }
    });

    api.debug.registerDebugAdapterDescriptorFactory(config.languageId, {
        async createDebugAdapterDescriptor() {
            const websocket = new WebSocket(config.debuggerUrl);

            await new Promise((resolve, reject) => {
                websocket.onopen = resolve;
                websocket.onerror = () =>
                    reject(new Error('Unable to connect to debugger server. Run `npm run start:debugServer`'));
            });

            const initMessage: InitMessage = {
                id: 'init',
                files: {} as Record<string, { code: string; path: string }>
            };
            for (const [name, fileDef] of config.files.entries()) {
                console.log(`Found: ${name} Sending file: ${fileDef.path}`);
                initMessage.files[name] = {
                    path: fileDef.path,
                    code: fileDef.code
                };
            }
            websocket.send(JSON.stringify(initMessage));
            const adapter = new WebsocketDebugAdapter(websocket);

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
