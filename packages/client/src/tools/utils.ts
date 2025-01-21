/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { WebSocketUrlParams, WebSocketUrlString } from 'monaco-languageclient';

export const createUrl = (config: WebSocketUrlParams | WebSocketUrlString) => {
    let buildUrl = '';
    if ((config as WebSocketUrlString).url) {
        const options = config as WebSocketUrlString;
        if (!options.url.startsWith('ws://') && !options.url.startsWith('wss://')) {
            throw new Error(`This is not a proper websocket url: ${options.url}`);
        }
        buildUrl = options.url;
    } else {
        const options = config as WebSocketUrlParams;
        const protocol = options.secured ? 'wss' : 'ws';
        buildUrl = `${protocol}://${options.host}`;
        if (options.port !== undefined) {
            if (options.port !== 80) {
                buildUrl += `:${options.port}`;
            }
        }
        if (options.path !== undefined) {
            buildUrl += `/${options.path}`;
        }
        if (options.extraParams) {
            const url = new URL(buildUrl);

            for (const [key, value] of Object.entries(options.extraParams)) {
                url.searchParams.set(key, value instanceof Array ? value.join(',') : value.toString());
            }

            buildUrl = url.toString();
        }
    }
    return buildUrl;
};
