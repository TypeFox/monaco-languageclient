/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser';
import type { WorkerConfigOptionsDirect, WorkerConfigOptionsParams } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientConnectionRealization, TransportLayerName } from './lcConnectionRealization.js';
import { LanguageClientConnectionSupport } from './lcConnectionSupport.js';
import type { MessageTransports } from 'vscode-languageclient';

export class LcWorker implements LanguageClientConnectionRealization {
  private support: LanguageClientConnectionSupport;
  private languageId: string = 'unknown';
  private worker?: Worker;
  private port?: MessagePort;

  constructor() {
    this.support = new LanguageClientConnectionSupport(this);
  }

  getLanguageId(): string {
    return this.languageId;
  }

  getTransportLayerName(): TransportLayerName {
    return 'Worker';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options as WorkerConfigOptionsDirect | WorkerConfigOptionsParams;
    if (this.worker === undefined) {
      if (!options.direct) {
        const workerConfig = options as WorkerConfigOptionsParams;
        this.worker = new Worker(workerConfig.url.href, {
          type: workerConfig.type,
          name: workerConfig.workerName
        });
      } else {
        const workerDirectConfig = options as WorkerConfigOptionsDirect;
        this.worker = workerDirectConfig.worker;
      }
      this.worker.onerror = (ev: ErrorEvent) => {
        this.support.createError(ev, 'Worker reported an error', errorHandler);
      };
      if (options.messagePort !== undefined) {
        this.port = options.messagePort;
      }
    }

    const portOrWorker = this.port ?? this.worker;
    const messageTransports = connectionConfig.messageTransports ?? {
      reader: new BrowserMessageReader(portOrWorker),
      writer: new BrowserMessageWriter(portOrWorker)
    };

    this.connected(messageTransports);
  }

  updateWorker(worker: Worker): void {
    this.worker = worker;
  }

  getWorker(): Worker | undefined {
    return this.worker;
  }

  connected: (messageTransports: MessageTransports) => void;

  disconnected: () => void;

  dispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
  }
}
