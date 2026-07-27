/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser';
import type { ConnectionConfig } from '../lcconfig.js';

export type TransportLayerName = 'Worker' | 'WebSocket' | 'SocketIo';

export const DEFAULT_CONNECTION_TIMEOUT = 5000;

export interface LanguageClientConnectionRealization {
  getLanguageId(): string;

  getTransportLayerName(): TransportLayerName;

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void;

  connected: (messageTransports: MessageTransports) => void;

  disconnected: () => void;

  dispose(): void;
}
