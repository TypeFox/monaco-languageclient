/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Socket } from 'socket.io-client';
import { Manager } from 'socket.io-client';
import { ConsoleLogger, LogLevel, type LogLevelValue } from '../logger.js';

export type SocketIoClientConfig = {
    url: string;
    logLevel?: LogLevelValue | number;
};

export class SocketIoClient {

    private logger = new ConsoleLogger();
    private config: SocketIoClientConfig;
    private socket?: Socket;

    constructor(config: SocketIoClientConfig) {
        this.config = config;
        this.logger.setLevel(this.config.logLevel ?? LogLevel.Off);
    }

    start(): Socket {
        const manager = new Manager(this.config.url);
        this.socket = manager.socket('/');

        this.logger.info('Connecting to ' + this.config.url);

        this.socket.on('connect', () => {
            this.logger.info(`connect ${this.socket?.id}`);
        });

        this.socket.on('disconnect', () => {
            this.logger.info('disconnect');
        });

        return this.socket;
    }

    getSocket(): Socket | undefined {
        return this.socket;
    }
}

