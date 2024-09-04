/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { InitializeServiceConfig } from 'monaco-languageclient/vscode/services';
import type { LoggerConfig } from 'monaco-languageclient/tools';
import { EditorAppConfigExtended } from './editorAppExtended.js';
import { EditorAppConfigClassic } from './editorAppClassic.js';
import { LanguageClientConfig } from './languageClientWrapper.js';

export type WrapperConfig = {
    serviceConfig?: InitializeServiceConfig;
    editorAppConfig: EditorAppConfigExtended | EditorAppConfigClassic;
};

export type UserConfig = {
    id?: string;
    loggerConfig?: LoggerConfig;
    wrapperConfig: WrapperConfig;
    languageClientConfigs?: Record<string, LanguageClientConfig>;
}
