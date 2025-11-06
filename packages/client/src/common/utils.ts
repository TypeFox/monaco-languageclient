/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { WebSocketUrlParams, WebSocketUrlString } from './commonTypes.js';

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

export const encodeStringOrUrlToDataUrl = (input: string | URL) => {
    if (input instanceof URL) {
        return input.href;
    } else {
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        return new URL(`data:text/plain;base64,${base64}`).href;
    }
};

export const delayExecution = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export class Deferred<T = void> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;

    constructor() {
        this.promise = new Promise<T>((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
}
