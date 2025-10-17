/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { BaseLanguageClient } from 'vscode-languageclient/browser.js';
import type { Socket } from 'socket.io-client';

export type ConnectionConfigOptions = WebSocketConfigOptionsDirect | WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl | WorkerConfigOptionsParams | WorkerConfigOptionsDirect | SocketIoConfigOptionsDirect;

export interface WebSocketCallOptions {
    /** Adds handle on languageClient */
    onCall: (languageClient?: BaseLanguageClient) => void;
    /** Reports Status Of Language Client */
    reportStatus?: boolean;
}

export interface WebSocketLikeConfig {
    webSocket: WebSocket | Socket;
}

export interface WebSocketConfigOptionsDirect extends WebSocketLikeConfig {
    $type: 'WebSocketDirect'
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export interface WebSocketUrlParams {
    secured: boolean;
    host: string;
    port?: number;
    path?: string;
    extraParams?: Record<string, string | number | Array<string | number>>;
}

export interface WebSocketConfigOptionsParams extends WebSocketUrlParams {
    $type: 'WebSocketParams'
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export interface WebSocketUrlString {
    url: string;
}

export interface WebSocketConfigOptionsUrl extends WebSocketUrlString {
    $type: 'WebSocketUrl'
    startOptions?: WebSocketCallOptions;
    stopOptions?: WebSocketCallOptions;
}

export interface WorkerConfigOptionsParams {
    $type: 'WorkerConfig'
    url: URL;
    type: 'classic' | 'module';
    messagePort?: MessagePort;
    workerName?: string;
}

export interface WorkerConfigOptionsDirect {
    $type: 'WorkerDirect';
    worker: Worker;
    messagePort?: MessagePort;
}

export interface SocketIoConfigOptionsDirect extends WebSocketLikeConfig {
    $type: 'SocketIoDirect'
}
