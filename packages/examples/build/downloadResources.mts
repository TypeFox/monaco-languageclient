/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export const getLocalDirectory = () => {
    const __filename = fileURLToPath(import.meta.url);
    return dirname(__filename);
};

const downloadVsix = async (url: string, targetDir: string, filename: string) => {
    const target = resolve(targetDir, filename);
    if (existsSync(target)) {
        console.log(`Skipping download because ${target} already exists.`);
    } else {
        const result = mkdirSync(targetDir, { recursive: true });
        if (result) {
            console.log(`Created target directory: ${targetDir}`);
        }
        console.log(`Downloading ${url} to ${target}`);
        const resp = await fetch(url);
        const buffer = await resp.arrayBuffer();
        writeFileSync(target, Buffer.from(buffer));
    }
};

await downloadVsix('https://marketplace.visualstudio.com/_apis/public/gallery/publishers/GitHub/vsextensions/github-vscode-theme/6.3.4/vspackage',
    resolve(getLocalDirectory(), '../resources/vsix/'), 'GitHub.github-vscode-theme-6.3.4.vsix');
