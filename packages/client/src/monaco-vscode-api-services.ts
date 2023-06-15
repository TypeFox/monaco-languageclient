/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { ILogService, initialize as initializeMonacoService, LogLevel, StandaloneServices } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import type { OpenEditor } from 'vscode/service-override/editor';
import { ITerminalBackend, SimpleTerminalBackend } from 'vscode/service-override/terminal';

interface MonacoEnvironmentEnhanced extends Environment {
    vscodeApiInitialised: boolean;
}

export type InitializeServiceConfig = {
    enableFilesService?: boolean;
    enableDialogService?: boolean;
    enableNotificationService?: boolean;
    enableModelService?: boolean;
    configureEditorOrViewsServiceConfig?: {
        enableViewsService: boolean;
        useDefaultOpenEditorFunction: boolean;
        openEditorFunc?: OpenEditor
    };
    configureConfigurationServiceConfig?: {
        defaultWorkspaceUri: string;
    };
    enableThemeService?: boolean;
    enableKeybindingsService?: boolean;
    enableTextmateService?: boolean;
    enableLanguagesService?: boolean;
    enableAudioCueService?: boolean;
    enableDebugService?: boolean;
    enablePreferencesService?: boolean;
    enableSnippetsService?: boolean;
    enableQuickaccessService?: boolean;
    enableOutputService?: boolean;
    configureTerminalServiceConfig?: {
        backendImpl: SimpleTerminalBackend | ITerminalBackend
    }
    enableSearchService?: boolean;
    enableMarkersService?: boolean;
    userServices?: editor.IEditorOverrideServices;
    debugLogging?: boolean;
    logLevel?: LogLevel
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

    if (!window.MonacoEnvironment) {
        window.MonacoEnvironment = {
            createTrustedTypesPolicy: (_policyName: string) => {
                return undefined;
            }
        };
    }
    (window.MonacoEnvironment as MonacoEnvironmentEnhanced).vscodeApiInitialised = true;
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

    if (lc.enableFilesService === true) {
        addService('files', import('vscode/service-override/files'));
    }
    if (lc.enableModelService === true) {
        addService('model', import('vscode/service-override/model'));
    }
    if (lc.configureEditorOrViewsServiceConfig !== undefined) {
        if (lc.configureEditorOrViewsServiceConfig.enableViewsService) {
            addService('views', import('vscode/service-override/views'));
        } else {
            addService('editor', import('vscode/service-override/editor'));
        }
    }
    if (lc.configureConfigurationServiceConfig !== undefined) {
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
    if (lc.enableSnippetsService === true) {
        addService('snippets', import('vscode/service-override/snippets'));
    }
    if (lc.enableQuickaccessService === true) {
        addService('quickaccess', import('vscode/service-override/quickaccess'));
    }
    if (lc.enableOutputService === true) {
        addService('output', import('vscode/service-override/output'));
    }
    if (lc.configureTerminalServiceConfig !== undefined) {
        addService('terminal', import('vscode/service-override/terminal'));
    }
    if (lc.enableSearchService === true) {
        addService('search', import('vscode/service-override/search'));
    }
    if (lc.enableMarkersService === true) {
        addService('markers', import('vscode/service-override/markers'));
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

    // files service is required
    if (!serviceNames.includes('files') && !Object.keys(overrideServices).includes('fileService')) {
        throw new Error('"files" service was not configured, but it is mandatory. Please add it to the "initServices" config.');
    }

    // theme requires textmate
    if ((serviceNames.includes('theme') || Object.keys(overrideServices).includes('themeService')) &&
        !(serviceNames.includes('textmate') || Object.keys(overrideServices).includes('textMateTokenizationFeature'))) {
        throw new Error('"theme" requires "textmate" service. Please add it to the "initServices" config.');
    }

    // quickaccess requires keybindings
    if ((serviceNames.includes('quickaccess') || Object.keys(overrideServices).includes('quickInputService')) &&
        !(serviceNames.includes('keybindings') || Object.keys(overrideServices).includes('keybindingService'))) {
        throw new Error('"quickaccess" requires "keybindings" service. Please add it to the "initServices" config.');
    }
    if (serviceNames.includes('markers') &&
        !(serviceNames.includes('views') || Object.keys(overrideServices).includes('viewsService'))) {
        throw new Error('"markers" requires "views" service. Please add it to the "initServices" config.');
    }

    for (const loadedImport of loadedImports) {
        const serviceName = serviceNames[count];
        if (lc.debugLogging === true) {
            console.log(`Initialising provided service: ${serviceName}`);
        }

        let services: editor.IEditorOverrideServices = {};
        if (serviceName === 'editor' || serviceName === 'views') {
            if (lc.configureEditorOrViewsServiceConfig!.useDefaultOpenEditorFunction) {
                const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                    console.log('Trying to open a model', model, options, sideBySide);
                    return undefined;
                };
                services = loadedImport.default(defaultOpenEditorFunc);
            } else if (lc.configureEditorOrViewsServiceConfig?.openEditorFunc) {
                services = loadedImport.default(lc.configureEditorOrViewsServiceConfig.openEditorFunc);
            }
        } else if (serviceName === 'configuration') {
            if (lc.configureConfigurationServiceConfig?.defaultWorkspaceUri) {
                const uri = Uri.file(lc.configureConfigurationServiceConfig!.defaultWorkspaceUri);
                services = loadedImport.default(uri);
            }
        } else if (serviceName === 'terminal') {
            if (lc.configureTerminalServiceConfig?.backendImpl) {
                services = loadedImport.default(lc.configureTerminalServiceConfig.backendImpl);
            }
        } else {
            services = loadedImport.default();
        }

        mergeServices(services, overrideServices);
        reportServiceLoading('user', services, lc.debugLogging === true);

        count++;
    }

    await initializeMonacoService(overrideServices);
    if (lc.logLevel) {
        StandaloneServices.get(ILogService).setLevel(lc.logLevel);
    }
};
