/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { MonacoEnvironmentEnhanced } from './config.js';

export const getEnhancedMonacoEnvironment = (): MonacoEnvironmentEnhanced => {
    if (typeof MonacoEnvironment === 'undefined') {
        globalThis.MonacoEnvironment = {};
    }
    const envEnhanced = MonacoEnvironment as MonacoEnvironmentEnhanced;
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

export const reportServiceLoading = (services: monaco.editor.IEditorOverrideServices, logger?: ILogger) => {
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

export const useOpenEditorStub: OpenEditor = async (modelRef, options, sideBySide, logger?: ILogger) => {
    logger?.info('Received open editor call with parameters: ', modelRef, options, sideBySide);
    return undefined;
};
