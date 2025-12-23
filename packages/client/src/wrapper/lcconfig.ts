/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { type ConnectionConfigOptions } from 'monaco-languageclient/common';
import type { DynamicFeature, LanguageClientOptions, MessageTransports, StaticFeature } from 'vscode-languageclient/browser.js';

export interface ConnectionConfig {
    options: ConnectionConfigOptions;
    messageTransports?: MessageTransports;
}

export interface LanguageClientConfig {
    languageId: string;
    connection: ConnectionConfig;
    clientOptions: LanguageClientOptions;
    restartOptions?: LanguageClientRestartOptions;
    useClientWithProposedFeatures?: boolean;
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    registerFeatures?: Array<(StaticFeature | DynamicFeature<any>)>;
    disposeWorker?: boolean;
    logLevel?: LogLevel | number;
}

export interface LanguageClientRestartOptions {
    retries: number;
    timeout: number;
    keepWorker?: boolean;
}

export interface LanguageClientConfigs {
    configs: Record<string, LanguageClientConfig>;
}
