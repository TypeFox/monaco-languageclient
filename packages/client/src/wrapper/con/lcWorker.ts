/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MessageTransports } from 'vscode-languageclient/browser.js';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import type { WorkerConfigOptionsDirect, WorkerConfigOptionsParams } from '../../common/commonTypes.js';
import type { ConnectionConfig } from '../lcconfig.js';
import type { LanguageClientError } from '../lcwrapper.js';
import type { LanguageClientConnectionRealization } from './contract.js';

export class LcWorker implements LanguageClientConnectionRealization {
  connected: () => void;
  disconnected: () => void;
  private worker?: Worker;
  private port?: MessagePort;
  private languageId: string = 'unknown';

  getTransportLayerName(): 'Worker' | 'WebSocket' | 'SocketIo' {
    return 'Worker';
  }

  reinit(languageId: string, connectionConfig: ConnectionConfig): MessageTransports {
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
      if (options.messagePort !== undefined) {
        this.port = options.messagePort;
      }
    }

    const portOrWorker = this.port ?? this.worker;
    let messageTransports = connectionConfig.messageTransports;
    return (messageTransports ??= {
      reader: new BrowserMessageReader(portOrWorker),
      writer: new BrowserMessageWriter(portOrWorker)
    });
  }

  configureConnectionHandling(): void {
    // nothing needs to be done
  }

  configureErrorHandling(handler: (reason?: unknown) => void): void {
    if (this.worker !== undefined) {
      this.worker.onerror = (ev: ErrorEvent) => {
        const languageClientError: LanguageClientError = {
          message: `LcWorker (${this.languageId}) created an error.`,
          error: ev.error ?? 'No error was provided.'
        };
        handler(languageClientError);
      };
    }
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
