/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createLangiumGlobalConfig } from './config/wrapperStatemachineConfig.js';
import workerUrl from './worker/statemachine-server?worker&url';
import workerPortUrl from './worker/statemachine-server-port?worker&url';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import textMod from '../../../resources/langium/statemachine/example-mod.statemachine?raw';
import { disableElement } from '../../common/client/utils.js';
import { delayExecution } from 'monaco-languageclient/common';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';

const wrapper = new MonacoEditorLanguageClientWrapper();
const wrapper2 = new MonacoEditorLanguageClientWrapper();
let lcWrapper: LanguageClientWrapper;

const startEditor = async () => {
    disableElement('button-start', true);
    disableElement('button-dispose', false);

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
    const appConfig = createLangiumGlobalConfig({
        languageServerId: 'first',
        codeContent: {
            text,
            uri: '/workspace/example.statemachine'
        },
        worker: stateMachineWorkerPort,
        messagePort: channel.port1,
        messageTransports: { reader, writer },
        htmlContainer: document.getElementById('monaco-editor-root')!
    });

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
    await apiWrapper.init();

    // init language client
    lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
    await lcWrapper.start();

    // run wrapper
    await wrapper.initAndStart(appConfig.wrapperConfig, appConfig.vscodeApiConfig.htmlContainer!);

    wrapper.updateCodeResources({
        modified: {
            text,
            uri: '/workspace/statemachine-mod.statemachine'
        }
    });

    // start the second wrapper without any languageclient config
    // => they share the language server and both text contents have different uris
    const appConfig2 = appConfig;
    appConfig2.wrapperConfig.editorAppConfig!.codeResources!.modified = {
        text: textMod,
        uri: '/workspace/example-mod.statemachine'
    };
    appConfig2.vscodeApiConfig.htmlContainer = document.getElementById('monaco-editor-root2')!;

    // run wrapper
    await wrapper2.initAndStart(appConfig2.wrapperConfig, appConfig2.vscodeApiConfig.htmlContainer);

    vscode.commands.getCommands().then((x) => {
        console.log('Currently registered # of vscode commands: ' + x.length);
    });

    await delayExecution(1000);

    wrapper.updateCodeResources({
        modified: {
            text: `// modified file\n\n${text}`,
            uri: '/workspace/statemachine-mod2.statemachine'
        }
    });
};

const disposeEditor = async () => {
    disableElement('button-start', false);
    disableElement('button-dispose', true);

    lcWrapper.dispose();

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
