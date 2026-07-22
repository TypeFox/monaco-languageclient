/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser';
import type { WorkerConfigOptionsDirect, WorkerConfigOptionsParams } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import { LanguageClientConnectionRealization, type TransportLayerName } from './lcConnectionRealization.js';

export class LcWorker extends LanguageClientConnectionRealization {
  private worker?: Worker;
  private port?: MessagePort;

  getTransportLayerName(): TransportLayerName {
    return 'Worker';
  }

  init(languageId: string, connectionConfig: ConnectionConfig, errorHandler: (reason?: unknown) => void): void {
    this.languageId = languageId;
    const options = connectionConfig.options as WorkerConfigOptionsDirect | WorkerConfigOptionsParams;
    if (this.worker === undefined) {
      if (options.$type === 'WorkerConfig') {
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
        this.createError(ev, 'Worker reported an error', errorHandler);
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

  dispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
  }
}
