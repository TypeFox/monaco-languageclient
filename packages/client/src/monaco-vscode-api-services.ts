/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import 'monaco-editor/esm/vs/editor/edcore.main.js';
import { Uri } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { initialize as initializeMonacoService } from 'vscode/services';
import { initialize as initializeVscodeExtensions } from 'vscode/extensions';
import getModelEditorServiceOverride, { OpenEditor } from 'vscode/service-override/modelEditor';
import getNotificationServiceOverride from 'vscode/service-override/notifications';
import getDialogsServiceOverride from 'vscode/service-override/dialogs';
import getConfigurationServiceOverride from 'vscode/service-override/configuration';
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings';
import getTextmateServiceOverride from 'vscode/service-override/textmate';
import getLanguagesServiceOverride from 'vscode/service-override/languages';
import getThemeServiceOverride from 'vscode/service-override/theme';
import getAudioCueServiceOverride from 'vscode/service-override/audioCue';
import getDebugServiceOverride from 'vscode/service-override/debug';
import getPreferencesServiceOverride from 'vscode/service-override/preferences';

export type InitializeServiceConfig = {
    // themeService is enabled by default
    enableDialogService?: boolean;
    enableNotificationService?: boolean;
    enableModelEditorService?: {
        useDefaultFunction: true,
        openEditorFunc?: OpenEditor
    };
    enableConfigurationService?: {
        defaultWorkspaceUri: Uri;
    };
    enableKeybindingsService?: boolean;
    enableTextmateService?: boolean;
    enableLanguagesService?: boolean;
    enableAudioCueService?: boolean;
    enableDebugService?: boolean;
    enablePreferencesService?: boolean;
};

export const initServices = async (config: InitializeServiceConfig) => {
    const themeService = getThemeServiceOverride();
    const dialogsService = config.enableKeybindingsService === true ? getDialogsServiceOverride() : {};
    const notificationService = config.enableNotificationService === true ? getNotificationServiceOverride() : {};
    let modelService = {};
    if (config.enableModelEditorService) {
        const defaultOpenEditorFunc: OpenEditor = async (model, options, sideBySide) => {
            console.log('Trying to open a model', model, options, sideBySide);
            return undefined;
        };
        if (config.enableModelEditorService.useDefaultFunction) {
            modelService = defaultOpenEditorFunc;
        } else if (config.enableModelEditorService.openEditorFunc) {
            modelService = getModelEditorServiceOverride(config.enableModelEditorService.openEditorFunc);
        }
    }
    const configurationService = config.enableConfigurationService !== undefined ? getConfigurationServiceOverride(config.enableConfigurationService!.defaultWorkspaceUri) : {};
    const keybindingsService = config.enableKeybindingsService === true ? getKeybindingsServiceOverride() : {};
    const textmateService = config.enableTextmateService === true ? getTextmateServiceOverride() : {};
    const languagesService = config.enableLanguagesService === true ? getLanguagesServiceOverride() : {};
    const audioCueService = config.enableAudioCueService === true ? getAudioCueServiceOverride() : {};
    const debugService = config.enableDebugService === true ? getDebugServiceOverride() : {};
    const preferencesService = config.enablePreferencesService === true ? getPreferencesServiceOverride() : {};

    await initializeMonacoService({
        ...modelService,
        ...notificationService,
        ...dialogsService,
        ...configurationService,
        ...keybindingsService,
        ...textmateService,
        ...themeService,
        ...languagesService,
        ...audioCueService,
        ...debugService,
        ...preferencesService
    })
        .then(() => console.log('initializeMonacoService completed successfully'))
        .catch((e) => console.error(`initializeMonacoService had errors: ${e}`));

    await initializeVscodeExtensions()
        .then(() => console.log('initializeVscodeExtensions completed successfully'))
        .catch((e) => console.error(`initializeVscodeExtensions had errors: ${e}`));
};
