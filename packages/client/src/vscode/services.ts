/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import 'vscode/localExtensionHost';
import { ILogService, initialize, IWorkbenchConstructionOptions, LogLevel, StandaloneServices } from 'vscode/services';
import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override';
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import type { LocalizationOptions } from '@codingame/monaco-vscode-localization-service-override';
import { FakeWorker as Worker } from './fakeWorker.js';
import { Logger } from '../tools/index.js';

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

export const reportServiceLoading = (services: monaco.editor.IEditorOverrideServices, logger?: Logger) => {
    for (const serviceName of Object.keys(services)) {
        logger?.debug(`Loading service: ${serviceName}`);
    }
};

export const mergeServices = (services: monaco.editor.IEditorOverrideServices, overrideServices: monaco.editor.IEditorOverrideServices) => {
    for (const [name, service] of Object.entries(services)) {
        overrideServices[name] = service;
    }
};

export type InitServicesInstruction = {
    serviceConfig?: InitializeServiceConfig;
    caller?: string;
    performChecks?: () => boolean;
    logger?: Logger;
};

export const initServices = async (instruction: InitServicesInstruction) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    // in case debugLogging is set and for whatever reason no logger is passed a proper one is created
    if (instruction.serviceConfig?.debugLogging === true && !instruction.logger) {
        instruction.logger = new Logger({
            enabled: true,
            debugEnabled: true
        });
    }

    if (!(envEnhanced.vscodeInitialising ?? false)) {
        if (envEnhanced.vscodeApiInitialised ?? false) {
            instruction.logger?.debug('Initialization of vscode services can only performed once!');
        } else {
            envEnhanced.vscodeInitialising = true;
            instruction.logger?.debug(`Initializing vscode services. Caller: ${instruction.caller ?? 'unknown'}`);

            await importAllServices(instruction);
            instruction.logger?.debug('Initialization of vscode services completed successfully.');

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
export const importAllServices = async (instruction: InitServicesInstruction) => {
    const lc: InitializeServiceConfig = instruction.serviceConfig ?? {};
    const userServices: monaco.editor.IEditorOverrideServices = lc.userServices ?? {};

    const lcRequiredServices = await supplyRequiredServices();

    mergeServices(lcRequiredServices, userServices);
    await configureExtHostWorker(instruction.serviceConfig?.enableExtHostWorker === true, userServices);

    reportServiceLoading(userServices, instruction.logger);

    if (instruction.performChecks === undefined || instruction.performChecks()) {
        await initialize(userServices, undefined, lc.workspaceConfig);
        const logLevel = lc.workspaceConfig?.developmentOptions?.logLevel ?? LogLevel.Info;
        StandaloneServices.get(ILogService).setLevel(logLevel);
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

        const extHostServices = {
            ...getExtensionServiceOverride(workerConfig),
        };
        mergeServices(extHostServices, userServices);
    }
};

export const createDefaultLocaleConfiguration = (): LocalizationOptions => {
    return {
        async clearLocale() {
            const url = new URL(window.location.href);
            url.searchParams.delete('locale');
            window.history.pushState(null, '', url.toString());
        },
        async setLocale(id: string) {
            const url = new URL(window.location.href);
            url.searchParams.set('locale', id);
            window.history.pushState(null, '', url.toString());
        },
        availableLanguages: [{
            locale: 'en',
            languageName: 'English'
        }, {
            locale: 'cs',
            languageName: 'Czech'
        }, {
            locale: 'de',
            languageName: 'German'
        }, {
            locale: 'es',
            languageName: 'Spanish'
        }, {
            locale: 'fr',
            languageName: 'French'
        }, {
            locale: 'it',
            languageName: 'Italian'
        }, {
            locale: 'ja',
            languageName: 'Japanese'
        }, {
            locale: 'ko',
            languageName: 'Korean'
        }, {
            locale: 'pl',
            languageName: 'Polish'
        }, {
            locale: 'pt-br',
            languageName: 'Portuguese (Brazil)'
        }, {
            locale: 'qps-ploc',
            languageName: 'Pseudo Language'
        }, {
            locale: 'ru',
            languageName: 'Russian'
        }, {
            locale: 'tr',
            languageName: 'Turkish'
        }, {
            locale: 'zh-hans',
            languageName: 'Chinese (Simplified)'
        }, {
            locale: 'zh-hant',
            languageName: 'Chinese (Traditional)'
        }, {
            locale: 'en',
            languageName: 'English'
        }]
    };
};
