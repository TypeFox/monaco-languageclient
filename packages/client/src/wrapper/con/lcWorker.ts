/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser';
import type { WorkerConfigOptionsParams } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import { type LanguageClientConnectionRealization } from './lcConnectionRealization.js';
import { LanguageClientConnectionSupport } from './lcConnectionSupport.js';

export class LcWorker implements LanguageClientConnectionRealization {
  private support?: LanguageClientConnectionSupport;
  private connectionConfig?: ConnectionConfig;
  private languageId: string = 'unknown';
  private worker?: Worker;
  private port?: MessagePort;
  private messageTransports?: MessageTransports;

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): string {
    return 'Worker';
  }

  getMessageTransports(): MessageTransports | undefined {
    return this.messageTransports;
  }

  async init(languageId: string, connectionConfig: ConnectionConfig, support: LanguageClientConnectionSupport): Promise<MessageTransports> {
    this.languageId = languageId;
    this.connectionConfig = connectionConfig;
    this.support = support;
    this.support.setDisposeResources(connectionConfig.options.disposeResources ?? true);
    this.support.setRetryConfig(connectionConfig.retryConfig);
    const options = this.connectionConfig.options as WorkerConfigOptionsParams;
    if (this.worker === undefined) {
      const workerConfig = options;

      // This is used to detect a unresolvable worker URL before actually creating the worker and
      // flagging the problem via the promise rejection.
      const response = await fetch(workerConfig.workerUrl);
      if (!response.ok) {
        const lceError = support.createError(`Unable to load worker from URL: ${response.status} ${response.statusText}`);
        return Promise.reject(lceError);
      }

      this.worker = new Worker(workerConfig.workerUrl.href, {
        type: workerConfig.type,
        name: workerConfig.workerName
      });
      this.worker.onerror = (ev: ErrorEvent) => {
        const lceError = support.createError('Worker reported an error', ev);
        return Promise.reject(lceError);
      };
      this.port = options.messagePort;
    }

    const portOrWorker = this.port ?? this.worker;
    this.messageTransports = {
      reader: new BrowserMessageReader(portOrWorker),
      writer: new BrowserMessageWriter(portOrWorker)
    };

    if (this.connectionConfig.options.readerCallback !== undefined) {
      this.messageTransports.reader.listen(this.connectionConfig.options.readerCallback);
    }
    return this.messageTransports;
  }

  start(_errorHandler?: (reason?: unknown) => void): void {
    this.connected();
  }

  updateWorker(worker: Worker): void {
    this.worker = worker;
  }

  getWorker(): Worker | undefined {
    return this.worker;
  }

  connected: () => void;

  disconnected: () => void;

  restart(_count: number): void {
    if (this.support?.disposeOnRestart() === true) {
      this.worker?.terminate();
      this.worker = undefined;
    }
  }

  dispose(): void {
    if (this.support?.getDisposeResources() === true) {
      this.worker?.terminate();
      this.worker = undefined;
    }
  }
}
