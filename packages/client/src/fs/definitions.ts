/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';

export interface FileReadRequest {
    resourceUri: string
}

export type FileReadResultStatus = 'success' | 'denied';

export interface FileReadRequestResult {
    status: FileReadResultStatus
    content: string | ArrayBuffer | ArrayBufferLike | BlobPart
}

export interface FileUpdate {
    resourceUri: string
    content: string | ArrayBuffer | ArrayBufferLike | BlobPart
}

export type FileUpdateResultStatus = 'equal' | 'updated' | 'created' | 'denied';

export interface FileUpdateResult {
    status: FileUpdateResultStatus
    message?: string
}

export interface DirectoryListingRequest {
    directoryUri: string
}

export interface DirectoryListingRequestResult {
    files: string[]
}

export type StatsRequestType = 'directory' | 'file';

export interface StatsRequest {
    type: StatsRequestType,
    resourceUri: string
}

export interface StatsRequestResult {
    type: StatsRequestType
    size: number
    name: string
    mtime: number
}

export type EndpointType = 'DRIVER' | 'FOLLOWER' | 'LOCAL' | 'EMPTY';

export interface FileSystemCapabilities {

    /**
     * Get a text file content
     * @param params the resourceUri of the file
     * @returns The ReadFileResult containing the content of the file
     */
    readFile(params: FileReadRequest): Promise<FileReadRequestResult>

    /**
     * Save a file on the filesystem
     * @param params the resourceUri and the content of the file
     * @returns The FileUpdateResult containing the result of the operation and an optional message
     */
    writeFile(params: FileUpdate): Promise<FileUpdateResult>;

    /**
     * The implementation has to decide if the file at given uri at need to be updated
     * @param params the resourceUri and the content of the file
     * @returns The FileUpdateResult containing the result of the operation and an optional message
     */
    syncFile(params: FileUpdate): Promise<FileUpdateResult>;

    /**
     * Get file stats on a given file
     * @param params the resourceUri and if a file or a directory is requested
     */
    getFileStats(params: StatsRequest): Promise<StatsRequestResult>

    /**
     * List the files of a directory
     * @param resourceUri the Uri of the directory
     */
    listFiles(params: DirectoryListingRequest): Promise<DirectoryListingRequestResult>

}

/**
 * Defines the APT for a file system endpoint
 */
export interface FileSystemEndpoint extends FileSystemCapabilities {

    /**
     * Whatever can't be handled in the constructor should be done here
     */
    init?(): void;

    /**
     * Set an optional logger
     * @param logger the logger implemenation
     */
    setLogger?(logger: ILogger): void;

    /**
     * Get the type of the client
     */
    getEndpointType(): EndpointType;

    /**
     * Provide info about the file system
     */
    getFileSystemInfo(): string;

    /**
     * Signal readiness
     */
    ready?(): void;
}
