/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { RegisteredFileSystemProvider, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { ComChannelEndpoint, RawPayload, WorkerMessage, type ComRouter } from 'wtd-core';

/**
 * Answer the file create request
 */
export class FileHandlerMain implements ComRouter {
    private endpointFs?: ComChannelEndpoint;
    private fileSystemProvider: RegisteredFileSystemProvider;
    private readiness: () => void;

    constructor(fileSystemProvider: RegisteredFileSystemProvider, readiness: () => void) {
        this.fileSystemProvider = fileSystemProvider;
        this.readiness = readiness;
    }

    setComChannelEndpoint(comChannelEndpoint: ComChannelEndpoint): void {
        this.endpointFs = comChannelEndpoint;
    }

    async fs_driver_init(message: WorkerMessage) {
        await this.endpointFs?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'fs_driver_init_confirm'
            }),
            awaitAnswer: false
        });

        // send double confirmation
        await this.endpointFs?.sentMessage({
            message: WorkerMessage.fromPayload(
                new RawPayload({
                    hello: 'worker'
                }),
                'fs_follower_init'
            ),
            awaitAnswer: true,
            expectedAnswer: 'fs_follower_init_confirm'
        });
    }

    async syncFile(message: WorkerMessage) {
        const rawPayload = message.payloads[0] as RawPayload;
        const resourceUri = vscode.Uri.file(rawPayload.message.raw.resourceUri);
        this.fileSystemProvider.registerFile(new RegisteredMemoryFile(resourceUri, rawPayload.message.raw.content));

        await this.endpointFs?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'syncFile_confirm',
                overridePayloads: new RawPayload({
                    status: 'created',
                    message: `Created: ${rawPayload.message.raw.resourceUri}`
                })
            })
        });
    }

    async fs_driver_ready(message: WorkerMessage) {
        this.readiness();

        await this.endpointFs?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'fs_driver_ready_confirm'
            }),
            awaitAnswer: false
        });
    }
}

export class MainRemoteMessageChannelFs {
    constructor(fileSystemProvider: RegisteredFileSystemProvider, port: MessagePort, readiness: () => void) {
        const fileHandlerMain = new FileHandlerMain(fileSystemProvider, readiness);
        const endpointFs = new ComChannelEndpoint({
            endpointId: 21,
            endpointName: 'port_main_fs',
            endpointConfig: {
                $type: 'DirectImplConfig',
                impl: port
            },
            verbose: false
        });
        endpointFs.connect(fileHandlerMain);
    }
}
