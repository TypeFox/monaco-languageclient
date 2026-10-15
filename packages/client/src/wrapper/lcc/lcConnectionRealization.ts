/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionSupport } from './lcConnectionSupport.js';

export const DEFAULT_CONNECTION_TIMEOUT = 5000;

export interface LanguageClientConnectionRealization {
  getLanguageId(): string;

  getTransportLayerName(): string;

  init(languageId: string, connectionConfig: ConnectionConfig, support: LanguageClientConnectionSupport): Promise<MessageTransports>;

  start(): Promise<void>;

  /**
   * Called when the connection is disconnected.
   * If the disconnect happens due to an error, it will be passed via the error parameter.
   */
  disconnected: (error?: LanguageClientError) => void;

  restart(count: number): void;

  dispose(): void;
}
