/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    EditorAppBase,
    isCodeUpdateRequired,
    isModelUpdateRequired,
    isEqual,
    ModelUpdateType
} from './editorAppBase.js';

import type {
    EditorAppConfigBase,
    EditorAppType,
    ModelUpdate
} from './editorAppBase.js';

import type {
    EditorAppConfigClassic,
} from './editorAppClassic.js';

import {
    EditorAppClassic
} from './editorAppClassic.js';

import type {
    ExtensionConfig,
    EditorAppConfigExtended,
    RegisterExtensionResult,
    RegisterLocalProcessExtensionResult,
    UserConfiguration
} from './editorAppExtended.js';

import {
    EditorAppExtended
} from './editorAppExtended.js';

import type {
    WebSocketCallOptions,
    LanguageClientConfigType,
    WebSocketConfigOptions,
    WebSocketConfigOptionsUrl,
    WorkerConfigOptions,
    WorkerConfigDirect
} from './commonTypes.js';

import type {
    LanguageClientConfig,
    LanguageClientError
} from './languageClientWrapper.js';

import {
    LanguageClientWrapper,
} from './languageClientWrapper.js';

import type {
    UserConfig,
    WrapperConfig
} from './userConfig.js';

import {
    MonacoEditorLanguageClientWrapper,
} from './wrapper.js';

export type {
    WrapperConfig,
    EditorAppConfigBase,
    EditorAppType,
    EditorAppConfigClassic,
    ExtensionConfig,
    EditorAppConfigExtended,
    RegisterExtensionResult,
    RegisterLocalProcessExtensionResult,
    UserConfiguration,
    WebSocketCallOptions,
    LanguageClientConfigType,
    WebSocketConfigOptions,
    WebSocketConfigOptionsUrl,
    WorkerConfigOptions,
    WorkerConfigDirect,
    LanguageClientConfig,
    LanguageClientError,
    UserConfig,
    ModelUpdate
};

export {
    MonacoEditorLanguageClientWrapper,
    LanguageClientWrapper,
    EditorAppBase,
    isCodeUpdateRequired,
    isModelUpdateRequired,
    isEqual,
    ModelUpdateType,
    EditorAppClassic,
    EditorAppExtended
};

export * from './utils.js';
