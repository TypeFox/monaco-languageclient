/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { CancellationToken } from '@codingame/monaco-vscode-api/vscode/vs/base/common/cancellation';
import { type IDisposable } from '@codingame/monaco-vscode-api/vscode/vs/base/common/lifecycle';
import { type ReadableStreamEvents } from '@codingame/monaco-vscode-api/vscode/vs/base/common/stream';
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri';
import {
    type IFileOpenOptions,
    type IFileReadStreamOptions,
} from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/files';
import { Emitter } from '@codingame/monaco-vscode-editor-api';
import {
    FileSystemProviderCapabilities,
    FileType,
    type IFileChange,
    type IFileDeleteOptions,
    type IFileOverwriteOptions,
    type IFileSystemProviderWithFileReadWriteCapability,
    type IFileWriteOptions,
    type IStat,
    type IWatchOptions,
} from '@codingame/monaco-vscode-files-service-override';
import { type Event as VSEvent } from 'vscode';

export type FilesType = 'text' | 'directory';

export interface FilesBase {
    type: FilesType;
}

export interface FilesText extends FilesBase {
    type: 'text';
    text: string;
    updated: number;
}

export type FilesAll = FilesText | Files;

export interface Files extends FilesBase {
    type: 'directory';
    files: {
        [path: string]: FilesAll;
    };
}

interface FlatFile {
    path: string[];
    text: string;
    updated: number;
}

export class MonacoFileSystemProvider
    implements IFileSystemProviderWithFileReadWriteCapability
{
    capabilities: FileSystemProviderCapabilities;

    _onDidChangeCapabilities = new Emitter<void>();
    onDidChangeCapabilities = this._onDidChangeCapabilities.event;

    _onDidChangeFile = new Emitter<readonly IFileChange[]>();
    onDidChangeFile = this._onDidChangeFile.event;

    _onDidChangeOverlays = new Emitter<void>();
    onDidChangeOverlays = this._onDidChangeOverlays.event;

    onFileUpdate: ((file: FlatFile) => Promise<void>) | null = null;
    onFileDelete: ((path: string[]) => Promise<void>) | null = null;

    onDidWatchError?: VSEvent<string> | undefined;

    root: Files;

    constructor(root: Files) {
        this.root = root;
        this.capabilities =
            FileSystemProviderCapabilities.FileReadWrite |
            FileSystemProviderCapabilities.PathCaseSensitive;
    }

    getAllFiles(): FlatFile[] {
        const flatFiles: FlatFile[] = [];

        function f(files: Files, path: string[]) {
            Object.entries(files.files).forEach(([key, value]) => {
                if (value.type == 'text') {
                    flatFiles.push({
                        path: [...path, key],
                        text: value.text,
                        updated: value.updated,
                    });
                } else {
                    f(value, [...path, key]);
                }
            });
        }

        f(this.root, []);

        return flatFiles;
    }

    getFile(
        resource: URI,
        create?: FilesType,
    ): { path: string[]; file: FilesAll } {
        if (resource.scheme !== 'file') {
            console.error('[FILE] only file scheme is supported');
            throw new Error('Method not implemented.');
        }

        if (!resource.path.startsWith('/')) {
            console.error('[FILE] only root paths are allowed');
            throw new Error('Method not implemented.');
        }

        const paths = resource.path.slice(1).split('/');
        let file: FilesAll = this.root;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i]!;
            if (file.type !== 'directory') {
                console.error(`[FILE] ${path} is not a directory`);
                throw new Error('Method not implemented.');
            }

            if (file.files[path] === undefined) {
                if (create) {
                    if (i < paths.length - 1 || create === 'directory') {
                        file.files[path] = {
                            type: 'directory',
                            files: {},
                        };
                    } else {
                        switch (create) {
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                            case 'text':
                                file.files[path] = {
                                    type: 'text',
                                    text: '',
                                    updated: Date.now(),
                                };
                                break;
                            default:
                                console.error(`[FILE] unknown type ${create}`);
                                throw new Error();
                        }
                    }
                } else {
                    console.error(
                        `[FILE] ${path} is not in parent`,
                        file,
                        paths,
                    );
                    throw new Error('Method not implemented.');
                }
            }

            file = file.files[path];
        }

        return { path: paths, file };
    }

    readFile(resource: URI): Promise<Uint8Array> {
        const { file } = this.getFile(resource);
        if (file.type === 'directory') {
            console.error(`[FILE] ${resource.path} does not exist`);
            throw new Error('Method not implemented.');
        }

        return Promise.resolve(new TextEncoder().encode(file.text));
    }

    async writeFile(
        resource: URI,
        content: Uint8Array,
        _opts: IFileWriteOptions,
    ): Promise<void> {
        console.log(`[FILE] writeFile ${resource.path}`);
        const { path, file } = this.getFile(resource, 'text');
        if (file.type !== 'text') {
            throw new Error();
        }

        file.text = new TextDecoder().decode(content);
        file.updated = Date.now();

        await this.onFileUpdate?.({
            path: path,
            text: file.text,
            updated: file.updated,
        });
    }

    watch(_resource: URI, _opts: IWatchOptions): IDisposable {
        // console.error(`JUSTIN watch`, resource, opts);
        return {
            dispose: () => {
                //
            },
        };
        // throw new Error('Method not implemented.');
    }

    stat(resource: URI): Promise<IStat> {
        const { file } = this.getFile(resource);
        if (file.type === 'directory') {
            const stat: IStat = {
                type: FileType.Directory,
                mtime: 0,
                ctime: 0,
                size: 0,
            };

            return Promise.resolve(stat);
        } else {
            const stat: IStat = {
                type: FileType.File,
                mtime: 0,
                ctime: 0,
                size: file.text.length,
            };
            return Promise.resolve(stat);
        }
    }

    mkdir(resource: URI): Promise<void> {
        console.error('JUSTIN mkdir', resource);
        throw new Error('Method not implemented.');
    }

    readdir(resource: URI): Promise<Array<[string, FileType]>> {
        const { file } = this.getFile(resource);
        if (file.type !== 'directory') {
            throw new Error();
        }

        return Promise.resolve(
            Object.entries(file.files).map((x) => {
                return [
                    x[0],
                    x[1].type === 'directory'
                        ? FileType.Directory
                        : FileType.File,
                ];
            }),
        );
    }

    delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
        console.error('JUSTIN delete', resource, opts);
        throw new Error('Method not implemented.');
    }

    rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
        console.error('JUSTIN rename', from, to, opts);
        throw new Error('Method not implemented.');
    }

    copy?(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
        console.error('JUSTIN copy', from, to, opts);
        throw new Error('Method not implemented.');
    }

    readFileStream?(
        resource: URI,
        opts: IFileReadStreamOptions,
        _token: CancellationToken,
    ): ReadableStreamEvents<Uint8Array> {
        console.error('JUSTIN readFileStream', resource, opts);
        throw new Error('Method not implemented.');
    }

    open?(resource: URI, opts: IFileOpenOptions): Promise<number> {
        console.error('JUSTIN open', resource, opts);
        throw new Error('Method not implemented.');
    }

    close?(fd: number): Promise<void> {
        console.error('JUSTIN close', fd);
        throw new Error('Method not implemented.');
    }

    read?(
        fd: number,
        _pos: number,
        _data: Uint8Array,
        _offset: number,
        _length: number,
    ): Promise<number> {
        console.error('JUSTIN read', fd);
        throw new Error('Method not implemented.');
    }

    write?(
        fd: number,
        _pos: number,
        _data: Uint8Array,
        _offset: number,
        _length: number,
    ): Promise<number> {
        console.error('JUSTIN write', fd);
        throw new Error('Method not implemented.');
    }

    cloneFile?(from: URI, to: URI): Promise<void> {
        console.error('JUSTIN cloneFile', from, to);
        throw new Error('Method not implemented.');
    }
}
