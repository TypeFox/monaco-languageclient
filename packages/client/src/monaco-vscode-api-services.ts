/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { editor, Environment } from 'monaco-editor';
import { ILogService, initialize, LogLevel, StandaloneServices } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';

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
 *
 * monaco-languageclient always adds the following services:
 *   - languages
 *   - model
 */
export const importAllServices = async (config?: InitializeServiceConfig) => {
    const serviceNames: string[] = [];
    const lc: InitializeServiceConfig = config ?? {};
    const userServices: editor.IEditorOverrideServices = lc.userServices ?? {};

    const mlcDefautServices = {
        ...getLanguagesServiceOverride(),
        ...getModelServiceOverride()
    };
    mergeServices(mlcDefautServices, userServices);
    reportServiceLoading(userServices, lc.debugLogging === true);

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
