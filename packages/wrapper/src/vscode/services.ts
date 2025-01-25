/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as monaco from 'monaco-editor';
import { OpenEditor } from '@codingame/monaco-vscode-editor-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api/services';
import { mergeServices, ViewsConfig, VscodeApiConfig } from 'monaco-languageclient/vscode/services';

export type OverallConfigType = 'extended' | 'classic';

export interface VscodeServicesConfig {
    vscodeApiConfig: VscodeApiConfig;
    logLevel: LogLevel
    semanticHighlighting?: boolean;
}

/**
 * Child classes are allow to override the services configuration implementation.
 */
export const augmentVscodeApiConfig = async ($type: OverallConfigType, config: VscodeServicesConfig): Promise<VscodeApiConfig> => {
    const vscodeApiConfig = config.vscodeApiConfig;
    // set empty object if undefined
    const services: monaco.editor.IEditorOverrideServices = vscodeApiConfig.serviceOverrides ?? {};

    // import configuration service if it is not available
    if (services.configurationService === undefined) {
        const getConfigurationServiceOverride = (await import('@codingame/monaco-vscode-configuration-service-override')).default;
        mergeServices(services, {
            ...getConfigurationServiceOverride()
        });
    }

    await augmentHighlightingServices($type, services);
    await augmentViewsServices(services, vscodeApiConfig.viewsConfig);

    // ensures "vscodeApiConfig.workspaceConfig" is available
    augmentWorkspaceConfig(vscodeApiConfig);

    augmentDevLogLevel(vscodeApiConfig, config.logLevel);

    augmentSemanticHighlighting(vscodeApiConfig, config.semanticHighlighting);

    vscodeApiConfig.serviceOverrides = services;

    return vscodeApiConfig;
};

export const augmentHighlightingServices = async ($type: OverallConfigType, services: monaco.editor.IEditorOverrideServices) => {
    if ($type === 'extended') {
        const getTextmateServiceOverride = (await import('@codingame/monaco-vscode-textmate-service-override')).default;
        const getThemeServiceOverride = (await import('@codingame/monaco-vscode-theme-service-override')).default;
        mergeServices(services, {
            ...getTextmateServiceOverride(),
            ...getThemeServiceOverride()
        });
    } else {
        const getMonarchServiceOverride = (await import('@codingame/monaco-vscode-monarch-service-override')).default;
        mergeServices(services, {
            ...getMonarchServiceOverride()
        });
    }
};

export const augmentViewsServices = async (services: monaco.editor.IEditorOverrideServices, viewsConfig?: ViewsConfig) => {
    if (viewsConfig?.viewServiceType === 'ViewsService') {
        const getViewsServiceOverride = (await import('@codingame/monaco-vscode-views-service-override')).default;
        mergeServices(services, {
            ...getViewsServiceOverride(viewsConfig.openEditorFunc ?? useOpenEditorStub)
        });
    } else if (viewsConfig?.viewServiceType === 'WorkspaceService') {
        const getWorkbenchServiceOverride = (await import('@codingame/monaco-vscode-workbench-service-override')).default;
        mergeServices(services, {
            ...getWorkbenchServiceOverride()
        });
    } else {
        const getEditorServiceOverride = (await import('@codingame/monaco-vscode-editor-service-override')).default;
        mergeServices(services, {
            ...getEditorServiceOverride(viewsConfig?.openEditorFunc ?? useOpenEditorStub)
        });
    }
};

/**
 * Adding the default workspace config if not provided
 */
export const augmentWorkspaceConfig = (vscodeApiConfig: VscodeApiConfig) => {
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
};

/**
 * set the log-level via the development settings
 */
export const augmentDevLogLevel = (vscodeApiConfig: VscodeApiConfig, logLevel: LogLevel) => {
    const devLogLevel = vscodeApiConfig.workspaceConfig!.developmentOptions?.logLevel;

    if (devLogLevel === undefined) {

        // this needs to be done so complicated, because developmentOptions is read-only
        const devOptions: Record<string, unknown> = {
            ...vscodeApiConfig.workspaceConfig!.developmentOptions
        };
        devOptions.logLevel = logLevel;
        (vscodeApiConfig.workspaceConfig!.developmentOptions as Record<string, unknown>) = Object.assign({}, devOptions);
    } else if (devLogLevel !== logLevel) {

        throw new Error(`You have configured mismatching logLevels: ${logLevel} (wrapperConfig) ${devLogLevel} (workspaceConfig.developmentOptions)`);
    }
};

/**
 * enable semantic highlighting in the default configuration
 */
export const augmentSemanticHighlighting = (vscodeApiConfig: VscodeApiConfig, semanticHighlighting?: boolean) => {
    if (semanticHighlighting ?? false) {
        const configDefaults: Record<string, unknown> = {
            ...vscodeApiConfig.workspaceConfig!.configurationDefaults
        };
        configDefaults['editor.semanticHighlighting.enabled'] = true;
        (vscodeApiConfig.workspaceConfig!.configurationDefaults as Record<string, unknown>) = Object.assign({}, configDefaults);
    }
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
