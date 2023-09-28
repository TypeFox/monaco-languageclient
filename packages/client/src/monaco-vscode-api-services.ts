/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment } from 'monaco-editor';
import { ILogService, initialize, LogLevel, StandaloneServices } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';

interface MonacoEnvironmentEnhanced extends Environment {
    vscodeApiInitialised: boolean;
}

export type InitializeServiceConfig = {
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
        console.log('initialize completed successfully');
    }
    await initializeVscodeExtensions();
    if (config?.debugLogging === true) {
        console.log('initializeVscodeExtensions completed successfully');
    }

    if (!window.MonacoEnvironment) {
        window.MonacoEnvironment = {};
    }
    (window.MonacoEnvironment as MonacoEnvironmentEnhanced).vscodeApiInitialised = true;
};

export const useOpenEditorStub: OpenEditor = async (modelRef, options, sideBySide) => {
    console.log('Received open editor call with parameters: ', modelRef, options, sideBySide);
    return undefined;
};

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
    const lc: InitializeServiceConfig = config ?? {};
    const userServices: editor.IEditorOverrideServices = lc.userServices ?? {};

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
    reportServiceLoading(userServices, lc.debugLogging === true, 'user');

    const haveThemeService = serviceNames.includes('theme') || Object.keys(userServices).includes('themeService');
    const haveTextmateService = serviceNames.includes('textmate') || Object.keys(userServices).includes('textMateTokenizationFeature');
    const haveMarkersService = serviceNames.includes('markers');
    const haveViewsService = serviceNames.includes('views') || Object.keys(userServices).includes('viewsService');

    // theme requires textmate
    if (haveThemeService && !haveTextmateService) {
        throw new Error('"theme" requires "textmate" service. Please add it to the "userServices".');
    }

    // markers service requires views service
    if (haveMarkersService && !haveViewsService) {
        throw new Error('"markers" requires "views" service. Please add it to the "userServices".');
    }

    await initialize(userServices);
    if (lc.logLevel) {
        StandaloneServices.get(ILogService).setLevel(lc.logLevel);
    }
};
