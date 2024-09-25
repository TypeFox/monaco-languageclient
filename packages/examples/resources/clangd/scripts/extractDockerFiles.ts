import * as fs from "node:fs";
import child_process from "node:child_process";

const outputDir = './resources/clangd/wasm';

// clean always
fs.rmSync(outputDir, {
    force: true,
    recursive: true
});
fs.mkdirSync(outputDir);

child_process.execFileSync('docker', ['create', '--name', 'extract-clangd', 'clangd-clangd-build']);
child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.js', outputDir]);
child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.wasm', outputDir]);
child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.worker.js', outputDir]);
child_process.execFileSync('docker', ['cp', 'extract-clangd:/builder/llvm-project/build/bin/clangd.worker.mjs', outputDir]);
child_process.execFileSync('docker', ['rm', 'extract-clangd']);
