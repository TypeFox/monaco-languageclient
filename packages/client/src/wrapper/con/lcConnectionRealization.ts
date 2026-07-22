/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientError } from '../index.js';

export type TransportLayerName = 'Worker' | 'WebSocket' | 'SocketIo';

export const DEFAULT_CONNECTION_TIMEOUT = 5000;

export abstract class LanguageClientConnectionRealization {
  protected languageId: string = 'unknown';
  protected pendingTimeout: ReturnType<typeof setTimeout> | string | number | undefined = undefined;

  connected: (messageTransports: MessageTransports) => void;

  disconnected: () => void;

  protected createError = (ev: Event, reason: string, errorHandler: (reason?: unknown) => void) => {
    const languageClientError: LanguageClientError = {
      message: `${this.getTransportLayerName()} (${this.languageId}): ${reason}.`,
      error: (ev as ErrorEvent).error ?? 'No error was provided.'
    };
    errorHandler(languageClientError);
  };

  protected createConnectionTimeout(timeoutMs: number, condition: boolean, errorHandler: (reason?: unknown) => void): void {
    this.pendingTimeout = setTimeout(() => {
      if (condition) {
        // Stop the connection attempt
        this.createError(
          new ErrorEvent('error', { error: `Connection timed out after ${timeoutMs} milliseconds.` }),
          'Connection attempt failed',
          errorHandler
        );
      }
    }, timeoutMs);
  }

  protected clearPendingTimeout(): void {
    if (this.pendingTimeout !== undefined) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = undefined;
    }
  }

  abstract getTransportLayerName(): TransportLayerName;

  abstract init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void;

  abstract dispose(): void;
}
