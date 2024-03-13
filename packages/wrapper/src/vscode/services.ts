/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Uri } from '@codingame/monaco-vscode-editor-api';
import { ILogService, initialize, IWorkbenchConstructionOptions, StandaloneServices } from 'vscode/services';
import 'vscode/localExtensionHost';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import { MonacoEnvironmentEnhanced } from '../workerFactory.js';
import { supplyRequiredServices } from 'monaco-languageclient';
import { Logger } from '../logger.js';

export type InitializeServiceConfig = {
    userServices?: editor.IEditorOverrideServices;
    debugLogging?: boolean;
    workspaceConfig?: IWorkbenchConstructionOptions;
};

/**
     * Child classes are allow to override the services configuration implementation.
     */
export const configureServices = async (input?: InitializeServiceConfig, specificServices?: editor.IEditorOverrideServices, logger?: Logger): Promise<InitializeServiceConfig> => {
    const serviceConfig = input ?? {};
    // configure log level
    serviceConfig.debugLogging = logger?.isEnabled() === true && (serviceConfig.debugLogging === true || logger?.isDebugEnabled() === true);

    // always set required services if not configured
    serviceConfig.userServices = serviceConfig.userServices ?? {};
    const configureService = serviceConfig.userServices.configurationService ?? undefined;
    const workspaceConfig = serviceConfig.workspaceConfig ?? undefined;

    if (!configureService) {
        const getConfigurationServiceOverride = (await import('@codingame/monaco-vscode-configuration-service-override')).default;
        const mlcDefautServices = {
            ...getConfigurationServiceOverride()
        };
        mergeServices(mlcDefautServices, serviceConfig.userServices);

        if (workspaceConfig) {
            throw new Error('You provided a workspaceConfig without using the configurationServiceOverride');
        }
    }
    // adding the default workspace config if not provided
    if (!workspaceConfig) {
        serviceConfig.workspaceConfig = {
            workspaceProvider: {
                trusted: true,
                workspace: {
                    workspaceUri: Uri.file('/workspace')
                },
                async open() {
                    return false;
                }
            }
        };
    }
    mergeServices(specificServices ?? {}, serviceConfig.userServices);

    return serviceConfig;
};

export const initServices = async (config?: InitializeServiceConfig, caller?: string) => {
    if (!window.MonacoEnvironment) {
        window.MonacoEnvironment = {};
    }
    const envEnhanced = (window.MonacoEnvironment as MonacoEnvironmentEnhanced);
    if (envEnhanced.vscodeApiInitialised === undefined) {
        envEnhanced.vscodeApiInitialised = false;
    }
    if (envEnhanced.vscodeInitialising === undefined) {
        envEnhanced.vscodeInitialising = false;
    }

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
            await importAllServices(config);
            if (config?.debugLogging === true) {
                console.log('Initialization of vscode services completed successfully.');
            }
            envEnhanced.vscodeApiInitialised = true;
        }
    }
};

export const useOpenEditorStub: OpenEditor = async (modelRef, options, sideBySide) => {
    console.log('Received open editor call with parameters: ', modelRef, options, sideBySide);
    return undefined;
};

export const reportServiceLoading = (services: editor.IEditorOverrideServices, debugLogging: boolean) => {
    for (const serviceName of Object.keys(services)) {
        if (debugLogging) {
            console.log(`Loading service: ${serviceName}`);
        }
    }
};

export const mergeServices = (services: editor.IEditorOverrideServices, overrideServices: editor.IEditorOverrideServices) => {
    for (const [name, service] of Object.entries(services)) {
        overrideServices[name] = service;
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
export const importAllServices = async (config?: InitializeServiceConfig) => {
    const lc: InitializeServiceConfig = config ?? {};
    const userServices: editor.IEditorOverrideServices = lc.userServices ?? {};

    const lcRequiredServices = await supplyRequiredServices();
    mergeServices(lcRequiredServices, userServices);
    reportServiceLoading(userServices, lc.debugLogging === true);

    const haveThemeService = Object.keys(userServices).includes('themeService');
    const haveTextmateService = Object.keys(userServices).includes('textMateTokenizationFeature');
    const haveMarkersService = Object.keys(userServices).includes('markersService');
    const haveViewsService = Object.keys(userServices).includes('viewsService');

    // theme requires textmate
    if (haveThemeService && !haveTextmateService) {
        throw new Error('"theme" service requires "textmate" service. Please add it to the "userServices".');
    }

    // markers service requires views service
    if (haveMarkersService && !haveViewsService) {
        throw new Error('"markers" service requires "views" service. Please add it to the "userServices".');
    }

    await initialize(userServices);
    const logLevel = lc.workspaceConfig?.developmentOptions?.logLevel;
    if (logLevel) {
        StandaloneServices.get(ILogService).setLevel(logLevel);
    }
};
