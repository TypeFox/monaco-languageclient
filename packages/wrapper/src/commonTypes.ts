/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoLanguageClient } from 'monaco-languageclient';

export type WebSocketCallOptions = {
    /** Adds handle on languageClient */
    onCall: (languageClient?: MonacoLanguageClient) => void;
    /** Reports Status Of Language Client */
    reportStatus?: boolean;
}

export type LanguageClientConfigBase = {
    name?: string;
}

export type LanguageClientConfigType = 'WebSocket' | 'WebSocketUrl' | 'WorkerConfig' | 'Worker';

export type WebSocketUrl = LanguageClientConfigBase & {
    secured: boolean;
    host: string;
    port?: number;
    path?: string;
}

export type WebSocketConfigOptions = LanguageClientConfigBase & {
    $type: 'WebSocket'
    secured: boolean;
    host: string;
    port?: number;
    path?: string;
    extraParams?: Record<string, string | number | Array<string | number>>;
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export type WebSocketConfigOptionsUrl = LanguageClientConfigBase & {
    $type: 'WebSocketUrl'
    url: string;
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export type WorkerConfigOptions = LanguageClientConfigBase & {
    $type: 'WorkerConfig'
    url: URL;
    type: 'classic' | 'module';
    messagePort?: MessagePort;
};

export type WorkerConfigDirect = LanguageClientConfigBase & {
    $type: 'WorkerDirect';
    worker: Worker;
    messagePort?: MessagePort;
};
