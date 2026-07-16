/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

// oxlint-disable typescript/no-redundant-type-constituents

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { getEnhancedMonacoEnvironment } from 'monaco-languageclient/vscodeApiWrapper';

export class Worker {
  url: string | URL;
  options?: WorkerOptions;

  constructor(url: string | URL, options?: WorkerOptions) {
    this.url = url;
    this.options = options;
  }
}

export type WorkerLoader = (() => Worker) | undefined;

export type PossibleWorkerLabelsExtended =
  | 'editorWorkerService'
  | 'extensionHostWorkerMain'
  | 'TextMateWorker'
  | 'OutputLinkDetectionWorker'
  | 'LanguageDetectionWorker'
  | 'NotebookEditorWorker'
  | 'LocalFileSearchWorker';

export type PossibleWorkerLabelsClassic = 'editorWorkerService' | 'css' | 'html' | 'json' | 'javascript' | 'typescript';

export interface WorkerFactoryConfig {
  workerLoaders?: Partial<Record<PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic | string, WorkerLoader>>;
  logger?: ILogger;
}

export const useWorkerFactory = (config: WorkerFactoryConfig) => {
  const envEnhanced = getEnhancedMonacoEnvironment();

  envEnhanced.getWorkerUrl = (workerId: string, label: PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic | string) => {
    config.logger?.info(`getWorkerUrl: workerId: ${workerId} label: ${label}`);
    return config.workerLoaders?.[label]?.().url.toString();
  };

  envEnhanced.getWorkerOptions = (moduleId: string, label: PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic | string) => {
    config.logger?.info(`getWorkerOptions: moduleId: ${moduleId} label: ${label}`);
    return config.workerLoaders?.[label]?.().options;
  };
};

export const defineDefaultWorkerLoaders: () => Record<PossibleWorkerLabelsExtended, WorkerLoader> = () => {
  const defaultEditorWorkerService = () =>
    new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' });
  const defaultExtensionHostWorkerMain = () =>
    new Worker(new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url), { type: 'module' });
  const defaultTextMateWorker = () =>
    new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' });

  return {
    // if you import monaco api as 'monaco-editor': monaco-editor/esm/vs/editor/editor.worker.js
    editorWorkerService: defaultEditorWorkerService,
    extensionHostWorkerMain: defaultExtensionHostWorkerMain,
    TextMateWorker: defaultTextMateWorker,
    // these are other possible workers not configured by default
    OutputLinkDetectionWorker: undefined,
    LanguageDetectionWorker: undefined,
    NotebookEditorWorker: undefined,
    LocalFileSearchWorker: undefined
  };
};

export const configureDefaultWorkerFactory = (logger?: ILogger) => {
  useWorkerFactory({
    workerLoaders: defineDefaultWorkerLoaders(),
    logger
  });
};
