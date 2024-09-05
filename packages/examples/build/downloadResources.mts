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

// Source: https://gist.github.com/wanglf/7acc591890dc0d8ceff1e7ec9af32a55?permalink_comment_id=4151555#gistcomment-4151555
// https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${extension}/${version}/vspackage

await downloadVsix('https://marketplace.visualstudio.com/_apis/public/gallery/publishers/GitHub/vsextensions/github-vscode-theme/6.3.4/vspackage',
    resolve(getLocalDirectory(), '../resources/vsix/'), 'github-vscode-theme.vsix');

// not yet used
await downloadVsix('https://marketplace.visualstudio.com/_apis/public/gallery/publishers/TypeFox/vsextensions/open-collaboration-tools/0.2.3/vspackage',
    resolve(getLocalDirectory(), '../resources/vsix/'), 'open-collaboration-tools.vsix');
