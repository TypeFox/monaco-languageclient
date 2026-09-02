/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { CodeResources, EditorAppConfig } from 'monaco-languageclient/editorApp';
import { LcWorker, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig, OverallConfigType, ViewsConfigTypes } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { LcWebSocket } from 'vscode-ws-jsonrpc/browser';

export const createMonacoEditorDiv = () => {
  const div = document.createElement('div');
  div.id = 'monaco-editor-root';
  document.body.insertAdjacentElement('beforeend', div);
  return div;
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
        workerName: 'Langium LS (Regular Test)',
        readerCallback: (message) => {
          console.log('Reader callback received message:', message);
        }
      }
    }
  };
};

export const createUnreachableWorkerConfig = (): LanguageClientConfig => {
  return {
    languageId: 'javascript',
    clientOptions: {
      documentSelector: ['javascript']
    },
    connection: {
      options: {
        $family: 'Worker',
        realization: () => new LcWorker(),
        workerUrl: new URL(`${import.meta.url.split('@fs')[0]}/unknown.ts`),
        type: 'module',
        workerName: 'Unreachable LS'
      }
    }
  };
};

export const createDefaultLcUnreachableUrlConfig = (port: number): LanguageClientConfig => {
  return {
    languageId: 'javascript',
    clientOptions: {
      documentSelector: ['javascript']
    },
    connection: {
      options: {
        $family: 'WebSocket',
        realization: () => new LcWebSocket(),
        webSocketUrl: `ws://localhost:${port}/rester`
      }
    }
  };
};

export const createEditorAppConfig = (codeResources: CodeResources): EditorAppConfig => {
  return {
    codeResources,
    editorOptions: {}
  };
};

export const createDefaultMonacoVscodeApiConfig = (
  overallConfigType: OverallConfigType,
  htmlContainer: HTMLElement | undefined,
  viewsConfigType: ViewsConfigTypes
): MonacoVscodeApiConfig => {
  return {
    $type: overallConfigType,
    advanced: {
      enforceSemanticHighlighting: true,
      loadThemes: false
    },
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'Default Dark Modern'
      })
    },
    viewsConfig: {
      $type: viewsConfigType,
      htmlContainer
    },
    monacoWorkerFactory: configureDefaultWorkerFactory
  };
};
