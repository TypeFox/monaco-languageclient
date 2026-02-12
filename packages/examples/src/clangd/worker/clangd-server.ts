/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver/browser.js';
import { ComChannelEndpoint, type ComRouter, RawPayload, WorkerMessage } from 'wtd-core';
import { WORKSPACE_PATH } from '../definitions.js';
import { JsonStream } from './json_stream.js';
import { WorkerRemoteMessageChannelFs } from './workerRemoteMessageChannelFs.js';
import { fsReadAllFiles } from './memfs-tools.js';
import clangdConfig from '../../../resources/clangd/workspace/.clangd?raw';
import JSZip from 'jszip';

declare const self: DedicatedWorkerGlobalScope;

interface RequiredResources {
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    ClangdJsModule: any;
    wasmDataUrl: string;
}

export class ClangdInteractionWorker implements ComRouter {
    private endpointWorker?: ComChannelEndpoint;

    private reader?: BrowserMessageReader;
    private writer?: BrowserMessageWriter;

    private lsMessagePort?: MessagePort;
    private fsMessagePort?: MessagePort;

    private emscriptenFS?: typeof FS;
    private remoteFs?: WorkerRemoteMessageChannelFs;

    private clearIndexedDb: boolean;
    private useCompressedWorkspace: boolean;
    private compressedWorkspaceUrl?: string;

    private startingAwait?: Promise<void>;
    private startingResolve: (value: void | PromiseLike<void>) => void;

    private synchingFSAwait?: Promise<void>;
    private synchingFSResolve: (value: void | PromiseLike<void>) => void;

    setComChannelEndpoint(comChannelEndpoint: ComChannelEndpoint): void {
        this.endpointWorker = comChannelEndpoint;
    }

    /**
     * Triggered by worker message
     */
    async clangd_init(message: WorkerMessage) {
        const rawPayload = (message.payloads![0] as RawPayload).message.raw;
        this.lsMessagePort = rawPayload.lsMessagePort as MessagePort;
        this.fsMessagePort = rawPayload.fsMessagePort as MessagePort;
        this.clearIndexedDb = rawPayload.clearIndexedDb as boolean;
        this.useCompressedWorkspace = rawPayload.useCompressedWorkspace as boolean;
        this.compressedWorkspaceUrl = rawPayload.compressedWorkspaceUrl as string;

        this.reader = new BrowserMessageReader(this.lsMessagePort);
        this.writer = new BrowserMessageWriter(this.lsMessagePort);

        this.endpointWorker?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'clangd_init_complete'
            })
        });
    }

    /**
     * Triggered by worker message
     */
    async clangd_launch(message: WorkerMessage) {
        // load everything needed beforehand
        const requiredResurces = await this.loadRequiredResources();

        // start the clangd language server
        const clangd = await this.runClangdLanguageServer(requiredResurces);

        // perform all file system updates
        this.emscriptenFS = clangd.FS as typeof FS;
        await this.updateWorkerFilesystem(requiredResurces);
        await this.updateRemoteFilesystem();

        // run main clangd
        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        (clangd as any).callMain([]);

        // send the launch complete message to the client
        this.endpointWorker?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'clangd_launch_complete'
            })
        });
    }

    private async loadRequiredResources(): Promise<RequiredResources> {
        const clangdWasmUrl = new URL('../../../resources/clangd/wasm/clangd.wasm', import.meta.url);
        const clangdJsUrl = new URL('../../../resources/clangd/wasm/clangd.js', import.meta.url);

        // Pre-fetch wasm file
        const wasmReader = (await fetch(clangdWasmUrl)).body!.getReader();

        const chunks: BlobPart[] = [];
        let loadingComplete = false;
        while (!loadingComplete) {
            const { done, value } = await wasmReader.read();
            loadingComplete = done;
            if (value) {
                chunks.push(value);
            }
        }
        const wasmBlob = new Blob(chunks, { type: 'application/wasm' });
        const wasmDataUrl = URL.createObjectURL(wasmBlob);

        const jsModule = import(`${clangdJsUrl}`);
        const { default: ClangdJsModule } = await jsModule;

        return { ClangdJsModule, wasmDataUrl };
    }

    private markStarting() {
        this.startingAwait = new Promise<void>((resolve) => {
            this.startingResolve = resolve;
        });
    }

    private markStarted() {
        this.startingResolve();
        this.startingAwait = undefined;
    }

    /**
     * Prepares & starts up a clangd language server instance
     * @returns
     */
    private async runClangdLanguageServer(requiredResurces: RequiredResources) {
        this.markStarting();

        const textEncoder = new TextEncoder();
        let resolveStdinReady = () => {};
        const stdinChunks: string[] = [];
        const currentStdinChunk: Array<number | null> = [];

        const stdin = (): number | null => {
            if (currentStdinChunk.length === 0) {
                if (stdinChunks.length === 0) {
                    // Should not reach here
                    // stdinChunks.push("Content-Length: 0\r\n", "\r\n");
                    console.error('Try to fetch exhausted stdin');
                    return null;
                }
                const nextChunk = stdinChunks.shift()!;
                currentStdinChunk.push(...textEncoder.encode(nextChunk), null);
            }
            return currentStdinChunk.shift()!;
        };

        const jsonStream = new JsonStream();

        const stdout = (charCode: number) => {
            const jsonOrNull = jsonStream.insert(charCode);
            if (jsonOrNull !== null) {
                console.log('%c%s', 'color: green', jsonOrNull);
                this.writer?.write(JSON.parse(jsonOrNull));
            }
        };

        const LF = 10;
        let stderrLine = '';
        const stderr = (charCode: number) => {
            if (charCode === LF) {
                console.log('%c%s', 'color: darkorange', stderrLine);
                stderrLine = '';
            } else {
                stderrLine += String.fromCharCode(charCode);
            }
        };

        const stdinReady = async () => {
            if (stdinChunks.length === 0) {
                return new Promise<void>((r) => (resolveStdinReady = r));
            }
        };

        const onAbort = () => {
            this.writer?.end();

            this.endpointWorker?.sentMessage({
                message: WorkerMessage.fromPayload(
                    new RawPayload({
                        type: 'error',
                        value: 'clangd aborted'
                    }),
                    'clangd_error'
                )
            });
        };

        const onRuntimeInitialized = async () => {
            console.log('%c%s', 'color: green', 'Clangd runtime initialized');
            this.markStarted();
            return Promise.resolve();
        };

        const clangd = await requiredResurces.ClangdJsModule({
            thisProgram: '/usr/bin/clangd',
            locateFile: (path: string, prefix: string) => {
                return path.endsWith('.wasm') ? requiredResurces.wasmDataUrl : `${prefix}${path}`;
            },
            stdinReady,
            stdin,
            stdout,
            stderr,
            onExit: onAbort,
            onAbort,
            onRuntimeInitialized
        });

        // listen for messages from the language server
        this.reader?.listen((data) => {
            // non-ASCII characters cause bad Content-Length. Just escape them.
            const body = JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, (ch) => {
                return '\\u' + ch.codePointAt(0)!.toString(16).padStart(4, '0');
            });
            const header = `Content-Length: ${body.length}\r\n`;
            const delimiter = '\r\n';
            stdinChunks.push(header, delimiter, body);
            resolveStdinReady();
            // console.log("%c%s", "color: red", `${header}${delimiter}${body}`);
        });

        await this.startingAwait;

        return clangd;
    }

    private markSynchingFS() {
        this.synchingFSAwait = new Promise<void>((resolve) => {
            this.synchingFSResolve = resolve;
        });
    }

    private markSynchingFSDone() {
        this.synchingFSResolve();
        this.synchingFSAwait = undefined;
    }

    /**
     * Initialize the filesystem using the fs's persistent source. Invoked on start-up
     */
    private async populateFS() {
        console.log('Populating filesystem: Start');
        this.markSynchingFS();
        this.syncFS(true);
        await this.synchingFSAwait;
        console.log('Populating filesystem: End');
    }

    /**
     * Persist the filesystem to IndexedDB. Can be invoked on shutdown or periodically
     */
    private async persistFS() {
        console.log('Persisting filesystem: Start');
        this.markSynchingFS();
        this.syncFS(false);
        await this.synchingFSAwait;
        console.log('Persisting filesystem: End');
    }

    /**
     * Used to sync the filesystem from memory to IndexedDB or vice versa:
     * populate fs = true; persist fs = false
     * @param readOrWrite Whether to read or write the filesystem
     */
    private async syncFS(readOrWrite: boolean) {
        if (!this.emscriptenFS) throw new Error('Emscripten FS is not available! Aborting ...');

        this.emscriptenFS.syncfs(readOrWrite, (err) => {
            if (err !== null) {
                console.error(`Error syncing filesystem: ${err}`);
            }
            this.markSynchingFSDone();
        });
    }

    private async updateWorkerFilesystem(requiredResurces: RequiredResources) {
        if (!this.emscriptenFS) throw new Error('Emscripten FS is not available! Aborting ...');

        const t0 = performance.now();
        console.log('Updating Worker FS');

        // Clear the IndexedDB filesystem if requested
        if (this.clearIndexedDb) {
            indexedDB.deleteDatabase(WORKSPACE_PATH);
        }

        this.emscriptenFS.createPreloadedFile('/', 'clangd.wasm', requiredResurces.wasmDataUrl, true, true);

        await this.loadWorkspaceFiles();

        const t1 = performance.now();
        const msg = `Worker FS: File loading completed in ${t1 - t0}ms.`;
        console.log(msg);
    }

    /**
     * Loads workspace files separately or the compressed workspace from a zip archive
     */
    private async loadWorkspaceFiles() {
        if (!this.emscriptenFS) throw new Error('Emscripten FS is not available! Aborting ...');

        // setup & prepare the filesystem
        this.emscriptenFS.mkdir(WORKSPACE_PATH);

        // Mounting IndexedDB filesystem
        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        this.emscriptenFS.mount((this.emscriptenFS as any).filesystems.IDBFS, {}, WORKSPACE_PATH);

        // Synchronize the filesystem from IndexedDB to memory
        await this.populateFS();

        // Determines whether the workspace is already loaded from IndexedDB
        let isWorkspaceLoaded = true;
        try {
            this.emscriptenFS.lookupPath(`${WORKSPACE_PATH}/.clangd`, { parent: false });
            console.log('Workspace FOUND');
        } catch (e) {
            console.warn('Workspace NOT found: ' + e);
            isWorkspaceLoaded = false;
        }

        if (!isWorkspaceLoaded) {
            let mainFiles: Record<string, () => Promise<string | unknown>> = {};
            if (this.useCompressedWorkspace && this.compressedWorkspaceUrl !== undefined) {
                // Fetches a compressed workspace from a given URL (zip file)
                // The additional conversion to array buffer is necessary for JSZip to work correctly
                // It is expected that there is a workspace directory at top level in the zip file
                const compressedWorkspace = await (await fetch(this.compressedWorkspaceUrl)).arrayBuffer();
                const zip = await JSZip.loadAsync(compressedWorkspace);

                for (const [relativePath, file] of Object.entries(zip.files)) {
                    if (/\.(cpp|c|h|hpp|)|.clangd$/.test(relativePath)) {
                        // trim off the leading 'workspace' directory part of the path, the rest is okay to have
                        const rpath = relativePath.replace(/^workspace/, '');
                        mainFiles[rpath] = () => file.async('string');
                    }
                }

                await this.processInputFiles(mainFiles, '../../../resources/clangd/workspace');
            } else {
                // write clang config
                this.emscriptenFS.writeFile(`${WORKSPACE_PATH}/.clangd`, clangdConfig);

                mainFiles = import.meta.glob('../../../resources/clangd/workspace/*.{cpp,c,h,hpp}', { query: '?raw' });
                await this.processInputFiles(mainFiles, '../../../resources/clangd/workspace');
            }
        }

        // save the workspace to IndexedDB
        await this.persistFS();
    }

    private async processInputFiles(files: Record<string, () => Promise<string | unknown>>, dirReplacer: string) {
        if (!this.emscriptenFS) throw new Error('Emscripten FS is not available! Aborting ...');

        const dirsToCreate = new Set<string>();
        const filesToUse: Record<string, () => Promise<string | unknown>> = {};
        for (const [sourceFile, content] of Object.entries(files)) {
            let shortSourceFile = sourceFile.replace(dirReplacer, '');
            if (!shortSourceFile.startsWith('//')) {
                shortSourceFile = shortSourceFile.substring(1);
            }
            const targetFile = `${WORKSPACE_PATH}/${shortSourceFile}`;
            const targetDir = targetFile.substring(0, targetFile.lastIndexOf('/'));

            // store only un-ignore target files
            filesToUse[targetFile] = content;

            // List all parent directories
            let dirToCreate = '';
            const targetDirParts = targetDir.split('/');
            for (const part of targetDirParts) {
                if (part.length > 0) {
                    dirToCreate = `${dirToCreate}/${part}`;
                    // set reduces to unique directories
                    dirsToCreate.add(dirToCreate);
                }
            }
        }

        // create unique directories
        for (const dirToCreate of dirsToCreate) {
            try {
                this.emscriptenFS.mkdir(dirToCreate);
                const { mode } = this.emscriptenFS.lookupPath(dirToCreate, { parent: false }).node;
                if (this.emscriptenFS.isDir(mode)) {
                    console.log(`Create dir: ${dirToCreate} mode: ${mode}`);
                }
            } catch (e) {
                if (e instanceof Object && (e as { code: string }).code === 'EEXIST') {
                    console.log(`Directory already exists: ${dirToCreate}`);
                }
            }
        }

        // write out files
        type RawContent = { default: string };
        for (const [targetFile, content] of Object.entries(filesToUse)) {
            try {
                let contentAsString: string;
                if (this.useCompressedWorkspace) {
                    contentAsString = (await content()) as string;
                } else {
                    contentAsString = ((await content()) as RawContent).default;
                }
                this.emscriptenFS.writeFile(targetFile, contentAsString);
                console.log(`Wrote file: ${targetFile}`);
            } catch (e) {
                console.error(`Error writing ${targetFile}: ${e}`);
            }
        }
    }

    private async updateRemoteFilesystem() {
        if (!this.emscriptenFS) throw new Error('Emscripten FS is not available! Aborting ...');
        if (!this.fsMessagePort) throw new Error('MessagePort is not available! Aborting ...');

        const t0 = performance.now();

        console.log('Updating Remote FS');
        const allFilesAndDirectories = fsReadAllFiles(this.emscriptenFS, '/');

        this.remoteFs = new WorkerRemoteMessageChannelFs(this.fsMessagePort, this.emscriptenFS);
        this.remoteFs.init();

        const allPromises = [];
        for (const filename of allFilesAndDirectories.files) {
            try {
                // just push the binary content to the client
                const content = this.emscriptenFS.readFile(filename, { encoding: 'binary' });
                allPromises.push(
                    this.remoteFs.syncFile({
                        resourceUri: filename,
                        content: content as unknown as ArrayBufferLike
                    })
                );
            } catch (e) {
                console.error(`Unexpected error when reading file ${filename}: ${e}`);
            }
        }

        await Promise.all(allPromises);

        // signal the client everything is ready
        this.remoteFs.ready();

        const t1 = performance.now();
        const msg = `Remote FS: File loading completed in ${t1 - t0}ms.`;
        console.log(msg);
    }
}

new ComChannelEndpoint({
    endpointId: 2000,
    endpointConfig: {
        $type: 'DirectImplConfig',
        impl: self
    },
    verbose: true,
    endpointName: 'clangd_main'
}).connect(new ClangdInteractionWorker());
