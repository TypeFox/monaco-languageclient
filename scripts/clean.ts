/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from 'node:fs';
import { minimatch } from 'minimatch';
import { getPathRelativeToRootDirectory } from './helper';

const printHelp = () => {
    console.log('\nUse:');
    console.log('--relativePath <path> [--recursive] --paths [paths]\n');
};

const relativePathArg = process.argv[2] as string | undefined;
if (relativePathArg !== '--relativePath') {
    printHelp();
    process.exit(0);
}
const relativePath = process.argv[3] as string | undefined;
if (!relativePath) {
    printHelp();
    process.exit(0);
}
const workingDir = getPathRelativeToRootDirectory(relativePath);
const statsWorkingDir = fs.lstatSync(workingDir);
if (!statsWorkingDir.isDirectory()) {
    console.error(`Provided working directory is not a directory: ${workingDir}`);
    process.exit(0);
}

const recursiveArg = process.argv[4] as string | undefined;
const recursive = (recursiveArg === '--recursive');
const pathsArg = recursive ? process.argv[5] : process.argv[4];

if (pathsArg === '--paths') {
    const start = recursive ? 6 : 5;
    const end = process.argv.length;
    if (start >= end) {
        console.log('No paths provided after --paths.');
        printHelp();
    }

    for (let i = start; i < end; i++) {
        const input = process.argv[i];

        const pathToDelete = getPathRelativeToRootDirectory(relativePath, input);
        if (fs.existsSync(pathToDelete)) {
            const stats = fs.lstatSync(pathToDelete);
            if (stats.isDirectory()) {
                if (recursive) {
                    console.log(`Deleting directory: ${pathToDelete}`);
                } else {
                    console.log(`Deleting directory recursively: ${pathToDelete}`);
                }
                fs.rmSync(pathToDelete, { recursive: recursive });
                // console.log(`Would execute: fs.rmSync(${pathToDelete}, { recursive: ${recursive} })`);
            } else if (stats.isFile()) {
                console.log(`Deleting file: ${pathToDelete}`);
                fs.rmSync(pathToDelete);
                // console.log(`Would execute: fs.rmSync(${pathToDelete})`);
            } else {
                console.log(`Path is not a file or directory: ${pathToDelete}`);
            }
        } else if (input.includes('*')) {
            const list = fs.readdirSync(workingDir).filter(minimatch.filter(input, { matchBase: true }));
            for (const file of list) {
                console.log(`Deleting file: ${file}`);
                fs.rmSync(file);
                // console.log(`Would execute: fs.rmSync(${file})`);
            }
        } else {
            console.error(`Provided path does not exist: ${pathToDelete}`);
        }
    }
} else {
    if (recursive) {
        console.log('No --paths argument provided after --recursive.');
    }
    printHelp();
}
