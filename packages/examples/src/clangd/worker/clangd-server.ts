/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/// <reference lib="WebWorker" />

import { COMPILE_ARGS, FILE_PATH, WORKSPACE_PATH } from '../definitions.js';
import { JsonStream } from './json_stream.js';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver/browser.js';

declare const self: DedicatedWorkerGlobalScope;

// const wasmBase = `${import.meta.env.BASE_URL}packages/examples/resources/clangd/wasm/`;
// const wasmUrl = `${wasmBase}clangd.wasm`;
const clangdWasmUrl = new URL('../../../resources/clangd/wasm/clangd.wasm', import.meta.url);
const clangdJsUrl = new URL('../../../resources/clangd/wasm/clangd.js', import.meta.url);
const jsModule = import(  /* @vite-ignore */ `${clangdJsUrl}`);

// Pre-fetch wasm, and report progress to main
const wasmResponse = await fetch(clangdWasmUrl);
const wasmSize = __WASM_SIZE__;
const wasmReader = wasmResponse.body!.getReader();
let receivedLength = 0;
const chunks: Uint8Array[] = [];
let loadingComplete = false;
while (!loadingComplete) {
    const { done, value } = await wasmReader.read();
    loadingComplete = done;
    if (value) {
        chunks.push(value);
        receivedLength += value.length;
        self.postMessage({
            type: 'progress',
            value: receivedLength,
            max: Number(wasmSize),
        });
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
        writer.write(JSON.parse(jsonOrNull));
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
    writer.end();
    self.reportError('clangd aborted');
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
console.log(clangd);

const flags = [
    ...COMPILE_ARGS,
    '--target=wasm32-wasi',
    '-isystem/usr/include/c++/v1',
    '-isystem/usr/include/wasm32-wasi/c++/v1',
    '-isystem/usr/include',
    '-isystem/usr/include/wasm32-wasi',
];

clangd.FS.writeFile(FILE_PATH, '');
clangd.FS.writeFile(
    `${WORKSPACE_PATH}/.clangd`,
    JSON.stringify({ CompileFlags: { Add: flags } })
);

clangd.FS.writeFile(
    `${WORKSPACE_PATH}/tester.h`,
    'struct Tester {}'
);
// const test2 = clangd.FS.readFile('/usr/include/wasm32-wasi/stdio.h');
// console.log(String.fromCharCode.apply(null, test2));

function startServer() {
    console.log('%c%s', 'font-size: 2em; color: green', 'clangd started');
    clangd.callMain([]);
}
startServer();

self.postMessage({ type: 'ready' });

const reader = new BrowserMessageReader(self);
const writer = new BrowserMessageWriter(self);

reader.listen((data) => {
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

// setTimeout(() => {
//   // test read back
//   const test1 = clangd.FS.readFile(`${WORKSPACE_PATH}/tester.h`) as number[];
//   console.log(String.fromCharCode.apply(null, test1));
// }, 5000);
