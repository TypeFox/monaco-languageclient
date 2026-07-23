/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io-client';
import type { BaseLanguageClient } from 'vscode-languageclient/browser';

export type ConnectionConfigOptions = StartAndStopOptions &
  (
    | WebSocketConfigOptionsDirect
    | WebSocketConfigOptionsParams
    | WebSocketConfigOptionsUrl
    | WorkerConfigOptionsParams
    | WorkerConfigOptionsDirect
    | SocketIoConfigOptionsDirect
  );

export interface CallOptions {
  /** Adds handle on languageClient */
  onCall: (languageClient?: BaseLanguageClient) => void;
  /** Reports Status Of Language Client */
  reportStatus?: boolean;
}

export interface ConnectionOptionsFamily {
  $family: 'Worker' | 'WebSocket';
}

export interface StartAndStopOptions {
  startOptions?: CallOptions;
  stopOptions?: CallOptions;
}

export interface WebSocketLikeConfig extends ConnectionOptionsFamily {
  webSocket: WebSocket | Socket;
}

export interface WebSocketConfigOptionsDirect extends WebSocketLikeConfig {
  $type: 'WebSocketDirect';
}

export interface WebSocketConfigOptionsParams extends ConnectionOptionsFamily {
  $type: 'WebSocketParams';
  secured: boolean;
  host: string;
  port?: number;
  path?: string;
  extraParams?: Record<string, string | number | Array<string | number>>;
}

export interface WebSocketConfigOptionsUrl extends ConnectionOptionsFamily {
  $type: 'WebSocketUrl';
  url: string;
}

export interface WorkerConfigOptionsParams extends ConnectionOptionsFamily {
  $type: 'WorkerConfig';
  url: URL;
  type: 'classic' | 'module';
  messagePort?: MessagePort;
  workerName?: string;
}

export interface WorkerConfigOptionsDirect extends ConnectionOptionsFamily {
  $type: 'WorkerDirect';
  worker: Worker;
  messagePort?: MessagePort;
}

export interface SocketIoConfigOptionsDirect extends WebSocketLikeConfig {
  $type: 'SocketIoDirect';
}
