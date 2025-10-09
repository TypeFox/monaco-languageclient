/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { WebContainer, type FileSystemTree } from '@webcontainer/api';

import packageJson from '../../resources/webContainer/package.json?raw';
import generatorTs from './generator.ts?raw';

const createWritableStream = (name: string) => {
    return new WritableStream({
        write(data: string) {
            const output = data.trim();
            if (output.length === 0 || output.includes('')) {
                return;
            }
            if (output.length === 1 && (output === '\\' || output === '|' || output === '/' || output === '-')) {
                return;
            }
            updateTextArea(name, output, 'orange');
        }
    });
};

const updateTextArea = (prefix: string, text: string | string[], color?: string) => {
    const output = `${prefix}: ${text}`;
    const styleColor = color ?? 'green';
    console.log(output);
    const textArea = document.getElementById('textarea');
    if (textArea) {
        textArea.innerHTML = `${textArea.innerHTML}<br><span style="color: ${styleColor}">${output}</span>`;
    }
};

export const bootWebContainer = async () => {
    const files: FileSystemTree = {
        'package.json': {
            file: {
                contents: packageJson
            }
        },
        'generator.ts': {
            file: {
                contents: generatorTs
            }
        },
        // 'generator': {
        //     directory: {
        //         'hello-world': {
        //             directory: {
        //                 'packages': {
        //                     directory: {
        //                         'language': {
        //                             directory: {
        //                                 'src': {
        //                                     directory: {

        //                                     }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 },
        //             }
        //         }
        //     }
        // }
    };

    updateTextArea('main', 'Booting WebContainer...');
    const webcontainerInstance = await WebContainer.boot({
        workdirName: 'langium'
    });
    updateTextArea('main', 'WebContainer booted successfully.');

    await webcontainerInstance.mount(files);
    updateTextArea('main', 'Files mounted to the virtual file system.');

    updateTextArea('main', 'Installing dependencies...');
    const installProcess = await webcontainerInstance.spawn('npm', ['install']);
    installProcess.output.pipeTo(createWritableStream('npm install'));
    const installExitCode = await installProcess.exit;

    if (installExitCode !== 0) {
        throw new Error('npm install failed');
    }
    updateTextArea('main', 'Dependencies installed successfully.');

    updateTextArea('main', 'Running langium generator...');
    const startProcess = await webcontainerInstance.spawn('npx', ['tsx', 'generator.ts']);
    startProcess.output.pipeTo(createWritableStream('npx tsx generator'));
    const startExitCode = await startProcess.exit;

    updateTextArea('main', await webcontainerInstance.fs.readdir(''));
    updateTextArea('main', await webcontainerInstance.fs.readdir('generator'));
    updateTextArea('main', await webcontainerInstance.fs.readdir('generator/hello-world'));
    updateTextArea('main', await webcontainerInstance.fs.readdir('generator/hello-world/packages'));
    updateTextArea('main', await webcontainerInstance.fs.readdir('generator/hello-world/packages/language'));
    updateTextArea('main', await webcontainerInstance.fs.readdir('generator/hello-world/packages/language/src'));

    if (startExitCode !== 0) {
        updateTextArea('main', `npm execution failed: ${startExitCode}`, 'red');
    } else {
        updateTextArea('main', 'Execution finished.');
    }
};
