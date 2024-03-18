/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment } from 'monaco-editor';
import { ILogService, initialize, IWorkbenchConstructionOptions, StandaloneServices } from 'vscode/services';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';

export interface MonacoEnvironmentEnhanced extends Environment {
    vscodeInitialising?: boolean;
    vscodeApiInitialised?: boolean;
}

export type InitializeServiceConfig = {
    userServices?: editor.IEditorOverrideServices;
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
    const userServices: editor.IEditorOverrideServices = lc.userServices ?? {};

    const lcRequiredServices = await supplyRequiredServices();
    mergeServices(lcRequiredServices, userServices);
    reportServiceLoading(userServices, lc.debugLogging === true);

    if (performChecks === undefined || performChecks()) {
        await initialize(userServices);
        const logLevel = lc.workspaceConfig?.developmentOptions?.logLevel;
        if (logLevel) {
            StandaloneServices.get(ILogService).setLevel(logLevel);
        }
    }
};
