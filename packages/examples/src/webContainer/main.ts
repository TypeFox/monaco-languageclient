/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { WebContainer, type FileSystemTree } from '@webcontainer/api';

import packageJson from '../../resources/webContainer/package.json?raw';
import indexJs from '../../resources/webContainer/index.js?raw';

const createWritableStream = () => {
    return new WritableStream({
        write(data: string) {
            const output = data.trim();
            if (output.length === 0 || output.includes('')) {
                return;
            }
            if (output.length === 1 && (output === '\\' || output === '|' || output === '/' || output === '-')) {
                return;
            }
            console.log(`Output: ${output}`);
        }
    });
};

export const bootWebContainer = async () => {
    const files: FileSystemTree = {
        'package.json': {
            file: {
                contents: packageJson
            }
        },
        'index.js': {
            file: {
                contents: indexJs
            }
        },
        'hello-world': {
            directory: {
            }
        }
    };

    console.log('Booting WebContainer...');
    const webcontainerInstance = await WebContainer.boot({
        workdirName: 'langium'
    });
    console.log('WebContainer booted successfully.');

    await webcontainerInstance.mount(files);
    console.log('Files mounted to the virtual file system.');

    console.log('Installing dependencies...');
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    installProcess.output.pipeTo(createWritableStream());
    const installExitCode = await installProcess.exit;

    if (installExitCode !== 0) {
        throw new Error('npm install failed');
    }
    console.log('Dependencies installed successfully.');

    console.log('Running start script...');
    const startProcess = await webcontainerInstance.spawn('npm', ['run', 'start']);
    startProcess.output.pipeTo(createWritableStream());
    await startProcess.exit;

    console.log(await webcontainerInstance.fs.readdir('./hello-world'));
    console.log(await webcontainerInstance.fs.readdir('.'));

    console.log('Execution finished.');
};
