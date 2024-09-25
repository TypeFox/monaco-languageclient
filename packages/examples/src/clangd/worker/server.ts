/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import clangdWorkerUrl from './clangd-server?worker&url';

export async function createServer() {
    let clangdResolve = () => { };
    const clangdReady = new Promise<void>((r) => (clangdResolve = r));
    const worker = new Worker(clangdWorkerUrl, {
        type: 'module',
        name: 'Clangd Server Worker',
    });
    const readyListener = (e: MessageEvent) => {
        switch (e.data?.type) {
            case 'ready': {
                clangdResolve();
                break;
            }
            case 'progress': {
                break;
            }
        }
    };
    worker.addEventListener('message', readyListener);
    await clangdReady;
    return worker;
}
