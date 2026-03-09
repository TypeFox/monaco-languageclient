/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger, type ILogger } from '@codingame/monaco-vscode-log-service-override';
import { MonacoLanguageClient, MonacoLanguageClientWithProposedFeatures } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports, State } from 'vscode-languageclient/browser.js';

import type { LanguageClientConnectionRealization } from './con/contract.js';
import { LcSocketIo } from './con/lcSocketIo.js';
import { LcWebSocket } from './con/lcWebSocket .js';
import { LcWorker } from './con/lcWorker.js';
import type { LanguageClientConfig, LanguageClientRestartOptions } from './lcconfig.js';

export interface LanguageClientError {
  message: string;
  error: Error | string;
}

export class LanguageClientWrapper {
  private languageClient?: MonacoLanguageClient | MonacoLanguageClientWithProposedFeatures;
  private languageClientConfig: LanguageClientConfig;
  private logger: ILogger | undefined;
  private connectionRealization: LanguageClientConnectionRealization;

  constructor(config: LanguageClientConfig) {
    this.languageClientConfig = config;
    this.logger = new ConsoleLogger(this.languageClientConfig.logLevel ?? LogLevel.Off);

    switch (this.languageClientConfig.connection.options.$type) {
      case 'WebSocketDirect':
      case 'WebSocketParams':
      case 'WebSocketUrl':
        this.connectionRealization = new LcWebSocket();
        break;
      case 'SocketIoDirect':
        this.connectionRealization = new LcSocketIo();
        break;
      case 'WorkerDirect':
      case 'WorkerConfig':
        this.connectionRealization = new LcWorker();
        break;
    }
  }

  haveLanguageClient(): boolean {
    return this.languageClient !== undefined;
  }

  getLanguageClient(): MonacoLanguageClient | undefined {
    return this.languageClient;
  }

  getWorker(): Worker | undefined {
    if (this.connectionRealization.getTransportLayerName() === 'Worker') {
      return (this.connectionRealization as LcWorker).getWorker();
    }
    return undefined;
  }

  isStarted(): boolean {
    return this.languageClient?.isRunning() ?? false;
  }

  async start(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.languageClient === undefined || this.languageClient.isRunning() === false) {
        const messageTransports = this.connectionRealization.reinit(
          this.languageClientConfig.languageId,
          this.languageClientConfig.connection
        );
        this.connectionRealization.configureErrorHandling(reject);
        this.connectionRealization.configureConnectionHandling();
        this.connectionRealization.connected = async () => {
          await this.performLanguageClientStart(messageTransports, reject);
        };
        resolve();
      }
    });
  }

  /**
   * Restart the languageclient with options to control worker handling
   *
   * @param updatedWorker Set a new worker here that should be used. keepWorker has no effect then, as we want to dispose of the prior workers
   * @param disposeWorker Set to false if worker should not be disposed
   */
  async restart(updatedWorker?: Worker, forceWorkerDispose?: boolean): Promise<void> {
    await this.dispose(forceWorkerDispose);

    if (updatedWorker !== undefined && this.connectionRealization.getTransportLayerName() === 'Worker') {
      (this.connectionRealization as LcWorker).updateWorker(updatedWorker);
    }
    this.logger?.info('Re-Starting monaco-languageclient');
    return this.start();
  }

  protected async performLanguageClientStart(messageTransports: MessageTransports, handleError: (reason?: unknown) => void) {
    let starting = true;
    // do not perform another start attempt if already running
    if (this.languageClient?.isRunning() ?? false) {
      this.logger?.info('performLanguageClientStart: monaco-languageclient already running!');
      return;
    }

    const mlcConfig = {
      id: this.languageClientConfig.languageId,
      name: 'Monaco Wrapper Language Client',
      clientOptions: {
        // disable the default error handler...
        errorHandler: {
          error: (e: Error) => {
            if (starting) {
              handleError(`Error occurred in language client: ${e}`);
              return { action: ErrorAction.Shutdown };
            } else {
              return { action: ErrorAction.Continue };
            }
          },
          closed: () => ({ action: CloseAction.DoNotRestart })
        },
        // ...but allowm to override all options
        ...this.languageClientConfig.clientOptions
      },
      messageTransports
    };

    const conOptions = this.languageClientConfig.connection.options;
    this.initRestartConfiguration(messageTransports, this.languageClientConfig.restartOptions);

    const isWebSocket =
      conOptions.$type === 'WebSocketParams' || conOptions.$type === 'WebSocketUrl' || conOptions.$type === 'WebSocketDirect';

    messageTransports.reader.onClose(async () => {
      await this.languageClient?.stop();

      if (isWebSocket && conOptions.stopOptions !== undefined) {
        const stopOptions = conOptions.stopOptions;
        stopOptions.onCall(this.getLanguageClient());
        if (stopOptions.reportStatus !== undefined) {
          this.logger?.info(this.reportStatus().join('\n'));
        }
      }
    });

    try {
      this.languageClient =
        this.languageClientConfig.useClientWithProposedFeatures === true
          ? new MonacoLanguageClientWithProposedFeatures(mlcConfig)
          : new MonacoLanguageClient(mlcConfig);
      if (this.languageClientConfig.registerFeatures !== undefined) {
        this.languageClient.registerFeatures(this.languageClientConfig.registerFeatures);
      }

      await this.languageClient.start();

      if (isWebSocket && conOptions.startOptions !== undefined) {
        const startOptions = conOptions.startOptions;
        startOptions.onCall(this.getLanguageClient());
        if (startOptions.reportStatus !== undefined) {
          this.logger?.info(this.reportStatus().join('\n'));
        }
      }
    } catch (e: unknown) {
      const languageClientError: LanguageClientError = {
        message: `languageClientWrapper (${this.languageClientConfig.languageId}): Start was unsuccessful.`,
        error: Object.hasOwn(e ?? {}, 'cause') ? (e as Error) : 'No error was provided.'
      };
      handleError(languageClientError);
    }
    this.logger?.info(`languageClientWrapper (${this.languageClientConfig.languageId}): Started successfully.`);
    starting = false;
  }

  protected initRestartConfiguration(messageTransports: MessageTransports, restartOptions?: LanguageClientRestartOptions) {
    if (restartOptions !== undefined) {
      let retry = 0;

      const readerOnError = messageTransports.reader.onError(() => restartLC);
      const readerOnClose = messageTransports.reader.onClose(() => restartLC);

      const restartLC = async () => {
        if (this.isStarted()) {
          const worker = this.getWorker();
          try {
            readerOnError.dispose();
            readerOnClose.dispose();

            await this.restart(worker, restartOptions.keepWorker);
          } finally {
            retry++;
            if (retry > restartOptions.retries && !this.isStarted()) {
              this.logger?.info(`Disabling Language Client. Failed to start clangd after ${restartOptions.retries} retries`);
            } else {
              setTimeout(async () => {
                await this.restart(worker, restartOptions.keepWorker);
              }, restartOptions.timeout);
            }
          }
        }
      };
    }
  }

  async dispose(forceDispose?: boolean): Promise<void> {
    try {
      if (this.isStarted()) {
        await this.languageClient?.dispose();
        this.languageClient = undefined;
        this.logger?.info('monaco-languageclient was successfully disposed.');
      }
    } catch (e) {
      const languageClientError: LanguageClientError = {
        message: `languageClientWrapper (${this.languageClientConfig.languageId}): Disposing the monaco-languageclient resulted in error.`,
        error: Object.hasOwn(e ?? {}, 'cause') ? (e as Error) : 'No error was provided.'
      };
      return Promise.reject(languageClientError);
    } finally {
      // always terminate the worker if desired
      if (this.languageClientConfig.disposeWorker === true || forceDispose === true) {
        this.connectionRealization.dispose();
      }
    }
  }

  reportStatus() {
    const status: string[] = [];
    const languageClient = this.getLanguageClient();
    status.push('LanguageClientWrapper status:');
    status.push(`LanguageClient: ${languageClient?.name ?? 'Language Client'} is in a '${State[languageClient?.state ?? 1]}' state`);
    return status;
  }
}
