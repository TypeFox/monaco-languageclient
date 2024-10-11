/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Manager } from 'socket.io-client';

export const runFilesClient = () => {
    const manager = new Manager('ws://localhost:22001');
    const socket = manager.socket('/');

    socket.on('connect', () => {
        console.log(`connect ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('disconnect');
    });

    setInterval(() => {
        socket.emit('ping', () => {
            console.log('pong');
        });
    }, 1000);
};
