/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Server } from 'socket.io';

export const runFilesServer = () => {
    const port = 22001;
    const io = new Server(port, {
        cors: {
            origin: 'http://localhost:20001',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`connect ${socket.id}`);

        socket.on('ping', (cb) => {
            console.log('ping');
            cb();
        });

        socket.on('disconnect', () => {
            console.log(`disconnect ${socket.id}`);
        });
    });
};
