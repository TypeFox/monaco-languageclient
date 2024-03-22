/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { WebSocketConfigOptions, WebSocketConfigOptionsUrl } from './commonTypes.js';

export const createUrl = (config: WebSocketConfigOptions | WebSocketConfigOptionsUrl) => {
    let buildUrl = '';
    if ((config as WebSocketConfigOptionsUrl).url) {
        const options = config as WebSocketConfigOptionsUrl;
        if (!options.url.startsWith('ws://') && !options.url.startsWith('wss://')) {
            throw new Error(`This is not a proper websocket url: ${options.url}`);
        }
        buildUrl = options.url;
    } else {
        const options = config as WebSocketConfigOptions;
        const protocol = options.secured ? 'wss' : 'ws';
        buildUrl = `${protocol}://${options.host}`;
        if (options.port) {
            if (options.port !== 80) {
                buildUrl += `:${options.port}`;
            }
        }
        if (options.path) {
            buildUrl += `/${options.path}`;
        }
        if (options.extraParams){
            const url = new URL(buildUrl);

            for (const [key, value] of Object.entries(options.extraParams)) {
                if (value) {
                    url.searchParams.set(key, value instanceof Array ? value.join(',') : value.toString());
                }
            }

            buildUrl = url.toString();
        }
    }
    return buildUrl;
};

export const verifyUrlorCreateDataUrl = (input: string | URL) => {
    return (input instanceof URL) ? input.href : new URL(`data:text/plain;base64,${btoa(input)}`).href;
};
