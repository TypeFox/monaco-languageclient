/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { delayExecution } from 'monaco-languageclient/common';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { LanguageClientWrapper, LcWorker } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';
import textMod from '../../../resources/langium/statemachine/example-mod.statemachine?raw';
import text from '../../../resources/langium/statemachine/example.statemachine?raw';
import { disableElement } from '../../common/client/utils.js';
import { createLangiumGlobalConfig } from './config/statemachineConfig.js';

let editorApp: EditorApp | undefined;
let editorApp2: EditorApp | undefined;
let lcWrapper: LanguageClientWrapper;

const startEditor = async () => {
  disableElement('button-start', true);
  disableElement('button-dispose', false);

  if (editorApp?.isStarted() === true || editorApp2?.isStarted() === true) {
    alert('Editor was already started!');
    return;
  }

  // init worker with port for client and worker
  // const stateMachineWorkerPort = loadStatemachinWorkerPort();
  // // use callback to receive message back from worker independent of the message channel the LSP is using
  // stateMachineWorkerPort.onmessage = (event) => {
  //   console.log('Received message from worker: ' + event.data);
  // };
  const channel = new MessageChannel();
  // stateMachineWorkerPort.postMessage(
  //   {
  //     port: channel.port2
  //   },
  //   [channel.port2]
  // );

  // const reader = new BrowserMessageReader(channel.port1);
  // const writer = new BrowserMessageWriter(channel.port1);
  // reader.listen((message) => {
  //   console.log('Received message from worker:', message);
  // });

  const htmlContainer = document.getElementById('monaco-editor-root')!;
  // the configuration does not contain any text content
  const appConfig = createLangiumGlobalConfig({
    languageServerId: 'first',
    codeContent: {
      text,
      uri: '/workspace/example.statemachine'
    },
    connection: {
      options: {
        $family: 'Worker',
        realization: () => new LcWorker(),
        workerUrl: new URL('./worker/statemachine-server-port.ts', import.meta.url),
        type: 'module',
        workerName: 'Statemachine Server Port',
        messagePort: channel.port1
      }
    },
    htmlContainer
  });
  editorApp = new EditorApp(appConfig.editorAppConfig);

  // perform global monaco-vscode-api init
  const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
  await apiWrapper.start();

  // init language client
  lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
  await lcWrapper.start();

  // run editorApp
  await editorApp.start(htmlContainer);

  await editorApp.updateCodeResources({
    modified: {
      text,
      uri: '/workspace/statemachine-mod.statemachine'
    }
  });

  // start the second editorApp without any languageclient config
  // => they share the language server and both text contents have different uris
  const appConfig2 = appConfig;
  appConfig2.editorAppConfig.codeResources!.modified = {
    text: textMod,
    uri: '/workspace/example-mod.statemachine'
  };
  editorApp2 = new EditorApp(appConfig2.editorAppConfig);

  // run a second editorApp with another dom element
  await editorApp2.start(document.getElementById('monaco-editor-root2')!);

  vscode.commands.getCommands().then((x) => {
    console.log('Currently registered # of vscode commands: ' + x.length);
  });

  await delayExecution(1000);

  await editorApp.updateCodeResources({
    modified: {
      text: `// modified file\n\n${text}`,
      uri: '/workspace/statemachine-mod2.statemachine'
    }
  });
};

const disposeEditor = async () => {
  disableElement('button-start', false);
  disableElement('button-dispose', true);

  await lcWrapper.dispose();

  editorApp?.reportStatus();
  await editorApp?.dispose();
  console.log(editorApp?.reportStatus().join('\n'));

  editorApp2?.reportStatus();
  await editorApp2?.dispose();
  console.log(editorApp2?.reportStatus().join('\n'));
};

export const runStatemachine = async () => {
  try {
    document.querySelector('#button-start')?.addEventListener('click', startEditor);
    document.querySelector('#button-dispose')?.addEventListener('click', disposeEditor);
  } catch (e) {
    console.error(e);
  }
};
