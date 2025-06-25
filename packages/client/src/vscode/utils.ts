/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override';
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import type { Logger } from 'monaco-languageclient/common';
import { FakeWorker as Worker } from 'monaco-languageclient/workerFactory';
import type { MonacoEnvironmentEnhanced } from './config.js';

export const getEnhancedMonacoEnvironment = (): MonacoEnvironmentEnhanced => {
    const monWin = (self as Window);
    if (monWin.MonacoEnvironment === undefined) {
        monWin.MonacoEnvironment = {};
    }
    const envEnhanced = monWin.MonacoEnvironment as MonacoEnvironmentEnhanced;
    if (envEnhanced.vscodeApiInitialising === undefined) {
        envEnhanced.vscodeApiInitialising = false;
    }
    if (envEnhanced.vscodeApiInitialised === undefined) {
        envEnhanced.vscodeApiInitialised = false;
    }
    if (envEnhanced.viewServiceType === undefined) {
        envEnhanced.viewServiceType = 'EditorService';
    }

    return envEnhanced;
};

export const reportServiceLoading = (services: monaco.editor.IEditorOverrideServices, logger?: Logger) => {
    for (const serviceName of Object.keys(services)) {
        logger?.debug(`Loading service: ${serviceName}`);
    }
};

export const mergeServices = (overrideServices: monaco.editor.IEditorOverrideServices, services?: monaco.editor.IEditorOverrideServices) => {
    if (services !== undefined) {
        for (const [name, service] of Object.entries(services)) {
            overrideServices[name] = service;
        }
    }
};

/**
 * Enable ext host to run in a worker
 */
export const configureExtHostWorker = async (enableExtHostWorker: boolean, userServices: monaco.editor.IEditorOverrideServices) => {
    if (enableExtHostWorker) {
        const fakeWorker = new Worker(new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url), { type: 'module' });
        const workerConfig: WorkerConfig = {
            url: fakeWorker.url.toString(),
            options: fakeWorker.options
        };

        mergeServices(userServices, {
            ...getExtensionServiceOverride(workerConfig),
        });
    }
};

export const useOpenEditorStub: OpenEditor = async (modelRef, options, sideBySide) => {
    console.log('Received open editor call with parameters: ', modelRef, options, sideBySide);
    return undefined;
};
