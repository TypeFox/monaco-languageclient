/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger, type ILogger } from '@codingame/monaco-vscode-log-service-override';
import { MonacoLanguageClient, MonacoLanguageClientWithProposedFeatures } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports, State } from 'vscode-languageclient/browser';

import { Deferred } from '../common/utils.js';
import type { LanguageClientConnectionRealization } from './con/lcConnectionRealization.js';
import { LcWorker } from './con/lcWorker.js';
import type { LanguageClientConfig } from './lcconfig.js';

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
    this.connectionRealization = this.languageClientConfig.connection.options.realization();
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
    const deferred = new Deferred<void>();

    if (this.languageClient === undefined || !this.languageClient.isRunning()) {
      this.connectionRealization.connected = async (messageTransports: MessageTransports) => {
        await this.performLanguageClientStart(messageTransports, deferred);
      };
      this.connectionRealization.disconnected = async () => {
        await this.dispose();
      };

      this.connectionRealization.init(this.languageClientConfig.languageId, this.languageClientConfig.connection, deferred.reject);
    }
    return deferred.promise;
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

  protected async performLanguageClientStart(messageTransports: MessageTransports, deferred: Deferred<void>): Promise<void> {
    let starting = true;
    // do not perform another start attempt if already running
    if (this.languageClient?.isRunning() ?? false) {
      this.logger?.info('performLanguageClientStart: monaco-languageclient already running!');
      deferred.resolve();
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
              deferred.reject(`Error occurred in language client: ${e}`);
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
    this.initRestartConfiguration(messageTransports);

    messageTransports.reader.onClose(async () => {
      await this.languageClient?.stop();

      const stopOptions = conOptions.stopOptions;
      if (stopOptions !== undefined) {
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

      const startOptions = conOptions.startOptions;
      if (startOptions !== undefined) {
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
      deferred.reject(languageClientError);
    }
    this.logger?.info(`languageClientWrapper (${this.languageClientConfig.languageId}): Started successfully.`);
    deferred.resolve();
    starting = false;
  }

  protected initRestartConfiguration(messageTransports: MessageTransports) {
    const restartOptions = this.languageClientConfig.connection.restartOptions;
    const timeout = this.languageClientConfig.connection.timeout;
    if (restartOptions !== undefined) {
      let retry = 0;

      const readerOnError = messageTransports.reader.onError(() => restartLC());
      const readerOnClose = messageTransports.reader.onClose(() => restartLC());
      const retries = restartOptions.retries ?? 0;

      const restartLC = async () => {
        if (this.isStarted()) {
          const worker = this.getWorker();
          try {
            readerOnError.dispose();
            readerOnClose.dispose();

            await this.restart(worker, restartOptions.keepWorker);
          } finally {
            retry++;
            if (retry > retries && !this.isStarted()) {
              this.logger?.info(`Disabling Language Client. Failed to start clangd after ${retries} retries`);
            } else {
              setTimeout(async () => {
                await this.restart(worker, restartOptions.keepWorker);
              }, timeout);
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
      throw new Error(languageClientError.message, { cause: languageClientError.error });
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
