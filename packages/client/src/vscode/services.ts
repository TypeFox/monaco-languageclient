/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import 'vscode/localExtensionHost';
import { initialize, IWorkbenchConstructionOptions } from 'vscode/services';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override';
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override';
import type { LocalizationOptions } from '@codingame/monaco-vscode-localization-service-override';
import { EnvironmentOverride } from 'vscode/workbench';
import { Logger } from 'monaco-languageclient/tools';
import { FakeWorker as Worker } from './fakeWorker.js';

export interface MonacoEnvironmentEnhanced extends monaco.Environment {
    vscodeInitialising?: boolean;
    vscodeApiInitialised?: boolean;
}

export interface UserConfiguration {
    json?: string;
}

export interface VscodeApiConfig {
    userServices?: monaco.editor.IEditorOverrideServices;
    enableExtHostWorker?: boolean;
    workspaceConfig?: IWorkbenchConstructionOptions;
    userConfiguration?: UserConfiguration;
    viewsConfig?: {
        viewServiceType: 'EditorService' | 'ViewsService' | 'WorkspaceService';
        openEditorFunc?: OpenEditor;
        viewsInitFunc?: () => void;
    },
    envOptions?: EnvironmentOverride;
}

export interface InitVscodeApiInstructions extends VscodeApiConfig {
    htmlContainer: HTMLElement;
    caller?: string;
    performChecks?: () => boolean;
    logger?: Logger;
}

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

export const getMonacoEnvironmentEnhanced = () => {
    const monWin = (self as Window);
    return monWin.MonacoEnvironment as MonacoEnvironmentEnhanced;
};

export const supplyRequiredServices = async () => {
    return {
        ...getLanguagesServiceOverride(),
        ...getLogServiceOverride(),
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

export const initServices = async (instructions: InitVscodeApiInstructions) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    if (!(envEnhanced.vscodeInitialising ?? false)) {
        if (envEnhanced.vscodeApiInitialised ?? false) {
            instructions.logger?.debug('Initialization of vscode services can only performed once!');
        } else {
            envEnhanced.vscodeInitialising = true;
            instructions.logger?.debug(`Initializing vscode services. Caller: ${instructions.caller ?? 'unknown'}`);

            await importAllServices(instructions);
            instructions.viewsConfig?.viewsInitFunc?.();
            instructions.logger?.debug('Initialization of vscode services completed successfully.');

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
export const importAllServices = async (instructions: InitVscodeApiInstructions) => {
    const userServices: monaco.editor.IEditorOverrideServices = instructions.userServices ?? {};

    const lcRequiredServices = await supplyRequiredServices();

    mergeServices(lcRequiredServices, userServices);
    await configureExtHostWorker(instructions.enableExtHostWorker === true, userServices);

    reportServiceLoading(userServices, instructions.logger);

    if (instructions.performChecks === undefined || (typeof instructions.performChecks === 'function' && instructions.performChecks())) {
        await initialize(userServices, instructions.htmlContainer, instructions.workspaceConfig, instructions.envOptions);
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
