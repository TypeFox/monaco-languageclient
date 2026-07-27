/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionRealization } from './lcConnectionRealization.js';

export class LanguageClientConnectionSupport {
  private pendingTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  private languageClientConnectionRealization: LanguageClientConnectionRealization;

  constructor(languageClientConnectionRealization: LanguageClientConnectionRealization) {
    this.languageClientConnectionRealization = languageClientConnectionRealization;
  }

  public createError = (ev: Event, reason: string, errorHandler: (reason?: unknown) => void) => {
    const languageClientError: LanguageClientError = {
      message: `${this.languageClientConnectionRealization.getTransportLayerName()} (${this.languageClientConnectionRealization.getLanguageId()}): ${reason}.`,
      error: (ev as ErrorEvent).error ?? 'No error was provided.'
    };
    errorHandler(languageClientError);
  };

  public createConnectionTimeout(timeoutMs: number, condition: boolean, errorHandler: (reason?: unknown) => void): void {
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

  public clearPendingTimeout(): void {
    if (this.pendingTimeout !== undefined) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = undefined;
    }
  }
}
