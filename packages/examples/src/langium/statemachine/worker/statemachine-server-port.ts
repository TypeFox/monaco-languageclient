/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { start } from './statemachine-server-start.js';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (event: MessageEvent) => {
    const data = event.data;
    console.log(event.data);
    if (data.port !== undefined) {
        start(data.port, 'statemachine-server-port');

        setTimeout(() => {
            // test independent communication
            self.postMessage('started');
        }, 1000);
    }
};
