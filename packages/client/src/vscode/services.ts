/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import 'vscode/localExtensionHost';
import { ILogService, initialize, IWorkbenchConstructionOptions, StandaloneServices } from 'vscode/services';
import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import { FakeWorker as Worker } from './fakeWorker.js';

export interface MonacoEnvironmentEnhanced extends monaco.Environment {
    vscodeInitialising?: boolean;
    vscodeApiInitialised?: boolean;
}

export type InitializeServiceConfig = {
    userServices?: monaco.editor.IEditorOverrideServices;
    enableExtHostWorker?: boolean;
    debugLogging?: boolean;
    workspaceConfig?: IWorkbenchConstructionOptions;
};

export const initEnhancedMonacoEnvironment = () => {
    const monWin = (self as Window);
    if (!monWin.MonacoEnvironment) {
        monWin.MonacoEnvironment = {};
    }
    const envEnhanced = monWin.MonacoEnvironment as MonacoEnvironmentEnhanced;
    if (envEnhanced.vscodeApiInitialised === undefined) {
        envEnhanced.vscodeApiInitialised = false;
    }
    if (envEnhanced.vscodeInitialising === undefined) {
        envEnhanced.vscodeInitialising = false;
    }

    return envEnhanced;
};

export const supplyRequiredServices = async () => {
    return {
        ...getLanguagesServiceOverride(),
        ...getModelServiceOverride()
    };
};

export const reportServiceLoading = (services: monaco.editor.IEditorOverrideServices, debugLogging: boolean) => {
    for (const serviceName of Object.keys(services)) {
        if (debugLogging) {
            console.log(`Loading service: ${serviceName}`);
        }
    }
};

export const mergeServices = (services: monaco.editor.IEditorOverrideServices, overrideServices: monaco.editor.IEditorOverrideServices) => {
    for (const [name, service] of Object.entries(services)) {
        overrideServices[name] = service;
    }
};

export const initServices = async (config?: InitializeServiceConfig, caller?: string, performChecks?: () => boolean) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    if (!envEnhanced.vscodeInitialising) {
        if (envEnhanced.vscodeApiInitialised) {
            if (config?.debugLogging === true) {
                console.log('Initialization of vscode services can only performed once!');
            }
        } else {
            envEnhanced.vscodeInitialising = true;
            if (config?.debugLogging === true) {
                console.log(`Initializing vscode services. Caller: ${caller ?? 'unknown'}`);
            }
            await importAllServices(config, performChecks);
            if (config?.debugLogging === true) {
                console.log('Initialization of vscode services completed successfully.');
            }
            envEnhanced.vscodeApiInitialised = true;
        }
    }
};

/**
 * monaco-vscode-api automatically loads the following services:
 *  - layout
 *  - environment
 *  - extension
 *  - files
 *  - quickAccess
 * monaco-languageclient always adds the following services:
 *   - languages
 *   - model
 */
export const importAllServices = async (config?: InitializeServiceConfig, performChecks?: () => boolean) => {
    const lc: InitializeServiceConfig = config ?? {};
    const userServices: monaco.editor.IEditorOverrideServices = lc.userServices ?? {};

    const lcRequiredServices = await supplyRequiredServices();

    mergeServices(lcRequiredServices, userServices);
    await configureExtHostWorker(config?.enableExtHostWorker === true, userServices);
    reportServiceLoading(userServices, lc.debugLogging === true);

    if (performChecks === undefined || performChecks()) {
        await initialize(userServices);
        const logLevel = lc.workspaceConfig?.developmentOptions?.logLevel;
        if (logLevel) {
            StandaloneServices.get(ILogService).setLevel(logLevel);
        }
    }
};

/**
 * Enable ext host to run in a worker
 */
export const configureExtHostWorker = async (enableExtHostWorker: boolean, userServices: monaco.editor.IEditorOverrideServices) => {
    if (enableExtHostWorker) {
        const fakeWorker = new Worker(new URL('vscode/workers/extensionHost.worker', import.meta.url), { type: 'module' });
        const workerConfig: WorkerConfig = {
            url: fakeWorker.url.toString(),
            options: fakeWorker.options
        };

        // import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
        const getExtensionServiceOverride = (await import('@codingame/monaco-vscode-extensions-service-override')).default;
        const extHostServices = {
            ...getExtensionServiceOverride(workerConfig),
        };
        mergeServices(extHostServices, userServices);
    }
};
