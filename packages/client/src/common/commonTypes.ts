/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { BaseLanguageClient } from 'vscode-languageclient/browser';
import type { LanguageClientConnectionRealization } from '../wrapper/index.js';

export type ConnectionConfigOptions =
  | WebSocketConfigOptionsDirect
  | WebSocketConfigOptionsParams
  | WebSocketConfigOptionsUrl
  | WorkerConfigOptionsParams
  | WorkerConfigOptionsDirect;

export interface CallOptions {
  /** Adds handle on languageClient */
  onCall: (languageClient?: BaseLanguageClient) => void;
  /** Reports Status Of Language Client */
  reportStatus?: boolean;
}

export interface StartAndStopOptions {
  startOptions?: CallOptions;
  stopOptions?: CallOptions;
}

export interface ConnectionOptionsFamily extends StartAndStopOptions {
  $family: 'Worker' | 'WebSocket';
  direct: boolean;
  realization: () => LanguageClientConnectionRealization;
}

export interface WebSocketConfigOptionsDirect extends ConnectionOptionsFamily {
  webSocket: unknown;
}

export interface WebSocketConfigOptionsParams extends ConnectionOptionsFamily {
  secured: boolean;
  host: string;
  port?: number;
  path?: string;
  extraParams?: Record<string, string | number | Array<string | number>>;
}

export interface WebSocketConfigOptionsUrl extends ConnectionOptionsFamily {
  url: string;
}

export interface WorkerConfigOptionsParams extends ConnectionOptionsFamily {
  url: URL;
  type: 'classic' | 'module';
  messagePort?: MessagePort;
  workerName?: string;
}

export interface WorkerConfigOptionsDirect extends ConnectionOptionsFamily {
  worker: Worker;
  messagePort?: MessagePort;
}
