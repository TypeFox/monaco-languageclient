/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoLanguageClient } from './client.js';

export type WebSocketCallOptions = {
    /** Adds handle on languageClient */
    onCall: (languageClient?: MonacoLanguageClient) => void;
    /** Reports Status Of Language Client */
    reportStatus?: boolean;
}

export type LanguageClientRestartOptions = {
    retries: number;
    timeout: number;
    keepWorker?: boolean;
}

export type LanguageClientConfigType = 'WebSocket' | 'WebSocketUrl' | 'WebSocketDirect' | 'WorkerConfig' | 'Worker';

export type LanguageClientConfigOptions = (WebSocketConfigOptionsDirect | WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl | WorkerConfigOptions | WorkerConfigDirect) & {
    restartOptions?: LanguageClientRestartOptions;
}

export type WebSocketUrlParams = {
    secured: boolean;
    host: string;
    port?: number;
    path?: string;
    extraParams?: Record<string, string | number | Array<string | number>>;
}

export type WebSocketUrlString = {
    url: string;
}

export type WebSocketConfigOptionsDirect = {
    $type: 'WebSocketDirect'
    webSocket: WebSocket
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export type WebSocketConfigOptionsParams = WebSocketUrlParams & {
    $type: 'WebSocketParams'
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export type WebSocketConfigOptionsUrl = WebSocketUrlString & {
    $type: 'WebSocketUrl'
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export type WorkerConfigOptions = {
    $type: 'WorkerConfig'
    url: URL;
    type: 'classic' | 'module';
    messagePort?: MessagePort;
    workerName?: string;
};

export type WorkerConfigDirect = {
    $type: 'WorkerDirect';
    worker: Worker;
    messagePort?: MessagePort;
};
