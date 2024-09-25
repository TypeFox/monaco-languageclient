/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import { LogLevel } from 'vscode/services';
import { mergeServices, InitializeServiceConfig } from 'monaco-languageclient/vscode/services';

export interface VscodeServicesConfig {
    serviceConfig: InitializeServiceConfig;
    specificServices: monaco.editor.IEditorOverrideServices;
    logLevel: LogLevel
}

/**
 * Child classes are allow to override the services configuration implementation.
 */
export const configureServices = async (config: VscodeServicesConfig): Promise<InitializeServiceConfig> => {
    const serviceConfig = config.serviceConfig;
    // set empty object if undefined
    serviceConfig.userServices = serviceConfig.userServices ?? {};

    // import configuration service if it is not available
    if (serviceConfig.userServices.configurationService === undefined) {
        const getConfigurationServiceOverride = (await import('@codingame/monaco-vscode-configuration-service-override')).default;
        const mlcDefautServices = {
            ...getConfigurationServiceOverride()
        };
        mergeServices(mlcDefautServices, serviceConfig.userServices);
    }

    // adding the default workspace config if not provided
    if (serviceConfig.workspaceConfig === undefined) {
        serviceConfig.workspaceConfig = {
            workspaceProvider: {
                trusted: true,
                workspace: {
                    workspaceUri: vscode.Uri.file('/workspace.code-workspace')
                },
                async open() {
                    window.open(window.location.href);
                    return true;
                }
            }
        };
    }
    mergeServices(config.specificServices, serviceConfig.userServices);

    // set the log-level via the development settings
    const devLogLevel = serviceConfig.workspaceConfig.developmentOptions?.logLevel;
    if (serviceConfig.workspaceConfig.developmentOptions?.logLevel === undefined) {

        // this needs to be done so complicated, because developmentOptions is read-only
        const devOptions = (serviceConfig.workspaceConfig.developmentOptions as unknown as Record<string, unknown> | undefined) ?? {};
        devOptions.logLevel = config.logLevel;
        (serviceConfig.workspaceConfig.developmentOptions as Record<string, unknown>) = Object.assign(serviceConfig.workspaceConfig.developmentOptions ?? {}, devOptions);
    } else if (devLogLevel !== config.logLevel) {

        throw new Error(`You have configured mismatching logLevels: ${config.logLevel} (wrapperConfig) ${devLogLevel} (workspaceConfig.developmentOptions)`);
    }

    return serviceConfig;
};

export const useOpenEditorStub: OpenEditor = async (modelRef, options, sideBySide) => {
    console.log('Received open editor call with parameters: ', modelRef, options, sideBySide);
    return undefined;
};

export const checkServiceConsistency = (userServices?: monaco.editor.IEditorOverrideServices) => {
    const haveThemeService = Object.keys(userServices ?? {}).includes('themeService');
    const haveTextmateService = Object.keys(userServices ?? {}).includes('textMateTokenizationFeature');
    const haveMarkersService = Object.keys(userServices ?? {}).includes('markersService');
    const haveViewsService = Object.keys(userServices ?? {}).includes('viewsService');

    // theme requires textmate
    if (haveThemeService && !haveTextmateService) {
        throw new Error('"theme" service requires "textmate" service. Please add it to the "userServices".');
    }

    // markers service requires views service
    if (haveMarkersService && !haveViewsService) {
        throw new Error('"markers" service requires "views" service. Please add it to the "userServices".');
    }

    // we end up here if no exceptions were thrown
    return true;
};
