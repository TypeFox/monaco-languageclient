/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Server, type Socket } from 'socket.io';
import { SocketIoMessageReader, SocketIoMessageWriter, type MessageTransports } from 'vscode-socketio-jsonrpc';
import { ConsoleLogger, LogLevel, type LogLevelValue } from '../logger.js';

export type SocketIoServerConfig = {
    protocol?: 'http' | 'https';
    hostname: string;
    wsPort: number;
    corsPort: number;
    messageTransportHandler?: (messageTransports: MessageTransports) => void;
    socketHandler?: (socketHandler: Socket) => void;
    logLevel?: LogLevelValue | number;
};

export class SocketIoServer {

    private logger = new ConsoleLogger();
    private config: SocketIoServerConfig;
    private io?: Server;
    private socket?: Socket;
    private messageTransports?: MessageTransports;

    constructor(config: SocketIoServerConfig) {
        this.config = config;
        this.config.protocol = this.config.protocol ?? 'http';
        this.logger.setLevel(this.config.logLevel ?? LogLevel.Off);
    }

    start() {
        this.io = new Server(this.config.wsPort, {
            cors: {
                origin: `${this.config.protocol}://${this.config.hostname}:${this.config.corsPort}`,
                methods: ['GET', 'POST']
            }
        });
        this.logger.debug(`Started Socket.IO server on ws://localhost:${this.config.wsPort} with CORS from http://localhost:${this.config.corsPort}`);

        // use middleware to check connection count
        this.io.use((_socket, next) => {
            if ((this.io?.engine.clientsCount ?? 0) > 1) {
                const err = new Error("Server is busy: Only one connection to a language server is allowed.");
                this.logger.error(err.message);
                next(err);
            } else {
                next();
            }
        });

        this.io.on('connection', (socket) => {
            this.logger.debug(`connect ${socket.id}`);
            this.socket = socket;

            socket.on('disconnect', () => {
                this.logger.debug(`disconnect ${socket.id}`);
            });

            this.messageTransports = createMessageTransports(socket);
            this.config.socketHandler?.(this.socket);
            this.config.messageTransportHandler?.(this.messageTransports);
        });
    }

    isStarted(): boolean {
        return (this.io !== undefined);
    }

    async shutdown() {
        await this.io?.close((err) => {
            // if all connections are closed this function is called anyway, but err should be undefined
            if (err !== undefined) {
                this.logger.error(`Error during connection closure: ${err?.message}`);
            }
        });
        this.io = undefined;
    }

    getSocket(): Socket | undefined {
        return this.socket;
    }

    getMessageTransports(): MessageTransports | undefined {
        return this.messageTransports;
    }
}

export const createMessageTransports = (socket: Socket): MessageTransports => {
    return {
        reader: new SocketIoMessageReader(socket),
        writer: new SocketIoMessageWriter(socket)
    }
};

