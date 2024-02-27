/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { start } from './statemachine-server-start.js';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = async (event: MessageEvent) => {
    const data = event.data;
    if (data.port) {
        start(data.port, 'statemachine-server-port');

        setTimeout(() => {
            // test independent communication
            self.postMessage('started');
        }, 1000);
    }
};
