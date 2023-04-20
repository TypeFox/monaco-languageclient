/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import type { OpenEditor } from 'vscode/service-override/modelEditor';

interface MonacoEnvironmentEnhanced extends Environment {
    vscodeApiInitialised: boolean;
}

export type InitializeServiceConfig = {
    enableDialogService?: boolean;
    enableNotificationService?: boolean;
    enableModelEditorService?: boolean;
    modelEditorServiceConfig?: {
        useDefaultFunction: boolean;
        openEditorFunc?: OpenEditor
    };
    enableConfigurationService?: boolean
    configurationServiceConfig?: {
        defaultWorkspaceUri: string;
    };
    enableThemeService?: boolean;
    enableKeybindingsService?: boolean;
    enableTextmateService?: boolean;
    enableLanguagesService?: boolean;
    enableAudioCueService?: boolean;
    enableDebugService?: boolean;
    enablePreferencesService?: boolean;
    userServices?: editor.IEditorOverrideServices;
    debugLogging?: boolean;
};

export const wasVscodeApiInitialized = () => {
    return (window.MonacoEnvironment as MonacoEnvironmentEnhanced)?.vscodeApiInitialised === true;
};

export const initServices = async (config?: InitializeServiceConfig) => {
    await importAllServices(config);
    if (config?.debugLogging === true) {
        console.log('initializeMonacoService completed successfully');
    }
    await initializeVscodeExtensions();
    if (config?.debugLogging === true) {
        console.log('initializeVscodeExtensions completed successfully');
    }

    (window.MonacoEnvironment as MonacoEnvironmentEnhanced ?? {}).vscodeApiInitialised = true;
};

type ModuleWithDefaultExport = {
    default: (x?: any) => editor.IEditorOverrideServices
}

const importAllServices = async (config?: InitializeServiceConfig) => {
    const promises: Promise<ModuleWithDefaultExport>[] = [];
    const serviceNames: string[] = [];
    const lc: InitializeServiceConfig = config ?? {};
    const userServices = lc.userServices ?? {};

    const addService = (name: string, promise: Promise<ModuleWithDefaultExport>) => {
        promises.push(promise);
        serviceNames.push(name);
    };

    // files service is required
    addService('files', import('vscode/service-override/files'));

    if (lc.enableModelEditorService === true && lc.modelEditorServiceConfig !== undefined) {
        addService('modelEditor', import('vscode/service-override/modelEditor'));
    }
    if (lc.enableConfigurationService === true && lc.configurationServiceConfig !== undefined) {
        addService('configuration', import('vscode/service-override/configuration'));
    }
    if (lc.enableDialogService === true) {
        addService('dialogs', import('vscode/service-override/dialogs'));
    }
    if (lc.enableNotificationService === true) {
        addService('notifications', import('vscode/service-override/notifications'));
    }
    if (lc.enableThemeService === true) {
        addService('theme', import('vscode/service-override/theme'));
        // theme requires textmate
        lc.enableTextmateService = true;
    }
    if (lc.enableTextmateService === true) {
        addService('textmate', import('vscode/service-override/textmate'));
    }
    if (lc.enableKeybindingsService === true) {
        addService('keybindings', import('vscode/service-override/keybindings'));
    }
    if (lc.enableLanguagesService === true) {
        addService('languages', import('vscode/service-override/languages'));
    }
    if (lc.enableAudioCueService === true) {
        addService('audioCue', import('vscode/service-override/audioCue'));
    }
    if (lc.enableDebugService === true) {
        addService('debug', import('vscode/service-override/debug'));
    }
    if (lc.enablePreferencesService === true) {
        addService('preferences', import('vscode/service-override/preferences'));
    }

    const reportServiceLoading = (origin: string, services: editor.IEditorOverrideServices, debugLogging: boolean) => {
        for (const serviceName of Object.keys(services)) {
            if (debugLogging) {
                console.log(`Loading ${origin} service: ${serviceName}`);
            }
        }
    };

    const mergeServices = (services: editor.IEditorOverrideServices, overrideServices: editor.IEditorOverrideServices) => {
        for (const [name, service] of Object.entries(services)) {
            overrideServices[name] = service;
        }
    };

    let count = 0;
    const loadedImports = await Promise.all(Object.values(promises));
    const overrideServices: editor.IEditorOverrideServices = {};
    if (userServices) {
        mergeServices(userServices, overrideServices);
        reportServiceLoading('user', userServices, lc.debugLogging === true);
    }

    for (const loadedImport of loadedImports) {
        const serviceName = serviceNames[count];
        if (lc.debugLogging === true) {
            console.log(`Initialising provided service: ${serviceName}`);
        }

        let services: editor.IEditorOverrideServices = {};
        if (serviceName === 'modelEditor' && lc.enableModelEditorService) {
            const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                console.log('Trying to open a model', model, options, sideBySide);
                return undefined;
            };

            if (lc.modelEditorServiceConfig?.useDefaultFunction) {
                services = loadedImport.default(defaultOpenEditorFunc);
            } else if (lc.modelEditorServiceConfig?.openEditorFunc) {
                services = loadedImport.default(lc.modelEditorServiceConfig.openEditorFunc);
            }
        } else if (serviceName === 'configuration' && lc.enableConfigurationService) {
            const uri = Uri.file(lc.configurationServiceConfig!.defaultWorkspaceUri);
            services = loadedImport.default(uri);
        } else {
            services = loadedImport.default();
        }

        mergeServices(services, overrideServices);
        reportServiceLoading('user', services, lc.debugLogging === true);

        count++;
    }

    await initializeMonacoService(overrideServices);
};
