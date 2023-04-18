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
    const lc: InitializeServiceConfig = config ?? {};
    const userServices = lc.userServices ?? {};

    const addService = (name: string, promise: Promise<unknown>) => {
        promises.push(promise);
        serviceNames.push(name);
    };

    if (lc.enableConfigurationService === true && lc.configurationServiceConfig !== undefined) {
        addService('configuration', import('vscode/service-override/configuration'));
    }
    // files service is required
    addService('files', import('vscode/service-override/files'));

    if (lc.enableDialogService === true) {
        addService('dialogs', import('vscode/service-override/dialogs'));
    }
    if (lc.enableNotificationService === true) {
        addService('notifications', import('vscode/service-override/notifications'));
    }
    if (lc.enableModelEditorService === true && lc.modelEditorServiceConfig !== undefined) {
        addService('modelEditor', import('vscode/service-override/modelEditor'));
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

    const reportServiceLoading = (origin: string, services: editor.IEditorOverrideServices) => {
        for (const serviceName of Object.keys(services)) {
            console.log(`Loading ${origin} service: ${serviceName}`);
        }
    };

    const mergeServices = (services: editor.IEditorOverrideServices, overrideServices: editor.IEditorOverrideServices) => {
        for (const [name, service] of Object.entries(services)) {
            overrideServices[name] = service;
        }
    };

    let count = 0;
    return Promise.all(Object.values(promises))
        .then((loadedImports) => {
            const overrideServices: editor.IEditorOverrideServices = {};
            if (userServices) {
                mergeServices(userServices, overrideServices);
                reportServiceLoading('user', userServices);
            }

            for (const loadedImport of loadedImports) {
                const serviceName = serviceNames[count];
                console.log(`Initialising provided service: ${serviceName}`);
                if (serviceNames[count] === 'modelEditor' && lc.enableModelEditorService) {
                    const {
                        default: getModelEditorServiceOverride
                    } = loadedImport as unknown as typeof import('vscode/service-override/modelEditor');
                    const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                        console.log('Trying to open a model', model, options, sideBySide);
                        return undefined;
                    };

                    let services = {};
                    if (lc.modelEditorServiceConfig?.useDefaultFunction) {
                        services = getModelEditorServiceOverride(defaultOpenEditorFunc);
                    } else if (lc.modelEditorServiceConfig?.openEditorFunc) {
                        services = getModelEditorServiceOverride(lc.modelEditorServiceConfig.openEditorFunc);
                    }
                    mergeServices(services, overrideServices);
                    reportServiceLoading('user', services);
                } else if (serviceNames[count] === 'configuration' && lc.enableConfigurationService) {
                    const {
                        default: getConfigurationServiceOverride
                    } = loadedImport as unknown as typeof import('vscode/service-override/configuration');
                    const uri = Uri.file(lc.configurationServiceConfig!.defaultWorkspaceUri);
                    const services = getConfigurationServiceOverride(uri);
                    mergeServices(services, overrideServices);
                    reportServiceLoading('user', services);
                } else {
                    // using the same import type here is a hack
                    const { default: getServiceOverride } = loadedImport as unknown as typeof import('vscode/service-override/files');
                    const services = getServiceOverride();
                    mergeServices(services, overrideServices);
                    reportServiceLoading('user', services);
                }
                count++;
            }

            return initializeMonacoService(overrideServices);
        }).catch(e => {
            return Promise.reject(e);
        });
};
