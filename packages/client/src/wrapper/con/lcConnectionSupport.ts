/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionRealization } from './lcConnectionRealization.js';
import type { ConnectionRetryConfig } from '../../common/commonTypes.js';

export class LanguageClientConnectionSupport {
  private pendingTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  private languageClientConnectionRealization: LanguageClientConnectionRealization;
  private retryConfig?: ConnectionRetryConfig;
  private disposeResources = false;

  constructor(languageClientConnectionRealization: LanguageClientConnectionRealization) {
    this.languageClientConnectionRealization = languageClientConnectionRealization;
  }

  public setRetryConfig(retryConfig?: ConnectionRetryConfig): void {
    this.retryConfig = retryConfig;
  }

  public setDisposeResources(disposeResources: boolean): void {
    this.disposeResources = disposeResources;
  }

  public getDisposeResources(): boolean {
    return this.disposeResources;
  }

  public createError = (reason: string, ev?: Event): LanguageClientError => {
    const defaultError = 'No error was provided.';
    const languageClientError: LanguageClientError = {
      message: `${this.languageClientConnectionRealization.getTransportLayerName()} (${this.languageClientConnectionRealization.getLanguageId()}): ${reason}.`,
      error: ev === undefined ? defaultError : ((ev as ErrorEvent).error ?? defaultError)
    };
    return languageClientError;
  };

  public createConnectionTimeout(timeoutMs: number, condition: boolean, errorHandler: (reason?: unknown) => void): void {
    this.pendingTimeout = setTimeout(() => {
      if (condition) {
        // Stop the connection attempt
        const error = this.createError(
          'Connection attempt failed',
          new ErrorEvent('error', { error: `Connection timed out after ${timeoutMs} milliseconds.` })
        );
        errorHandler(error);
      }
    }, timeoutMs);
  }

  public clearPendingTimeout(): void {
    if (this.pendingTimeout !== undefined) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = undefined;
    }
  }

  public disposeOnRestart(): boolean {
    return this.retryConfig?.disposeOnRestart === true && this.disposeResources;
  }
}
