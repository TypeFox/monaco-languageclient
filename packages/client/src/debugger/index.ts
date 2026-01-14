/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { ExtensionConfig } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';
import { Uri } from 'vscode';

// This is derived from:
// https://github.com/CodinGame/monaco-vscode-api/blob/main/demo/src/features/debugger.ts
// The client configuration is generic and can be used for a another language

export type FileDefinition = {
    path: string;
    code: string;
    uri: Uri;
}

export type InitMessage = {
    id: 'init',
    files: Record<string, FileDefinition>
    defaultFile: string;
    debuggerExecCall: string;
};

export type ConfigParams = {
    extensionName: string;
    version: string;
    publisher: string;
    languageId: string;
    documentSelector: string[];
    homeDir: string;
    workspaceRoot: string;
    workspaceFile: Uri;
    htmlContainer: HTMLElement;
    protocol: 'ws' | 'wss';
    hostname: string;
    port: number;
    files: Map<string, FileDefinition>;
    defaultFile: string;
    helpContainerCmd: string;
    debuggerExecCall: string;
}

export const provideDebuggerExtensionConfig = (config: ConfigParams): ExtensionConfig => {
    const filesOrContents = new Map<string, string | URL>();
    filesOrContents.set('./extension.js', '// nothing');

    return {
        config: {
            name: config.extensionName,
            publisher: config.publisher,
            version: config.version,
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
            },
            activationEvents: [
                'onDebug'
            ]
        },
        filesOrContents
    };
};

export const configureDebugging = async (api: typeof vscode, config: ConfigParams, logger?: ILogger) => {
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
            // path with on Windows (Chrome/Firefox) arrive here with \\ and not like expected with /
            // Chrome on Ubuntu behaves as expected
            const msg = JSON.stringify(message).replaceAll('\\\\', '/');
            this.websocket.send(msg);
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
                logger?.info(`Found: ${name} Sending file: ${fileDef.path}`);
                initMessage.files[name] = {
                    path: fileDef.path,
                    code: fileDef.code,
                    uri: fileDef.uri
                };
            }
            websocket.send(JSON.stringify(initMessage));

            // oxlint-disable-next-line @typescript-eslint/no-explicit-any
            adapter.onDidSendMessage((message: any) => {
                if (message.type === 'event' && message.event === 'output') {
                    logger?.info('OUTPUT', message.body.output);
                }
            });
            return new api.DebugAdapterInlineImplementation(adapter);
        }
    });
};

export const createDebugLaunchConfigFile = (workspacePath: string, type: string) => {
    return new RegisteredMemoryFile(
        Uri.file(`${workspacePath}/.vscode/launch.json`),
        JSON.stringify(
            {
                version: '0.2.0',
                configurations: [
                    {
                        name: 'Debugger: Lauch',
                        type,
                        request: 'attach',
                    }
                ]
            },
            null,
            2
        )
    );
};
