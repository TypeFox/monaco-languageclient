/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { LanguageClientOptions, MessageTransports } from 'vscode-languageclient/browser.js';
import { type ConnectionConfigOptions } from 'monaco-languageclient/common';

export interface ConnectionConfig {
    options: ConnectionConfigOptions;
    messageTransports?: MessageTransports;
}

export interface LanguageClientConfig {
    name?: string;
    connection: ConnectionConfig;
    clientOptions: LanguageClientOptions;
    restartOptions?: LanguageClientRestartOptions;
    disposeWorker?: boolean;
}

export interface LanguageClientRestartOptions {
    retries: number;
    timeout: number;
    keepWorker?: boolean;
}

export interface LanguageClientConfigs {
    configs: Record<string, LanguageClientConfig>
    overwriteExisting?: boolean;
    enforceDispose?: boolean;
}
