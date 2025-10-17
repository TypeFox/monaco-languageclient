/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { CodeResources, EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LcWorker, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';

export const createDefaultEditorAppConfig = (codeResources: CodeResources, logLevel?: LogLevel): EditorAppConfig => {
  return {
    logLevel,
    codeResources
  };
};

export const createDefaultLanguageClientConfig = (): LanguageClientConfig => {
  return {
    languageId: 'langium',
    clientOptions: {
      documentSelector: ['langium']
    },
    connection: {
      options: {
        $family: 'Worker',
        realization: () => new LcWorker(),
        workerUrl: new URL('monaco-languageclient-examples/worker/langium', import.meta.url),
        type: 'module',
        workerName: 'Langium LS (React Test)',
        readerCallback: (message) => {
          console.log('Reader callback received message:', message);
        }
      }
    }
  };
};

export const hundredMs = 100;

export const cleanHtmlBody = () => {
  // manual clean document body
  document.body.innerHTML = '';
};
