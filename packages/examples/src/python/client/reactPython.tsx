/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createWrapperConfig } from './config.js';
import { configureDebugging } from '../../debugger/client/debugger.js';

export const runPythonReact = async () => {
    const appConfig = createWrapperConfig();

    const onLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
        console.error('JUSTIN onLoad', wrapper);

        const result = wrapper.getExtensionRegisterResult(
            'mlc-python-example'
        ) as RegisterLocalProcessExtensionResult;
        await result.setAsDefaultApi();

        const initResult = wrapper.getExtensionRegisterResult(
            'debugger-py-client'
        ) as RegisterLocalProcessExtensionResult | undefined;
        if (initResult !== undefined) {
            configureDebugging(
                await initResult.getApi(),
                appConfig.configParams
            );
        }

        // TODO: Get all languageClients
        const writer = wrapper
            .getLanguageClientWrapper('python')
            ?.getLanguageClient()?.messageTransports.writer;

        if (writer) {
            // Track changes
            appConfig.configParams.fileSystemProvider.onFileUpdate = async (
                file
            ) => {
                await writer.write({
                    jsonrpc: '2.0',
                    id: 0,
                    method: 'fileSync',
                    params: {
                        path: file.path,
                        text: file.text,
                        updated: file.updated,
                    },
                } as {
                    jsonrpc: string;
                });
            };

            // Send all current files
            await Promise.all(
                appConfig.configParams.fileSystemProvider
                    .getAllFiles()
                    .map(async (file) => {
                        await writer.write({
                            jsonrpc: '2.0',
                            id: 0,
                            method: 'fileSync',
                            params: {
                                path: file.path,
                                text: file.text,
                                updated: file.updated,
                            },
                        } as {
                            jsonrpc: string;
                        });
                    })
            );
        }

        await vscode.commands.executeCommand('workbench.view.explorer');
        await vscode.window.showTextDocument(appConfig.configParams.defaultFile);
    };

    const root = ReactDOM.createRoot(document.getElementById('react-root')!);

    const App = () => {
        return (
            <div style={{ backgroundColor: '#1f1f1f' }}>
                <MonacoEditorReactComp
                    wrapperConfig={appConfig.wrapperConfig}
                    style={{ height: '100%' }}
                    onLoad={onLoad}
                    onError={(e) => {
                        console.error(e);
                    }}
                />
            </div>
        );
    };
    root.render(<App />);
};
