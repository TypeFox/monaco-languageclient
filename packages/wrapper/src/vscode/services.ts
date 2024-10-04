/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import { LogLevel } from 'vscode/services';
import { mergeServices, VscodeApiConfig } from 'monaco-languageclient/vscode/services';

export interface VscodeServicesConfig {
    vscodeApiConfig: VscodeApiConfig;
    specificServices: monaco.editor.IEditorOverrideServices;
    logLevel: LogLevel
    semanticHighlighting?: boolean;
}

/**
 * Child classes are allow to override the services configuration implementation.
 */
export const configureVscodeApi = async (config: VscodeServicesConfig): Promise<VscodeApiConfig> => {
    const vscodeApiConfig = config.vscodeApiConfig;
    // set empty object if undefined
    vscodeApiConfig.userServices = vscodeApiConfig.userServices ?? {};

    // import configuration service if it is not available
    if (vscodeApiConfig.userServices.configurationService === undefined) {
        const getConfigurationServiceOverride = (await import('@codingame/monaco-vscode-configuration-service-override')).default;
        const mlcDefautServices = {
            ...getConfigurationServiceOverride()
        };
        mergeServices(mlcDefautServices, vscodeApiConfig.userServices);
    }

    let extra = {};
    if (vscodeApiConfig.viewsConfig !== undefined) {
        if (vscodeApiConfig.viewsConfig.viewServiceType === 'ViewsService') {
            const getViewsServiceOverride = (await import('@codingame/monaco-vscode-views-service-override')).default;
            extra = {
                ...getViewsServiceOverride(vscodeApiConfig.viewsConfig.openEditorFunc ?? useOpenEditorStub)
            };
        } else if (vscodeApiConfig.viewsConfig.viewServiceType === 'WorkspaceService') {
            const getWorkbenchServiceOverride = (await import('@codingame/monaco-vscode-workbench-service-override')).default;
            extra = {
                ...getWorkbenchServiceOverride()
            };
        }
    }

    // if nothing was added above, add the standard
    if (Object.keys(extra).length === 0) {
        const getEditorServiceOverride = (await import('@codingame/monaco-vscode-editor-service-override')).default;
        extra = {
            ...getEditorServiceOverride(vscodeApiConfig.viewsConfig?.openEditorFunc ?? useOpenEditorStub)
        };
    }
    mergeServices(extra, vscodeApiConfig.userServices);

    // adding the default workspace config if not provided
    if (vscodeApiConfig.workspaceConfig === undefined) {
        vscodeApiConfig.workspaceConfig = {
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
    mergeServices(config.specificServices, vscodeApiConfig.userServices);

    // set the log-level via the development settings
    const devLogLevel = vscodeApiConfig.workspaceConfig.developmentOptions?.logLevel;

    if (devLogLevel === undefined) {

        // this needs to be done so complicated, because developmentOptions is read-only
        const devOptions: Record<string, unknown> = {
            ...vscodeApiConfig.workspaceConfig.developmentOptions
        };
        devOptions.logLevel = config.logLevel;
        (vscodeApiConfig.workspaceConfig.developmentOptions as Record<string, unknown>) = Object.assign({}, devOptions);
    } else if (devLogLevel !== config.logLevel) {

        throw new Error(`You have configured mismatching logLevels: ${config.logLevel} (wrapperConfig) ${devLogLevel} (workspaceConfig.developmentOptions)`);
    }

    // enable semantic highlighting in the default configuration
    if (config.semanticHighlighting ?? false) {
        const configDefaults: Record<string, unknown> = {
            ...vscodeApiConfig.workspaceConfig.configurationDefaults
        };
        configDefaults['editor.semanticHighlighting.enabled'] = true;
        (vscodeApiConfig.workspaceConfig.configurationDefaults as Record<string, unknown>) = Object.assign({}, configDefaults);
    }

    return vscodeApiConfig;
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
