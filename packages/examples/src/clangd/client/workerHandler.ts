/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ComChannelEndpoint, ComRouter, RawPayload, WorkerMessage } from 'wtd-core';
import clangdWorkerUrl from '../worker/clangd-server?worker&url';
import { VolatileInput } from '../definitions.js';

class ClangdInteractionMain implements ComRouter {

    setComChannelEndpoint(_comChannelEndpoint: ComChannelEndpoint): void {
    }

    clangd_progress(_message: WorkerMessage) { }

    clangd_error(_message: WorkerMessage) { }
}

export class ClangdWorkerHandler {

    private interactionMain: ClangdInteractionMain = new ClangdInteractionMain();
    private endpointMain?: ComChannelEndpoint;

    async createWorker() {
        const languageServerWorker = new Worker(clangdWorkerUrl, {
            type: 'module',
            name: 'Clangd Server Worker',
        });
        this.endpointMain = new ComChannelEndpoint({
            endpointId: 1,
            endpointConfig: {
                $type: 'DirectImplConfig',
                impl: languageServerWorker
            },
            verbose: true,
            endpointName: 'main_worker'
        });
        this.endpointMain.connect(this.interactionMain);

        return languageServerWorker;
    }

    async init(config: {
        lsMessagePort: MessagePort,
        fsMessagePort: MessagePort,
        loadWorkspace: boolean,
        volatile?: VolatileInput
    }) {
        await this.endpointMain?.sentMessage({
            message: WorkerMessage.fromPayload(new RawPayload({
                lsMessagePort: config.lsMessagePort,
                fsMessagePort: config.fsMessagePort,
                volatile: config.volatile,
                loadWorkspace: config.loadWorkspace
            }), 'clangd_init'),
            transferables: [config.lsMessagePort, config.fsMessagePort],
            awaitAnswer: true,
            expectedAnswer: 'clangd_init_complete'
        });
    }

    async launch() {
        await this.endpointMain?.sentMessage({
            message: WorkerMessage.fromPayload(new RawPayload({}), 'clangd_launch'),
            awaitAnswer: true,
            expectedAnswer: 'clangd_launch_complete'
        });
    }
}
