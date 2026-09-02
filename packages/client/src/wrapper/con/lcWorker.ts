/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser';
import type { WorkerConfigOptionsParams } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientConnectionRealization, TransportLayerName } from './lcConnectionRealization.js';
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

  getTransportLayerName(): TransportLayerName {
    return 'Worker';
  }

  getMessageTransports(): MessageTransports | undefined {
    return this.messageTransports;
  }

  init(languageId: string, connectionConfig: ConnectionConfig, support: LanguageClientConnectionSupport): MessageTransports {
    this.languageId = languageId;
    this.connectionConfig = connectionConfig;
    this.support = support;
    this.support.setDisposeResources(connectionConfig.options.disposeResources === true);
    this.support.setRetryConfig(connectionConfig.retryConfig);

    const options = this.connectionConfig.options as WorkerConfigOptionsParams;
    if (this.worker === undefined) {
      const workerConfig = options;
      this.worker = new Worker(workerConfig.workerUrl.href, {
        type: workerConfig.type,
        name: workerConfig.workerName
      });
      if (options.messagePort !== undefined) {
        this.port = options.messagePort;
      }
    }

    const portOrWorker = this.port ?? this.worker;
    this.messageTransports = {
      reader: new BrowserMessageReader(portOrWorker),
      writer: new BrowserMessageWriter(portOrWorker)
    };

    this.connected();
    return this.messageTransports;
  }

  start(errorHandler: (reason?: unknown) => void): void {
    if (this.worker !== undefined) {
      this.worker.onerror = (ev: ErrorEvent) => {
        this.support?.createError(ev, 'Worker reported an error', errorHandler);
      };
    }
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
