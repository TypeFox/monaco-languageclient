import * as fs from 'node:fs';
import child_process from 'node:child_process';

const outputDir = './resources/clangd/wasm';

try {
    child_process.execFileSync('docker', ['create', '--name', 'extract-clangd', 'ghcr.io/typefox/monaco-languageclient/clangd-wasm-build:latest']);

    // clean but only if container start was successful
    fs.rmSync(outputDir, {
        force: true,
        recursive: true
    });
    fs.mkdirSync(outputDir);

    child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.js', outputDir]);
    child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.wasm', outputDir]);
    child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.worker.js', outputDir]);
    child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.worker.mjs', outputDir]);
    child_process.execFileSync('docker', ['rm', 'extract-clangd']);
} catch (e) {
    console.warn('Clangd wasm data was not extracted from container image!');
}
