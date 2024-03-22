/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { build, Format } from 'esbuild';

export const getLocalDirectory = () => {
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
};

export const bundleWorker = async (format: Format, entryFile: string, outfile: string, workingDir?: string) => {
    await build({
        entryPoints: [entryFile],
        bundle: true,
        treeShaking: true,
        minify: true,
        format: format,
        allowOverwrite: true,
        absWorkingDir: workingDir ?? resolve(getLocalDirectory(), '..'),
        logLevel: 'info',
        outfile: outfile
    });
};

const scriptExec = process.argv[2] as string | undefined;
if (scriptExec === '--script') {
    console.log('Running in script mode.');

    const format = process.argv[3] as Format | undefined;
    const entry = process.argv[4] as string | undefined;
    const outfile = process.argv[5] as string | undefined;
    const workingDir = process.argv[6] as string | undefined;
    console.log('Bundling worker...');
    console.log(`Using scriptExec: ${scriptExec}`);
    console.log(`Using format: ${format}`);
    console.log(`Using entry: ${entry}`);
    console.log(`Using outFile: ${outfile}`);

    if (workingDir) {
        console.log(`Using working dir: ${workingDir}`);
    }

    if (format && entry && outfile) {
        bundleWorker(format, entry, outfile, workingDir);
    } else {
        console.error('Please provide format, entry and outfile.');
    }
} else {
    console.log('Running in non-script mode.');
}
