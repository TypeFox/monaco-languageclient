/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { type ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { DirectoryListingRequest, DirectoryListingRequestResult, EndpointType, FileReadRequest, FileReadRequestResult, FileSystemEndpoint, FileUpdate, FileUpdateResult, StatsRequest, StatsRequestResult } from '../definitions.js';

export class EmptyFileSystemEndpoint implements FileSystemEndpoint {

    private endpointType: EndpointType;
    private logger?: ILogger;

    constructor(endpointType: EndpointType) {
        this.endpointType = endpointType;
    }

    init(): void { }

    getFileSystemInfo(): string {
        return 'This file system performs no operations.';
    }

    setLogger(logger: ILogger): void {
        this.logger = logger;
    }

    getEndpointType(): EndpointType {
        return this.endpointType;
    }

    readFile(params: FileReadRequest): Promise<FileReadRequestResult> {
        this.logger?.info(`Reading file: ${params.resourceUri}`);
        return Promise.resolve({
            status: 'denied',
            content: ''
        });
    }

    writeFile(params: FileUpdate): Promise<FileUpdateResult> {
        this.logger?.info(`Writing file: ${params.resourceUri}`);
        return Promise.resolve({ status: 'denied' });
    }

    syncFile(params: FileUpdate): Promise<FileUpdateResult> {
        this.logger?.info(`Syncing file: ${params.resourceUri}`);
        return Promise.resolve({ status: 'denied' });
    }

    getFileStats(params: StatsRequest): Promise<StatsRequestResult> {
        this.logger?.info(`Getting file stats for: "${params.resourceUri}" (${params.type})`);
        return Promise.reject('No stats available.');
    }

    listFiles(params: DirectoryListingRequest): Promise<DirectoryListingRequestResult> {
        this.logger?.info(`Listing files for directory: "${params.directoryUri}"`);
        return Promise.reject('No file listing possible.');
    }

}
