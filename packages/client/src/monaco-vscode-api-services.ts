/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'monaco-editor/esm/vs/editor/edcore.main.js';
import { editor, Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import type { OpenEditor } from 'vscode/service-override/modelEditor';

type ServiceOverride = {} | editor.IEditorOverrideServices;

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
        defaultWorkspaceUri: Uri;
    };
    enableThemeService?: boolean;
    enableKeybindingsService?: boolean;
    enableTextmateService?: boolean;
    enableLanguagesService?: boolean;
    enableAudioCueService?: boolean;
    enableDebugService?: boolean;
    enablePreferencesService?: boolean;
};

export const initServices = async (config?: InitializeServiceConfig) => {
    await initAll(config)
        .then(async (allServices) => {
            await initializeMonacoService({
                ...allServices.modelService,
                ...allServices.notificationService,
                ...allServices.dialogsService,
                ...allServices.configurationService,
                ...allServices.keybindingsService,
                ...allServices.textmateService,
                ...allServices.themeService,
                ...allServices.languagesService,
                ...allServices.audioCueService,
                ...allServices.debugService,
                ...allServices.preferencesService
            });
        })
        .then(() => console.log('initializeMonacoService completed successfully'))
        .then(async () => await initializeVscodeExtensions())
        .then(() => console.log('initializeVscodeExtensions completed successfully'))
        .catch((e: Error) => { throw e; });
};

const initAll = async (config?: InitializeServiceConfig) => {
    const allServices = {
        modelService: {} as ServiceOverride,
        notificationService: {} as ServiceOverride,
        dialogsService: {} as ServiceOverride,
        configurationService: {} as ServiceOverride,
        keybindingsService: {} as ServiceOverride,
        textmateService: {} as ServiceOverride,
        themeService: {} as ServiceOverride,
        languagesService: {} as ServiceOverride,
        audioCueService: {} as ServiceOverride,
        debugService: {} as ServiceOverride,
        preferencesService: {} as ServiceOverride
    };

    if (config) {
        if (config.enableDialogService === true) {
            const { default: getDialogsServiceOverride } = await import('vscode/service-override/dialogs');
            allServices.dialogsService = getDialogsServiceOverride();
        }

        if (config.enableDialogService === true) {
            const { default: getNotificationServiceOverride } = await import('vscode/service-override/notifications');
            allServices.notificationService = getNotificationServiceOverride();
        }

        if (config.enableModelEditorService === true && config.modelEditorServiceConfig) {
            const {
                default: getModelEditorServiceOverride
            } = await import('vscode/service-override/modelEditor');
            const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
                console.log('Trying to open a model', model, options, sideBySide);
                return undefined;
            };
            if (config.modelEditorServiceConfig.useDefaultFunction) {
                allServices.modelService = getModelEditorServiceOverride(defaultOpenEditorFunc);
            } else if (config.modelEditorServiceConfig.openEditorFunc) {
                allServices.modelService = getModelEditorServiceOverride(config.modelEditorServiceConfig.openEditorFunc);
            }
        }

        if (config.enableConfigurationService === true && config.configurationServiceConfig) {
            const { default: getConfigurationServiceOverride } = await import('vscode/service-override/configuration');
            allServices.configurationService = getConfigurationServiceOverride(config.configurationServiceConfig.defaultWorkspaceUri);
        }

        if (config.enableThemeService === true) {
            const { default: getThemeServiceOverride } = await import('vscode/service-override/theme');
            allServices.themeService = getThemeServiceOverride();

            // theme requires textmate
            config.enableTextmateService = true;
        }

        if (config.enableKeybindingsService === true) {
            const { default: getKeybindingsServiceOverride } = await import('vscode/service-override/keybindings');
            allServices.keybindingsService = getKeybindingsServiceOverride();
        }

        if (config.enableTextmateService === true) {
            const { default: getTextmateServiceOverride } = await import('vscode/service-override/textmate');
            allServices.textmateService = getTextmateServiceOverride();
        }

        if (config.enableLanguagesService === true) {
            const { default: getLanguagesServiceOverride } = await import('vscode/service-override/languages');
            allServices.languagesService = getLanguagesServiceOverride();
        }

        if (config.enableAudioCueService === true) {
            const { default: getAudioCueServiceOverride } = await import('vscode/service-override/audioCue');
            allServices.audioCueService = getAudioCueServiceOverride();
        }

        if (config.enableDebugService === true) {
            const { default: getDebugServiceOverride } = await import('vscode/service-override/debug');
            allServices.debugService = getDebugServiceOverride();
        }

        if (config.enablePreferencesService === true) {
            const { default: getPreferencesServiceOverride } = await import('vscode/service-override/preferences');
            allServices.preferencesService = getPreferencesServiceOverride();
        }
    }
    return allServices;
};
