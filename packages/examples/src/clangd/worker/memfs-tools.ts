/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export const fsReadAllFiles = (emscriptenFs: typeof FS, baseFolder: string) => {
    const files: string[] = [];
    const directories: string[] = [];

    const crawlFolder = (folder: string) => {
        const folderListing = emscriptenFs.readdir(folder);
        for (const name of folderListing) {
            // do not process the current and parent directory
            if (name === '.' || name === '..') {
                continue;
            }

            const path = `${folder}/${name}`.replaceAll('//', '/');
            try {
                const { mode } = emscriptenFs.lookupPath(path, { parent: false }).node;
                if (emscriptenFs.isFile(mode)) {
                    files.push(path);
                } else if (emscriptenFs.isDir(mode)) {
                    directories.push(path);
                    crawlFolder(path);
                } else {
                    console.log(`Ignored: ${path}`);
                }
            } catch (error) {
                console.error(`${path} provoked an error: ${error}`);
            }
        }
    };

    crawlFolder(baseFolder);

    // files.forEach((file) => { console.log(file); });
    console.log(`Found ${files.length} files.`);
    return {
        files,
        directories
    };
};
