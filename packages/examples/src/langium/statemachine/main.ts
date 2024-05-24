/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { createModelReference } from 'vscode/monaco';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import workerUrl from './worker/statemachine-server?worker&url';
import workerPortUrl from './worker/statemachine-server-port?worker&url';
import text from './content/example.statemachine?raw';
import textMod from './content/example-mod.statemachine?raw';

const wrapper = new MonacoEditorLanguageClientWrapper();
const wrapper2 = new MonacoEditorLanguageClientWrapper();

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
        }
    });
};

const startEditor = async () => {
    if (wrapper.isStarted() && wrapper2.isStarted()) {
        alert('Editor was already started!');
        return;
    }

    // init worker with port for client and worker
    const stateMachineWorkerPort = loadStatemachinWorkerPort();
    // use callback to receive message back from worker independent of the message channel the LSP is using
    stateMachineWorkerPort.onmessage = (event) => {
        console.log('Received message from worker: ' + event.data);
    };
    const channel = new MessageChannel();
    stateMachineWorkerPort.postMessage({
        port: channel.port2
    }, [channel.port2]);

    const reader = new BrowserMessageReader(channel.port1);
    const writer = new BrowserMessageWriter(channel.port1);
    reader.listen((message) => {
        console.log('Received message from worker:', message);
    });

    // the configuration does not contain any text content
    const langiumGlobalConfig = await createLangiumGlobalConfig({
        languageServerId: 'first',
        useLanguageClient: true,
        worker: stateMachineWorkerPort,
        messagePort: channel.port1,
        connectionProvider: {
            get: async () => ({ reader, writer })
        }
    });
    await wrapper.initAndStart(langiumGlobalConfig, document.getElementById('monaco-editor-root'));

    // here the modelReference is created manually and given to the updateEditorModels of the wrapper
    const uri = vscode.Uri.parse('/workspace/statemachine-mod.statemachine');
    const modelRef = await createModelReference(uri, text);
    wrapper.updateEditorModels({
        modelRef
    });

    // start the second wrapper without any languageclient config
    // => they share the language server and both text contents have different uris
    const langiumGlobalConfig2 = await createLangiumGlobalConfig({
        languageServerId: 'second',
        useLanguageClient: false,
        text: textMod
    });
    await wrapper2.initAndStart(langiumGlobalConfig2, document.getElementById('monaco-editor-root2'));

    vscode.commands.getCommands().then((x) => {
        console.log('Currently registered # of vscode commands: ' + x.length);
    });
};

const disposeEditor = async () => {
    wrapper.reportStatus();
    await wrapper.dispose();
    console.log(wrapper.reportStatus().join('\n'));

    wrapper2.reportStatus();
    await wrapper2.dispose();
    console.log(wrapper2.reportStatus().join('\n'));
};

export const runStatemachineWrapper = async () => {
    try {
        document.querySelector('#button-start')?.addEventListener('click', startEditor);
        document.querySelector('#button-dispose')?.addEventListener('click', disposeEditor);
    } catch (e) {
        console.error(e);
    }
};

export const loadStatemachineWorkerRegular = () => {
    // Language Server preparation
    console.log(`Langium worker URL: ${workerUrl}`);
    return new Worker(workerUrl, {
        type: 'module',
        name: 'Statemachine Server Regular',
    });
};

export const loadStatemachinWorkerPort = () => {
    // Language Server preparation
    console.log(`Langium worker URL: ${workerPortUrl}`);
    return new Worker(workerPortUrl, {
        type: 'module',
        name: 'Statemachine Server Port',
    });
};
