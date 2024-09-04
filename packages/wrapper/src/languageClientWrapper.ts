/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MonacoLanguageClient, IConnectionProvider, WorkerConfigOptions, WorkerConfigDirect, LanguageClientConfigOptions, WebSocketConfigOptionsParams, WebSocketConfigOptionsDirect, WebSocketConfigOptionsUrl, LanguageClientRestartOptions } from 'monaco-languageclient';
import { Logger } from 'monaco-languageclient/tools';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver-protocol/browser.js';
import { CloseAction, ErrorAction, LanguageClientOptions, MessageTransports, State } from 'vscode-languageclient/browser.js';
import { createUrl } from './utils.js';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

export type LanguageClientConfig = {
    languageId: string;
    options: LanguageClientConfigOptions;
    name?: string;
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
    private languageId: string;
    private worker?: Worker;
    private port?: MessagePort;
    private name?: string;
    private logger: Logger | undefined;

    async init(config: {
        languageClientConfig: LanguageClientConfig,
        logger?: Logger
    }) {
        this.languageClientConfig = config.languageClientConfig;
        this.name = this.languageClientConfig.name ?? 'unnamed';
        this.logger = config.logger;
        this.languageId = this.languageClientConfig.languageId;
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
        return this.languageClient !== undefined && this.languageClient.isRunning();
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
    async restartLanguageClient(updatedWorker?: Worker, keepWorker: boolean = false): Promise<void> {
        await this.disposeLanguageClient(keepWorker);

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

    protected async startLanguageClientConnection(): Promise<void> {
        if (this.languageClient?.isRunning() ?? false) {
            this.logger?.info('startLanguageClientConnection: monaco-languageclient already running!');
            return Promise.resolve();
        }
        const lccOptions = this.languageClientConfig?.options;

        // eslint-disable-next-line no-async-promise-executor
        return new Promise((resolve, reject) => {
            if (lccOptions === undefined) {
                reject('Unable to start languageclient, because configuration options are not provided.');
            } else {
                if (lccOptions.$type === 'WebSocketDirect' || lccOptions.$type === 'WebSocketParams' || lccOptions.$type === 'WebSocketUrl') {
                    this.initMessageTransportWebSocket(lccOptions, resolve, reject);
                } else {
                    // init of worker and start of languageclient can be handled directly, because worker available already
                    this.initMessageTransportWorker(lccOptions, resolve, reject);
                }
            }
        });
    }

    protected async initMessageTransportWebSocket(lccOptions: WebSocketConfigOptionsDirect | WebSocketConfigOptionsParams | WebSocketConfigOptionsUrl,
        resolve: () => void, reject: (reason?: unknown) => void) {
        const webSocket = lccOptions.$type === 'WebSocketDirect' ? lccOptions.webSocket : new WebSocket(createUrl(lccOptions));

        const createMessageTransports = (transport: Worker | MessagePort | WebSocket) => {
            const iWebSocket = toSocket(transport as WebSocket);
            return {
                reader: new WebSocketMessageReader(iWebSocket),
                writer: new WebSocketMessageWriter(iWebSocket)
            };
        };

        // if websocket is already open, then start the languageclient directly
        if (webSocket.readyState === WebSocket.OPEN) {
            await this.performLanguageClientStart(webSocket, createMessageTransports, resolve, reject);
        }

        // otherwise start on open
        webSocket.onopen = async () => {
            await this.performLanguageClientStart(webSocket, createMessageTransports, resolve, reject);
        };
        webSocket.onerror = (ev: Event) => {
            const languageClientError: LanguageClientError = {
                message: `languageClientWrapper (${this.name}): Websocket connection failed.`,
                error: (ev as ErrorEvent).error ?? 'No error was provided.'
            };
            reject(languageClientError);
        };
    }

    protected async initMessageTransportWorker(lccOptions: WorkerConfigDirect | WorkerConfigOptions, resolve: () => void, reject: (reason?: unknown) => void) {
        if (!this.worker) {
            if (lccOptions.$type === 'WorkerConfig') {
                const workerConfig = lccOptions as WorkerConfigOptions;
                this.worker = new Worker(new URL(workerConfig.url, import.meta.url).href, {
                    type: workerConfig.type,
                    name: workerConfig.workerName
                });

                this.worker.onerror = (ev) => {
                    const languageClientError: LanguageClientError = {
                        message: `languageClientWrapper (${this.name}): Illegal worker configuration detected. Potentially the url is wrong.`,
                        error: ev.error ?? 'No error was provided.'
                    };
                    reject(languageClientError);
                };
            } else {
                const workerDirectConfig = lccOptions as WorkerConfigDirect;
                this.worker = workerDirectConfig.worker;
            }
            if (lccOptions.messagePort !== undefined) {
                this.port = lccOptions.messagePort;
            }
        }

        const portOrWorker = this.port ? this.port : this.worker;
        const createMessageTransports = (transport: Worker | MessagePort | WebSocket) => {
            return {
                reader: new BrowserMessageReader(transport),
                writer: new BrowserMessageWriter(transport)
            };
        };
        await this.performLanguageClientStart(portOrWorker, createMessageTransports, resolve, reject);
    }

    protected async performLanguageClientStart(transport: Worker | MessagePort | WebSocket,
        createMessageTransports: (transport: Worker | MessagePort | WebSocket) => MessageTransports,
        resolve: () => void, reject: (reason?: unknown) => void) {
        // do not perform another start attempt if already running
        if (this.languageClient?.isRunning() ?? false) {
            this.logger?.info('performLanguageClientStart: monaco-languageclient already running!');
            resolve();
        }
        const mlcConfig = {
            name: this.languageClientConfig?.name ?? 'Monaco Wrapper Language Client',

            // allow to fully override the clientOptions
            clientOptions: this.languageClientConfig?.clientOptions ?? {
                documentSelector: [this.languageId],
                // disable the default error handler
                errorHandler: {
                    error: () => ({ action: ErrorAction.Continue }),
                    closed: () => ({ action: CloseAction.DoNotRestart })
                }
            },
            connectionProvider: this.languageClientConfig?.connectionProvider ?? {
                get: async () => createMessageTransports(transport)
            }
        };

        this.languageClient = new MonacoLanguageClient(mlcConfig);
        const messageTransports = await mlcConfig.connectionProvider.get('utf-8');

        const lccOptions = this.languageClientConfig?.options;
        this.initRestartConfiguration(messageTransports, lccOptions?.restartOptions);

        messageTransports.reader.onClose(async () => {
            await this.languageClient?.stop();

            if ((lccOptions?.$type === 'WebSocketParams' || lccOptions?.$type === 'WebSocketUrl') && lccOptions.stopOptions) {
                const stopOptions = lccOptions.stopOptions;
                stopOptions.onCall(this.getLanguageClient());
                if (stopOptions.reportStatus !== undefined) {
                    this.logger?.info(this.reportStatus().join('\n'));
                }
            }
        });

        try {
            await this.languageClient.start();

            if ((lccOptions?.$type === 'WebSocketParams' || lccOptions?.$type === 'WebSocketUrl') && lccOptions.startOptions) {
                const startOptions = lccOptions.startOptions;
                startOptions.onCall(this.getLanguageClient());
                if (startOptions.reportStatus !== undefined) {
                    this.logger?.info(this.reportStatus().join('\n'));
                }
            }
        } catch (e: unknown) {
            const languageClientError: LanguageClientError = {
                message: `languageClientWrapper (${this.name}): Start was unsuccessful.`,
                error: Object.hasOwn(e ?? {}, 'cause') ? (e as Error) : 'No error was provided.'
            };
            reject(languageClientError);
        }
        this.logger?.info(`languageClientWrapper (${this.name}): Started successfully.`);
        resolve();
    }

    protected initRestartConfiguration(messageTransports: MessageTransports, restartOptions?: LanguageClientRestartOptions) {
        if (restartOptions !== undefined) {
            let retry = 0;

            const readerOnError = messageTransports.reader.onError(() => restartLC);
            const readerOnClose = messageTransports.reader.onClose(() => restartLC);

            const restartLC = async () => {
                if (this.isStarted()) {
                    try {
                        readerOnError.dispose();
                        readerOnClose.dispose();

                        await this.restartLanguageClient(this.worker, restartOptions.keepWorker);
                    } finally {
                        retry++;
                        if (retry > (restartOptions.retries) && !this.isStarted()) {
                            this.logger?.info('Disabling Language Client. Failed to start clangd after 5 retries');
                        } else {
                            setTimeout(async () => {
                                await this.restartLanguageClient(this.worker, restartOptions.keepWorker);
                            }, restartOptions.timeout);
                        }
                    }
                }
            };
        }
        const successCallback = messageTransports.reader.listen(() => {
            this.logger?.info('MessageTransport Reader started listening.');
            successCallback.dispose();
        });
    }

    protected disposeWorker(keepWorker?: boolean) {
        if (keepWorker === undefined || keepWorker === false) {
            this.worker?.terminate();
            this.worker = undefined;
        }
    }

    async disposeLanguageClient(keepWorker?: boolean): Promise<void> {
        // If there is no language client, try to terminate the worker
        if (!this.languageClient) {
            this.disposeWorker(keepWorker);
            return Promise.resolve();
        }

        // then attempt to dispose the LC
        if (this.languageClient.isRunning()) {
            try {
                await this.languageClient.dispose();
                this.disposeWorker(keepWorker);
                this.languageClient = undefined;
                this.logger?.info('monaco-languageclient and monaco-editor were successfully disposed.');
                return Promise.resolve();
            } catch (e) {
                const languageClientError: LanguageClientError = {
                    message: `languageClientWrapper (${this.name}): Disposing the monaco-languageclient resulted in error.`,
                    error: Object.hasOwn(e ?? {}, 'cause') ? (e as Error) : 'No error was provided.'
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
