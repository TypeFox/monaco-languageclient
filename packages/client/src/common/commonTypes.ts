/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { BaseLanguageClient } from 'vscode-languageclient/browser';
import type { LanguageClientConnectionRealization } from '../wrapper/index.js';
import type { DataCallback } from 'vscode-languageserver-protocol';

export type ConnectionRetryConfig = {
  retries?: number;
  timeout?: number;
  disposeOnRestart?: boolean;
};

export type ConnectionConfigOptions = WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl | WorkerConfigOptionsParams;

export interface CallOptions {
  /** Adds handle on languageClient */
  onCall: (languageClient?: BaseLanguageClient) => void;
  /** Reports Status Of Language Client */
  reportStatus?: boolean;
}

export interface ConnectionOptionsFamily {
  $family: 'Worker' | 'WebSocket';
  disposeResources?: boolean;
  realization: () => LanguageClientConnectionRealization;
  startOptions?: CallOptions;
  stopOptions?: CallOptions;
  readerCallback?: DataCallback;
}

export interface WebSocketConfigOptionsParams extends ConnectionOptionsFamily {
  secured: boolean;
  host: string;
  port?: number;
  path?: string;
  extraParams?: Record<string, string | number | Array<string | number>>;
}

export interface WebSocketConfigOptionsUrl extends ConnectionOptionsFamily {
  webSocketUrl: string;
}

export interface WorkerConfigOptionsParams extends ConnectionOptionsFamily {
  workerUrl: URL;
  type: 'classic' | 'module';
  messagePort?: MessagePort;
  workerName?: string;
}
