/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { DirectoryListingRequest, DirectoryListingRequestResult, EndpointType, FileReadRequest, FileReadRequestResult, FileSystemEndpoint, FileUpdate, FileUpdateResult, StatsRequest, StatsRequestResult } from 'monaco-languageclient/fs';
import { ComChannelEndpoint, ComRouter, RawPayload, WorkerMessage } from 'wtd-core';

class FileHandlerWorker implements ComRouter {

    private portClandFsEndpoint: ComChannelEndpoint;

    setComChannelEndpoint(comChannelEndpoint: ComChannelEndpoint): void {
        this.portClandFsEndpoint = comChannelEndpoint;
    }

    async fs_follower_init(message: WorkerMessage) {
        await this.portClandFsEndpoint.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'fs_follower_init_confirm'
            })
        });
    }
}

export class WorkerRemoteMessageChannelFs implements FileSystemEndpoint {

    private clangdFsEndpoint?: ComChannelEndpoint;
    private emscriptenFS: typeof FS;

    constructor(port: MessagePort, emscriptenFS: typeof FS) {
        this.emscriptenFS = emscriptenFS;
        this.clangdFsEndpoint = new ComChannelEndpoint({
            endpointId: 22,
            endpointName: 'port_clangd_fs',
            endpointConfig: {
                $type: 'DirectImplConfig',
                impl: port
            },
            verbose: false
        });
        this.clangdFsEndpoint.connect(new FileHandlerWorker());
    }

    getEndpointType(): EndpointType {
        return EndpointType.DRIVER;
    }

    async init() {
        await this.clangdFsEndpoint?.sentMessage({
            message: WorkerMessage.fromPayload(new RawPayload({
                hello: 'main',
            }), 'fs_driver_init'),
            awaitAnswer: true,
            expectedAnswer: 'fs_driver_init_confirm'
        });
    }

    async ready() {
        await this.clangdFsEndpoint?.sentMessage({
            message: WorkerMessage.createNew({
                cmd: 'fs_driver_ready'
            }),
            awaitAnswer: true,
            expectedAnswer: 'fs_driver_ready_confirm'
        });
    }

    getFileSystemInfo(): string {
        return 'This file system sends all requests to the remote end of the message channel.';
    }

    readFile(_params: FileReadRequest): Promise<FileReadRequestResult> {
        return Promise.resolve({
            status: 'denied',
            content: ''
        });
    }

    writeFile(_params: FileUpdate): Promise<FileUpdateResult> {
        return Promise.resolve({ status: 'denied' });
    }

    async syncFile(params: FileUpdate): Promise<FileUpdateResult> {
        const content = this.emscriptenFS.readFile(params.resourceUri, { encoding: 'binary' });
        const result = await this.clangdFsEndpoint?.sentMessage({
            message: WorkerMessage.fromPayload(new RawPayload({
                resourceUri: params.resourceUri,
                content: content
            }), 'syncFile'),
            transferables: [content.buffer],
            awaitAnswer: true,
            expectedAnswer: 'syncFile_confirm'
        });

        const rawPayload = result?.payloads[0] as RawPayload;
        // console.log(rawPayload);

        return Promise.resolve({
            status: rawPayload.message.raw?.status,
            message: rawPayload.message.raw?.message
        });
    }

    getFileStats(_params: StatsRequest): Promise<StatsRequestResult> {
        return Promise.reject('No stats available.');
    }

    listFiles(_params: DirectoryListingRequest): Promise<DirectoryListingRequestResult> {
        return Promise.reject('No file listing possible.');
    }

}
