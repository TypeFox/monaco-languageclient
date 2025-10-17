/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { SocketIoClient } from 'vscode-socketio-jsonrpc/browser';

const socketIoClient = new SocketIoClient({
    url: 'ws://localhost:30200'
});
const socket = socketIoClient.start();

socket.emit('ls:start', (response: any) => {
    console.info('Language server started:', response);

    socket.disconnect();
});
