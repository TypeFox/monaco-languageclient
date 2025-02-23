/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { type RegisterLocalProcessExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createWrapperConfig } from './config.js';
import { configureDebugging } from '../../debugger/client/debugger.js';
import requirementsCode from '../../../resources/python/requirements.txt?raw';
import mainPyCode from '../../../resources/python/main.py?raw';
import hello2PyCode from '../../../resources/python/hello2.py?raw';
import badPyCode from '../../../resources/python/bad.py?raw';
import type { Files } from '../../debugger/common/serverSyncingFileSystemProvider.js';

const files: Files = {
    'requirements.txt': {
        updated: Date.now(),
        text: requirementsCode,
    },
    'main.py': {
        updated: Date.now(),
        text: mainPyCode,
    },
    'hello2.py': {
        updated: Date.now(),
        text: hello2PyCode,
    },
    'bad.py': { updated: Date.now(), text: badPyCode },
};

export const runPythonWrapper = async () => {
    const appConfig = createWrapperConfig({
        files,
        onFileUpdate: (file) => {
            console.error('[FILE] file updated', file);
            return Promise.resolve();
        },
        onFileDelete: (path) => {
            console.error('[FILE] file deleted', path);
            return Promise.resolve();
        },
    });
    const wrapper = new MonacoEditorLanguageClientWrapper();

    if (wrapper.isStarted()) {
        console.warn('Editor was already started!');
    } else {
        await wrapper.init(appConfig.wrapperConfig);

        const result = wrapper.getExtensionRegisterResult(
            'mlc-python-example',
        ) as RegisterLocalProcessExtensionResult;
        result.setAsDefaultApi();

        const initResult = wrapper.getExtensionRegisterResult(
            'debugger-py-client',
        ) as RegisterLocalProcessExtensionResult | undefined;
        if (initResult !== undefined) {
            configureDebugging(
                await initResult.getApi(),
                appConfig.configParams,
            );
        }

        await vscode.commands.executeCommand('workbench.view.explorer');

        await wrapper.start();

        appConfig.onLoad(wrapper);
    }
};
