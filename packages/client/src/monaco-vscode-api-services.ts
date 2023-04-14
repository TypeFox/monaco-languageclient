/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import type { OpenEditor } from 'vscode/service-override/modelEditor';

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
        defaultWorkspaceUri: Uri;
    };
    enableThemeService?: boolean;
    enableKeybindingsService?: boolean;
    enableTextmateService?: boolean;
    enableLanguagesService?: boolean;
    enableAudioCueService?: boolean;
    enableDebugService?: boolean;
    enablePreferencesService?: boolean;
    userServices?: editor.IEditorOverrideServices;
};

export const initServices = async (config?: InitializeServiceConfig) => {
    await importAllServices(config)
        .then(() => console.log('initializeMonacoService completed successfully'))
        .then(async () => await initializeVscodeExtensions())
        .then(() => console.log('initializeVscodeExtensions completed successfully'))
        .catch((e: Error) => { throw e; });
};

const importAllServices = async (config?: InitializeServiceConfig) => {
    const promises: Promise<unknown>[] = [];
    const serviceNames: string[] = [];
    if (!config) {
        config = {};
    }

    const addService = (name: string, promise: Promise<unknown>) => {
        promises.push(promise);
        serviceNames.push(name);
    };

    // files service is required
    addService('files', import('vscode/service-override/files'));

    if (config.enableDialogService === true) {
        addService('dialogs', import('vscode/service-override/dialogs'));
    }
    if (config.enableNotificationService === true) {
        addService('notifications', import('vscode/service-override/notifications'));
    }
    if (config.enableModelEditorService === true && config.modelEditorServiceConfig !== undefined) {
        addService('modelEditor', import('vscode/service-override/modelEditor'));
    }
    if (config.enableConfigurationService === true && config.configurationServiceConfig !== undefined) {
        addService('configuration', import('vscode/service-override/configuration'));
    }
    if (config.enableThemeService === true) {
        addService('theme', import('vscode/service-override/theme'));
        // theme requires textmate
        config.enableTextmateService = true;
    }
    if (config.enableTextmateService === true) {
        addService('textmate', import('vscode/service-override/textmate'));
    }
    if (config.enableKeybindingsService === true) {
        addService('keybindings', import('vscode/service-override/keybindings'));
    }
    if (config.enableLanguagesService === true) {
        addService('languages', import('vscode/service-override/languages'));
    }
    if (config.enableAudioCueService === true) {
        addService('audioCue', import('vscode/service-override/audioCue'));
    }
    if (config.enableDebugService === true) {
        addService('debug', import('vscode/service-override/debug'));
    }
    if (config.enablePreferencesService === true) {
        addService('preferences', import('vscode/service-override/preferences'));
    }

    const reportServiceLoading = (origin: string, services: editor.IEditorOverrideServices) => {
        for (const serviceName of Object.keys(services)) {
            console.log(`Loading ${origin} service: ${serviceName}`);
        }
    };

    let count = 0;
    return Promise.all(Object.values(promises))
        .then((loadedImports) => {
            let overrideServices: editor.IEditorOverrideServices = {};
            if (config?.userServices) {
                overrideServices = { overrideServices, ...config?.userServices };
                reportServiceLoading('user', overrideServices);
            }

            for (const loadedImport of loadedImports) {
                const serviceName = serviceNames[count];
                console.log(`Initialising provided service: ${serviceName}`);
                if (serviceNames[count] === 'modelEditor') {
                    const {
                        default: getModelEditorServiceOverride
                    } = loadedImport as unknown as typeof import('vscode/service-override/modelEditor');
                    const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                        console.log('Trying to open a model', model, options, sideBySide);
                        return undefined;
                    };

                    let services = {};
                    if (config?.modelEditorServiceConfig?.useDefaultFunction) {
                        services = { ...getModelEditorServiceOverride(defaultOpenEditorFunc) };
                    } else if (config?.modelEditorServiceConfig?.openEditorFunc) {
                        services = { ...getModelEditorServiceOverride(config.modelEditorServiceConfig.openEditorFunc) };
                    }
                    reportServiceLoading('provided', services);
                    overrideServices = { ...overrideServices, ...services };
                } else if (serviceNames[count] === 'configuration') {
                    const {
                        default: getConfigurationServiceOverride
                    } = loadedImport as unknown as typeof import('vscode/service-override/configuration');
                    const services = { ...getConfigurationServiceOverride(config!.configurationServiceConfig!.defaultWorkspaceUri) };
                    reportServiceLoading('provided', services);
                    overrideServices = { ...overrideServices, services };
                } else {
                    // using the same import type here is a hack
                    const { default: getServiceOverride } = loadedImport as unknown as typeof import('vscode/service-override/files');
                    const services = { ...getServiceOverride() };
                    reportServiceLoading('provided', services);
                    overrideServices = { ...overrideServices, ...services };
                }
                count++;
            }
            return initializeMonacoService(overrideServices);
        });
};
