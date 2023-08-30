/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment, Uri } from 'monaco-editor';
import { ILogService, initialize as initializeMonacoService, LogLevel, StandaloneServices } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import type { OpenEditor } from 'vscode/service-override/editor';
import { ITerminalBackend, SimpleTerminalBackend } from 'vscode/service-override/terminal';
import { IStorageProvider } from 'vscode/service-override/storage';

interface MonacoEnvironmentEnhanced extends Environment {
    vscodeApiInitialised: boolean;
}

export type InitializeServiceConfig = {
    enableDialogService?: boolean;
    enableNotificationService?: boolean;
    enableModelService?: boolean;
    /**
     * editor service is the default. If you want to use the views service, set enableViewsService to true.
     */
    configureEditorOrViewsService?: {
        enableViewsService?: boolean;
        openEditorFunc?: OpenEditor
    };
    configureConfigurationService?: {
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
    enableOutputService?: boolean;
    configureTerminalService?: {
        backendImpl: SimpleTerminalBackend | ITerminalBackend
    }
    enableSearchService?: boolean;
    enableMarkersService?: boolean;
    enableAccessibilityService?: boolean;
    enableLanguageDetectionWorkerService?: boolean;
    /**
     * If no provider is specified, the default BrowserStorageService is used.
     */
    configureStorageService?: {
        provider?: IStorageProvider
    },
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

export type ModuleWithDefaultExport = {
    default: (x?: any) => editor.IEditorOverrideServices
}

/**
 * monaco-vscode-api automatically loads the following services:
 * - layout
 * - environment
 * - extension
 * - files
 * - quickAccess
 */
export const importAllServices = async (config?: InitializeServiceConfig) => {
    const serviceNames: string[] = [];
    const promises: Promise<ModuleWithDefaultExport>[] = [];
    const lc: InitializeServiceConfig = config ?? {};
    const userServices = lc.userServices ?? {};

    const addService = (name: string, promise: Promise<ModuleWithDefaultExport>) => {
        serviceNames.push(name);
        promises.push(promise);
    };

    if (lc.enableModelService === true) {
        addService('model', import('vscode/service-override/model'));
    }
    if (lc.configureEditorOrViewsService !== undefined) {
        if (lc.configureEditorOrViewsService.enableViewsService === true) {
            addService('views', import('vscode/service-override/views'));
        } else {
            addService('editor', import('vscode/service-override/editor'));
        }
    }
    if (lc.configureConfigurationService !== undefined) {
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
    if (lc.enableOutputService === true) {
        addService('output', import('vscode/service-override/output'));
    }
    if (lc.configureTerminalService !== undefined) {
        addService('terminal', import('vscode/service-override/terminal'));
    }
    if (lc.enableSearchService === true) {
        addService('search', import('vscode/service-override/search'));
    }
    if (lc.enableMarkersService === true) {
        addService('markers', import('vscode/service-override/markers'));
    }
    if (lc.enableAccessibilityService === true) {
        addService('accessibility', import('vscode/service-override/accessibility'));
    }
    if (lc.enableLanguageDetectionWorkerService === true) {
        addService('languageDetectionWorker', import('vscode/service-override/languageDetectionWorker'));
    }
    if (lc.enableLanguageDetectionWorkerService === true) {
        addService('languageDetectionWorker', import('vscode/service-override/languageDetectionWorker'));
    }

    const reportServiceLoading = (services: editor.IEditorOverrideServices, debugLogging: boolean, origin?: string) => {
        for (const serviceName of Object.keys(services)) {
            if (debugLogging) {
                if (origin) {
                    console.log(`Loading ${origin} service: ${serviceName}`);
                } else {
                    console.log(`Loading service: ${serviceName}`);
                }
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
        reportServiceLoading(userServices, lc.debugLogging === true, 'user');
    }

    const haveThemeService = serviceNames.includes('theme') || Object.keys(overrideServices).includes('themeService');
    const haveTextmateService = serviceNames.includes('textmate') || Object.keys(overrideServices).includes('textMateTokenizationFeature');
    const haveMarkersService = serviceNames.includes('markers');
    const haveViewsService = serviceNames.includes('views') || Object.keys(overrideServices).includes('viewsService');

    // theme requires textmate
    if (haveThemeService && !haveTextmateService) {
        throw new Error('"theme" requires "textmate" service. Please add it to the "initServices" config.');
    }

    // markers service requires views service
    if (haveMarkersService && !haveViewsService) {
        throw new Error('"markers" requires "views" service. Please add it to the "initServices" config.');
    }

    for (const loadedImport of loadedImports) {
        const serviceName = serviceNames[count];
        if (lc.debugLogging === true) {
            console.log(`Initialising provided service: ${serviceName}`);
        }

        let services: editor.IEditorOverrideServices = {};
        if (serviceName === 'editor' || serviceName === 'views') {
            if (lc.configureEditorOrViewsService?.openEditorFunc) {
                services = loadedImport.default(lc.configureEditorOrViewsService.openEditorFunc);
            } else {
                const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                    console.log('Trying to open a model', model, options, sideBySide);
                    return undefined;
                };
                services = loadedImport.default(defaultOpenEditorFunc);
            }
        } else if (serviceName === 'configuration') {
            if (lc.configureConfigurationService?.defaultWorkspaceUri) {
                const uri = Uri.file(lc.configureConfigurationService!.defaultWorkspaceUri);
                services = loadedImport.default(uri);
            }
        } else if (serviceName === 'terminal') {
            if (lc.configureTerminalService?.backendImpl) {
                services = loadedImport.default(lc.configureTerminalService.backendImpl);
            }
        } else if (serviceName === 'storage') {
            services = loadedImport.default(lc.configureStorageService?.provider);
        } else {
            services = loadedImport.default();
        }

        mergeServices(services, overrideServices);
        reportServiceLoading(services, lc.debugLogging === true);

        count++;
    }

    await initializeMonacoService(overrideServices);
    if (lc.logLevel) {
        StandaloneServices.get(ILogService).setLevel(lc.logLevel);
    }
};
