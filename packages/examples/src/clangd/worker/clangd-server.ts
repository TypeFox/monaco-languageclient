/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver/browser.js';
import { ComChannelEndpoint, ComRouter, RawPayload, WorkerMessage } from 'wtd-core';
import { WORKSPACE_PATH } from '../definitions.js';
import { JsonStream } from './json_stream.js';
import { WorkerRemoteMessageChannelFs } from './workerRemoteMessageChannelFs.js';
import { fsReadAllFiles } from './memfs-tools.js';
import helloCppCode from '../../../resources/clangd/workspace/hello.cpp?raw';
import testerHCode from '../../../resources/clangd/workspace/tester.h?raw';
import clangdConfig from '../../../resources/clangd/workspace/.clangd?raw';

declare const self: DedicatedWorkerGlobalScope;

export class ClangdInteractionWorker implements ComRouter {

    private endpointWorker?: ComChannelEndpoint;
    // private fileHub: FileHub = new FileHub();
    private reader?: BrowserMessageReader;
    private writer?: BrowserMessageWriter;

    private lsMessagePort?: MessagePort;
    private fsMessagePort?: MessagePort;

    private emscriptenFS?: typeof FS;
    private remoteFs?: WorkerRemoteMessageChannelFs;

    setComChannelEndpoint(comChannelEndpoint: ComChannelEndpoint): void {
        this.endpointWorker = comChannelEndpoint;
    }

    async clangd_init(message: WorkerMessage) {
        const rawPayload = (message.payloads![0] as RawPayload).message.raw;
        this.lsMessagePort = rawPayload.lsMessagePort as MessagePort;
        this.fsMessagePort = rawPayload.fsMessagePort as MessagePort;

        this.reader = new BrowserMessageReader(this.lsMessagePort);
        this.writer = new BrowserMessageWriter(this.lsMessagePort);

        // await this.fileHub.init(this.fsMessagePort);

        this.endpointWorker?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'clangd_init_complete'
            })
        });
    }

    async clangd_launch(message: WorkerMessage) {
        await this.runClangdLanguageServer();

        this.endpointWorker?.sentAnswer({
            message: WorkerMessage.createFromExisting(message, {
                overrideCmd: 'clangd_launch_complete'
            })
        });

        await this.updateFilesystem();
    }

    private async runClangdLanguageServer() {
        const clangdWasmUrl = new URL('../../../resources/clangd/wasm/clangd.wasm', import.meta.url);
        const clangdJsUrl = new URL('../../../resources/clangd/wasm/clangd.js', import.meta.url);
        const jsModule = import(  /* @vite-ignore */ `${clangdJsUrl}`);

        // Pre-fetch wasm, and report progress to main
        const wasmResponse = await fetch(clangdWasmUrl);
        const wasmReader = wasmResponse.body!.getReader();
        const chunks: Uint8Array[] = [];
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

        const { default: Clangd } = await jsModule;

        const textEncoder = new TextEncoder();
        let resolveStdinReady = () => { };
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
                        value: 'clangd aborted',
                    }),
                    'clangd_error')
            });
        };

        const clangd = await Clangd({
            thisProgram: '/usr/bin/clangd',
            locateFile: (path: string, prefix: string) => {
                return path.endsWith('.wasm') ? wasmDataUrl : `${prefix}${path}`;
            },
            stdinReady,
            stdin,
            stdout,
            stderr,
            onExit: onAbort,
            onAbort,
        });

        this.emscriptenFS = clangd.FS as typeof FS;

        this.emscriptenFS.writeFile(`${WORKSPACE_PATH}/.clangd`, clangdConfig);
        this.emscriptenFS.writeFile(`${WORKSPACE_PATH}/hello.cpp`, helloCppCode);
        this.emscriptenFS.writeFile(`${WORKSPACE_PATH}/tester.h`, testerHCode);

        function startServer() {
            console.log('%c%s', 'font-size: 2em; color: green', 'clangd started');
            clangd.callMain([]);
        }
        startServer();

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
    }

    private async updateFilesystem() {
        if (this.fsMessagePort !== undefined && this.emscriptenFS !== undefined) {
            const t0 = performance.now();
            const allFilesAndDirectories = fsReadAllFiles(this.emscriptenFS, '/');

            this.remoteFs = new WorkerRemoteMessageChannelFs(this.fsMessagePort, this.emscriptenFS);
            this.remoteFs.init();
            // console.log(String.fromCharCode.apply(null, test2));

            const allPromises = [];
            for (const filename of allFilesAndDirectories.files) {
                try {
                    const content = this.emscriptenFS.readFile(filename, { encoding: 'binary' });
                    allPromises.push(this.remoteFs.syncFile({
                        resourceUri: filename,
                        content: content
                    }));

                } catch (_error) {
                    // don't care currently
                }
            }

            await Promise.all(allPromises);

            // allFilesAndDirectories.files.forEach(file => {
            //     console.log(file);
            // });
            // allFilesAndDirectories.directories.forEach(directory => {
            //     console.log(directory);
            // });
            this.remoteFs.ready();

            const t1 = performance.now();
            const msg = `File loading completed in ${t1 - t0}ms.`;
            console.log(msg);
        } else {
            return Promise.reject(new Error('No filesystem is available. Aborting...'));
        }

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

