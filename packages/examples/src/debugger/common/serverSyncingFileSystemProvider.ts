/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @stylistic/indent */

import { type IDisposable } from '@codingame/monaco-vscode-api/vscode/vs/base/common/lifecycle';
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri';
import { Emitter } from '@codingame/monaco-vscode-editor-api';
import {
    FileSystemProviderCapabilities,
    FileSystemProviderError,
    FileSystemProviderErrorCode,
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

export interface FileText {
    text: string;
    updated: number;
}

export interface Files {
    [path: string]: Files | FileText;
}

export function isText(obj: unknown): obj is Text {
    const typedObj = obj as Text;
    return typeof typedObj === 'string';
}

export function isFileText(obj: object): obj is FileText {
    const typedObj = obj as FileText;
    return isText(typedObj.text);
}

export interface FlatFile {
    path: string[];
    text: string;
    updated: number;
}

export class ServerSyncingFileSystemProvider
    implements IFileSystemProviderWithFileReadWriteCapability
{
    capabilities: FileSystemProviderCapabilities;

    _onDidChangeCapabilities = new Emitter<void>();
    onDidChangeCapabilities = this._onDidChangeCapabilities.event;

    _onDidChangeFile = new Emitter<readonly IFileChange[]>();
    onDidChangeFile = this._onDidChangeFile.event;

    _onDidChangeOverlays = new Emitter<void>();
    onDidChangeOverlays = this._onDidChangeOverlays.event;

    onFileUpdate: (file: FlatFile) => Promise<void>;
    onFileDelete: (path: string[]) => Promise<void>;

    onDidWatchError?: VSEvent<string> | undefined;

    root: Files;

    constructor(
        root: Files,
        onFileUpdate: (file: FlatFile) => Promise<void>,
        onFileDelete: (path: string[]) => Promise<void>,
    ) {
        this.root = root;
        this.onFileUpdate = onFileUpdate;
        this.onFileDelete = onFileDelete;
        this.capabilities =
            // eslint-disable-next-line no-bitwise
            FileSystemProviderCapabilities.FileReadWrite |
            FileSystemProviderCapabilities.PathCaseSensitive;
    }

    getAllFiles(resource?: URI): FlatFile[] {
        const flatFiles: FlatFile[] = [];

        function f(files: Files, path: string[]) {
            Object.entries(files).forEach(([key, value]) => {
                if (isFileText(value)) {
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

        const { file } = resource
            ? this.getFile(resource)
            : { file: this.root };
        if (!file) {
            return [];
        }

        if (isFileText(file)) {
            throw new Error();
        }

        f(file, []);

        return flatFiles;
    }

    getFile(
        resource: URI,
        create?: 'directory' | 'file',
    ): { path: string[]; parent: Files | null; file: Files | FileText | null } {
        if (resource.scheme !== 'file') {
            console.error('[FILE] only file scheme is supported');
            throw new Error();
        }

        if (!resource.path.startsWith('/')) {
            console.error('[FILE] only root paths are allowed');
            throw new Error();
        }

        const paths = resource.path.slice(1).split('/');
        let parent: Files = this.root;
        let file: Files | FileText = this.root;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i]!;
            if (isFileText(file)) {
                console.error(`[FILE] ${path} is not a directory`);
                throw new Error();
            }

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (file[path] === undefined) {
                if (create) {
                    if (i < paths.length - 1 || create === 'directory') {
                        file[path] = {};
                    } else {
                        file[path] = {
                            text: '',
                            updated: Date.now(),
                        };
                    }
                } else {
                    return { path: paths, parent: null, file: null };
                }
            }

            parent = file;
            file = file[path];
        }

        return { path: paths, parent, file };
    }

    readFile(resource: URI): Promise<Uint8Array> {
        const { file } = this.getFile(resource);
        if (!file || !isFileText(file)) {
            console.error(`[FILE] ${resource.path} does not exist`);
            throw new Error();
        }

        return Promise.resolve(new TextEncoder().encode(file.text));
    }

    async writeFile(
        resource: URI,
        content: Uint8Array,
        _opts: IFileWriteOptions,
    ): Promise<void> {
        console.log(`[FILE] writeFile ${resource.path}`);
        const { path, file } = this.getFile(resource, 'file');
        if (!file || !isFileText(file)) {
            throw new Error();
        }

        file.text = new TextDecoder().decode(content);
        file.updated = Date.now();

        await this.onFileUpdate({
            path: path,
            text: file.text,
            updated: file.updated,
        });
    }

    watch(_resource: URI, _opts: IWatchOptions): IDisposable {
        return {
            dispose: () => {
                //
            },
        };
    }

    stat(resource: URI): Promise<IStat> {
        const { file } = this.getFile(resource);
        if (!file) {
            throw FileSystemProviderError.create(
                'Not found',
                FileSystemProviderErrorCode.FileNotFound,
            );
        } else if (isFileText(file)) {
            const stat: IStat = {
                type: FileType.File,
                mtime: 0,
                ctime: 0,
                size: file.text.length,
            };
            return Promise.resolve(stat);
        } else {
            const stat: IStat = {
                type: FileType.Directory,
                mtime: 0,
                ctime: 0,
                size: 0,
            };
            return Promise.resolve(stat);
        }
    }

    mkdir(resource: URI): Promise<void> {
        console.log(`[FILE] mkdir ${resource.path}`);
        const { file } = this.getFile(resource, 'directory');
        if (!file || isFileText(file)) {
            throw new Error();
        }
        return Promise.resolve();
    }

    readdir(resource: URI): Promise<Array<[string, FileType]>> {
        const { file } = this.getFile(resource);
        if (!file || isFileText(file)) {
            throw new Error();
        }

        return Promise.resolve(
            Object.entries(file).map((x) => {
                return [
                    x[0],
                    isFileText(x[1]) ? FileType.File : FileType.Directory,
                ];
            }),
        );
    }

    async delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
        console.log('[FILE] delete', resource, opts);
        const { path, parent } = this.getFile(resource);
        if (parent) {
            delete parent[path[path.length - 1]!];
        }
        await this.onFileDelete(path);
    }

    async rename(
        from: URI,
        to: URI,
        opts: IFileOverwriteOptions,
    ): Promise<void> {
        console.error('[FILE] rename', from, to, opts);
        const { file } = this.getFile(from);
        if (!file) {
            return;
        }

        if (isFileText(file)) {
            await this.writeFile(to, new TextEncoder().encode(file.text), {
                create: true,
                overwrite: true,
                unlock: false,
                atomic: false,
            });

            await this.delete(from, {
                recursive: false,
                useTrash: false,
                atomic: false,
            });
        } else {
            const files = this.getAllFiles(from);

            const toFile = this.getFile(to, 'directory');
            for (const file of files) {
                await this.writeFile(
                    URI.file([...toFile.path, file.path].join('/')),
                    new TextEncoder().encode(file.text),
                    {
                        create: true,
                        overwrite: true,
                        unlock: false,
                        atomic: false,
                    },
                );
            }

            await this.delete(from, {
                recursive: false,
                useTrash: false,
                atomic: false,
            });
        }
    }
}
