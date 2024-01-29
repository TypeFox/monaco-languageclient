/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initServices, InitializeServiceConfig, MonacoLanguageClient, IConnectionProvider } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, LanguageClientOptions, MessageTransports, State } from 'vscode-languageclient/lib/common/client.js';
import { createUrl } from './utils.js';
import { Logger } from './logger.js';
import { WebSocketConfigOptions, WebSocketConfigOptionsUrl, WorkerConfigDirect, WorkerConfigOptions } from './commonTypes.js';

export type LanguageClientConfig = {
    options: WebSocketConfigOptions | WebSocketConfigOptionsUrl | WorkerConfigOptions | WorkerConfigDirect;
    clientOptions?: LanguageClientOptions;
    connectionProvider?: IConnectionProvider;
}

export type LanguageClientError = {
    message: string;
    error: Error | string;
};

export class LanguageClientWrapper {

    private languageClient?: MonacoLanguageClient;
    private languageClientConfig?: LanguageClientConfig;
    private worker?: Worker;
    private port: MessagePort;
    private languageId: string;
    private name?: string;
    private logger: Logger | undefined;

    async init(config: {
        languageId: string,
        serviceConfig?: InitializeServiceConfig,
        languageClientConfig?: LanguageClientConfig,
        logger?: Logger
    }) {
        this.languageId = config.languageId;
        if (config.languageClientConfig) {
            this.languageClientConfig = config.languageClientConfig;
            this.name = this.languageClientConfig.options.name ?? 'unnamed';
        }
        this.logger = config.logger;

        await initServices(config.serviceConfig);
    }

    haveLanguageClient(): boolean {
        return this.languageClient !== undefined;
    }

    haveLanguageClientConfig(): boolean {
        return this.languageClientConfig !== undefined;
    }

    getLanguageClient(): MonacoLanguageClient | undefined {
        return this.languageClient;
    }

    getWorker(): Worker | undefined {
        return this.worker;
    }

    isStarted(): boolean {
        return this.languageClient !== undefined && this.languageClient?.isRunning();
    }

    async start() {
        if (this.languageClientConfig) {
            return this.startLanguageClientConnection();
        } else {
            const languageClientError: LanguageClientError = {
                message: `languageClientWrapper (${this.name}): Unable to start monaco-languageclient. No configuration was provided.`,
                error: 'No error was provided.'
            };
            return Promise.reject(languageClientError);
        }
    }

    /**
     * Restart the languageclient with options to control worker handling
     *
     * @param updatedWorker Set a new worker here that should be used. keepWorker has no effect then, as we want to dispose of the prior workers
     * @param keepWorker Set to true if worker should not be disposed
     */
    async restartLanguageClient(updatedWorker?: Worker, keepWorker?: boolean): Promise<void> {
        if (updatedWorker) {
            await this.disposeLanguageClient(false);
        } else {
            await this.disposeLanguageClient(keepWorker);
        }
        this.worker = updatedWorker;
        if (this.languageClientConfig) {
            this.logger?.info('Re-Starting monaco-languageclient');
            return this.startLanguageClientConnection();
        } else {
            const languageClientError: LanguageClientError = {
                message: `languageClientWrapper (${this.name}): Unable to restart languageclient. No configuration was provided.`,
                error: 'No error was provided.'
            };
            return Promise.reject(languageClientError);
        }
    }

    private startLanguageClientConnection(): Promise<void> {
        if (this.languageClient && this.languageClient.isRunning()) {
            this.logger?.info('monaco-languageclient already running!');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const lcConfig = this.languageClientConfig?.options;
            if (lcConfig?.$type === 'WebSocket' || lcConfig?.$type === 'WebSocketUrl') {
                const url = createUrl(lcConfig);
                const webSocket = new WebSocket(url);

                webSocket.onopen = () => {
                    const socket = toSocket(webSocket);
                    const messageTransports = {
                        reader: new WebSocketMessageReader(socket),
                        writer: new WebSocketMessageWriter(socket)
                    };
                    this.handleLanguageClientStart(messageTransports, resolve, reject);
                };
                webSocket.onerror = (ev: Event) => {
                    const languageClientError: LanguageClientError = {
                        message: `languageClientWrapper (${this.name}): Websocket connection failed.`,
                        error: (ev as ErrorEvent).error ?? 'No error was provided.'
                    };
                    reject(languageClientError);
                };
            } else {
                if (!this.worker) {
                    if (lcConfig?.$type === 'WorkerConfig') {
                        const workerConfig = lcConfig as WorkerConfigOptions;
                        this.worker = new Worker(new URL(workerConfig.url, import.meta.url).href, {
                            type: workerConfig.type,
                            name: workerConfig.name
                        });

                        this.worker.onerror = (ev) => {
                            const languageClientError: LanguageClientError = {
                                message: `languageClientWrapper (${this.name}): Illegal worker configuration detected. Potentially the url is wrong.`,
                                error: ev.error ?? 'No error was provided.'
                            };
                            reject(languageClientError);
                        };
                    } else {
                        const workerDirectConfig = lcConfig as WorkerConfigDirect;
                        this.worker = workerDirectConfig.worker;
                    }
                    if (lcConfig?.messagePort) {
                        this.port = lcConfig?.messagePort;
                    }
                }

                const messageTransports = {
                    reader: new BrowserMessageReader(this.port ? this.port : this.worker),
                    writer: new BrowserMessageWriter(this.port ? this.port : this.worker)
                };
                this.handleLanguageClientStart(messageTransports, resolve, reject);
            }
        });
    }

    private async handleLanguageClientStart(messageTransports: MessageTransports,
        resolve: () => void,
        reject: (reason?: unknown) => void) {

        this.languageClient = this.createLanguageClient(messageTransports);
        const lcConfig = this.languageClientConfig?.options;
        messageTransports.reader.onClose(async () => {
            await this.languageClient?.stop();
            if ((lcConfig?.$type === 'WebSocket' || lcConfig?.$type === 'WebSocketUrl') && lcConfig?.stopOptions) {
                const stopOptions = lcConfig?.stopOptions;
                stopOptions.onCall(this.getLanguageClient());
                if (stopOptions.reportStatus) {
                    this.logger?.info(this.reportStatus().join('\n'));
                }
            }
        });

        try {
            await this.languageClient.start();
            if ((lcConfig?.$type === 'WebSocket' || lcConfig?.$type === 'WebSocketUrl') && lcConfig?.startOptions) {
                const startOptions = lcConfig?.startOptions;
                startOptions.onCall(this.getLanguageClient());
                if (startOptions.reportStatus) {
                    this.logger?.info(this.reportStatus().join('\n'));
                }
            }
        } catch (e) {
            const languageClientError: LanguageClientError = {
                message: `languageClientWrapper (${this.name}): Start was unsuccessful.`,
                error: (e as Error) ?? 'No error was provided.'
            };
            reject(languageClientError);
        }
        this.logger?.info(`languageClientWrapper (${this.name}): Started successfully.`);
        resolve();
    }

    private createLanguageClient(transports: MessageTransports): MonacoLanguageClient {
        const mlcConfig = {
            name: this.languageClientConfig?.options.name ?? 'Monaco Wrapper Language Client',

            // allow to fully override the clientOptions
            clientOptions: this.languageClientConfig?.clientOptions ?? {
                documentSelector: [this.languageId!],
                // disable the default error handler
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart })
                }
            },
            // allow to fully override the clonnecetionProvider
            connectionProvider: this.languageClientConfig?.connectionProvider ?? {
                get: () => {
                    return Promise.resolve(transports);
                }
            }
        };
        if (!mlcConfig.clientOptions.documentSelector?.includes(this.languageId)) {
            throw new Error(`languageClientWrapper (${this.name}): The language id '${this.languageId}' is not included in the document selector.`);
        }

        return new MonacoLanguageClient(mlcConfig);
    }

    private disposeWorker(keepWorker?: boolean) {
        if (keepWorker === undefined || keepWorker === false) {
            this.worker?.terminate();
            this.worker = undefined;
        }
    }

    public async disposeLanguageClient(keepWorker?: boolean): Promise<void> {
        // If there is no language client, try to terminate the worker
        if (!this.languageClient) {
            this.disposeWorker(keepWorker);
            return Promise.resolve();
        }

        // then attempt to dispose the LC
        if (this.languageClient && this.languageClient.isRunning()) {
            try {
                await this.languageClient.dispose();
                this.disposeWorker(keepWorker);
                this.languageClient = undefined;
                this.logger?.info('monaco-languageclient and monaco-editor were successfully disposed.');
                return Promise.resolve();
            } catch (e) {
                const languageClientError: LanguageClientError = {
                    message: `languageClientWrapper (${this.name}): Disposing the monaco-languageclient resulted in error.`,
                    error: (e as Error) ?? 'No error was provided.'
                };
                return Promise.reject(languageClientError);
            }
        }
        else {
            // disposing the languageclient if it does not exist is considered ok
            return Promise.resolve();
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
