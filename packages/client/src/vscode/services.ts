/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import 'vscode/localExtensionHost';
import { initialize, type IWorkbenchConstructionOptions } from '@codingame/monaco-vscode-api';
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override';
import getConfigurationServiceOverride, { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override';
import type { LocalizationOptions } from '@codingame/monaco-vscode-localization-service-override';
import type { EnvironmentOverride } from '@codingame/monaco-vscode-api/workbench';
import type { Logger } from 'monaco-languageclient/tools';
import { FakeWorker as Worker } from './fakeWorker.js';
import { setUnexpectedErrorHandler } from '@codingame/monaco-vscode-api/monaco';

export interface MonacoEnvironmentEnhanced extends monaco.Environment {
    vscodeInitialising?: boolean;
    vscodeApiInitialised?: boolean;
}

export interface UserConfiguration {
    json?: string;
}
export interface ViewsConfig {
    viewServiceType: 'EditorService' | 'ViewsService' | 'WorkspaceService';
    openEditorFunc?: OpenEditor;
    htmlAugmentationInstructions?: (htmlContainer: HTMLElement | null | undefined) => void;
    viewsInitFunc?: () => Promise<void>;
}

export interface VscodeApiConfig {
    vscodeApiInitPerformExternally?: boolean;
    loadThemes?: boolean;
    serviceOverrides?: monaco.editor.IEditorOverrideServices;
    enableExtHostWorker?: boolean;
    workspaceConfig?: IWorkbenchConstructionOptions;
    userConfiguration?: UserConfiguration;
    viewsConfig?: ViewsConfig,
    envOptions?: EnvironmentOverride;
}

export interface InitServicesInstructions {
    htmlContainer?: HTMLElement;
    caller?: string;
    performServiceConsistencyChecks?: () => boolean;
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
        ...getConfigurationServiceOverride(),
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

export const mergeServices = (overrideServices: monaco.editor.IEditorOverrideServices, services?: monaco.editor.IEditorOverrideServices) => {
    if (services !== undefined) {
        for (const [name, service] of Object.entries(services)) {
            overrideServices[name] = service;
        }
    }
};

export const initServices = async (vscodeApiConfig: VscodeApiConfig, instructions?: InitServicesInstructions) => {
    const envEnhanced = initEnhancedMonacoEnvironment();

    if (!(envEnhanced.vscodeInitialising ?? false)) {

        if (envEnhanced.vscodeApiInitialised ?? false) {
            instructions?.logger?.debug('Initialization of vscode services can only performed once!');
        } else {
            envEnhanced.vscodeInitialising = true;
            instructions?.logger?.debug(`Initializing vscode services. Caller: ${instructions.caller ?? 'unknown'}`);

            if (vscodeApiConfig.userConfiguration?.json !== undefined) {
                await initUserConfiguration(vscodeApiConfig.userConfiguration.json);
            }
            await importAllServices(vscodeApiConfig, instructions);

            vscodeApiConfig.viewsConfig?.htmlAugmentationInstructions?.(instructions?.htmlContainer);
            await vscodeApiConfig.viewsConfig?.viewsInitFunc?.();
            instructions?.logger?.debug('Initialization of vscode services completed successfully.');

            envEnhanced.vscodeApiInitialised = true;
            envEnhanced.vscodeInitialising = false;
        }
    }

    return envEnhanced.vscodeApiInitialised;
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
 *   - log
 *   - model
 */
export const importAllServices = async (vscodeApiConfig: VscodeApiConfig, instructions?: InitServicesInstructions) => {
    const services = await supplyRequiredServices();

    mergeServices(services, vscodeApiConfig.serviceOverrides);
    await configureExtHostWorker(vscodeApiConfig.enableExtHostWorker === true, services);

    reportServiceLoading(services, instructions?.logger);

    if (instructions?.performServiceConsistencyChecks === undefined ||
        (typeof instructions.performServiceConsistencyChecks === 'function' && instructions.performServiceConsistencyChecks())) {
        if (vscodeApiConfig.viewsConfig?.viewServiceType === 'ViewsService' || vscodeApiConfig.viewsConfig?.viewServiceType === 'WorkspaceService') {
            await initialize(services, instructions?.htmlContainer, vscodeApiConfig.workspaceConfig, vscodeApiConfig.envOptions);
        } else {
            await initialize(services, undefined, vscodeApiConfig.workspaceConfig, vscodeApiConfig.envOptions);
        }
    }

    setUnexpectedErrorHandler((e) => {
        instructions?.logger?.createErrorAndLog('Unexpected error', e);
    });
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
