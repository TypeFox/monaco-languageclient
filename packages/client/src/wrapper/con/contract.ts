/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser.js';
import type { ConnectionConfig } from '../lcconfig.js';

export type TransportLayerName = 'Worker' | 'WebSocket' | 'SocketIo';

export interface LanguageClientConnectionRealization {
  getTransportLayerName(): TransportLayerName;

  reinit(languageId: string, connectionConfig: ConnectionConfig): MessageTransports;

  configureConnectionHandling(): void;

  configureErrorHandling(handler: (reason?: unknown) => void): void;

  connected: () => void;

  disconnected: () => void;

  dispose(): void;
}
