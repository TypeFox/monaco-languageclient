/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* oxlint-disable dot-notation */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { LanguageClientWrapper, LcWorker } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { beforeAll, describe, expect, test } from 'vitest';
import {
  createDefaultLanguageClientConfig,
  createDefaultLcUnreachableUrlConfig,
  createMonacoEditorDiv,
  createUnreachableWorkerConfig
} from '../support/helper.js';

describe.concurrent('Test LanguageClientWrapper', { concurrent: false, tags: ['main'] }, () => {
  beforeAll(async () => {
    const apiConfig: MonacoVscodeApiConfig = {
      $type: 'extended',
      viewsConfig: {
        $type: 'EditorService',
        htmlContainer: createMonacoEditorDiv()
      }
    };
    const monacoVscodeApiManager = new MonacoVscodeApiWrapper(apiConfig);
    await monacoVscodeApiManager.start();
  });

  test('Constructor: no config', () => {
    const languageClientConfig = createDefaultLanguageClientConfig();

    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    expect(languageClientWrapper.haveLanguageClient()).toBeFalsy();
  });

  test('Dispose: direct worker is cleaned up afterwards', async () => {
    const languageClientConfig = createDefaultLanguageClientConfig();
    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    const realization = languageClientWrapper.getConnectionRealization() as LcWorker;

    expect(realization.getWorker()).toBeUndefined();

    // WA: language client in fails due to vitest (reason not clear, yet)
    try {
      await languageClientWrapper.start();
    } catch (_error) {
      // ignore
    }

    expect(realization.getWorker()).toBeTruthy();

    // dispose & verify
    await languageClientWrapper.dispose();
    expect(realization.getWorker()).toBeUndefined();
  });

  test('Start: unreachable url', async () => {
    const languageClientConfig = createDefaultLcUnreachableUrlConfig(21999);
    languageClientConfig.connection.retryConfig = { timeout: 2000 };
    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);

    await expect(languageClientWrapper.start()).rejects.toEqual({
      message: 'WebSocket (javascript): Connection attempt failed.',
      error: 'Connection timed out after 2000 milliseconds.'
    });
  });

  test('Only unreachable worker url', async () => {
    const prom = new Promise((_resolve, reject) => {
      const worker = new Worker('aBogusUrl');

      worker.onerror = () => {
        reject('error');
      };
    });
    await expect(prom).rejects.toEqual('error');
  });

  test('Start: unreachable worker url', async () => {
    const languageClientConfig = createUnreachableWorkerConfig();
    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);

    await expect(languageClientWrapper.start()).rejects.toEqual({
      message: 'Worker (javascript): Worker reported an error.',
      error: 'No error was provided.'
    });
  });

  test('Dispose: start, dispose worker and restart', async () => {
    const languageClientConfig = createDefaultLanguageClientConfig();
    const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    const realization = languageClientWrapper.getConnectionRealization() as LcWorker;

    expect(realization.getWorker()).toBeUndefined();

    // WA: language client in fails due to vitest (reason not clear, yet)
    try {
      await languageClientWrapper.start();
    } catch (_error) {
      // ignore
      console.error(_error);
    }
    expect(realization.getWorker()).toBeTruthy();

    // dispose & verify
    await languageClientWrapper.dispose();
    expect(realization.getWorker()).toBeUndefined();

    // restart & verify
    try {
      await languageClientWrapper.start();
    } catch (_error) {
      // ignore
      console.error(_error);
    }
    expect(realization.getWorker()).toBeTruthy();
  });

  test('set verify log levels are applied', async () => {
    const languageClientConfig = createDefaultLanguageClientConfig();
    let languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    let logLevel = (languageClientWrapper['logger'] as ILogger).getLevel();
    expect(logLevel).toBe(LogLevel.Off);
    expect(logLevel).toBe(0);

    languageClientConfig.logLevel = LogLevel.Debug;
    languageClientWrapper = new LanguageClientWrapper(languageClientConfig);
    logLevel = (languageClientWrapper['logger'] as ILogger).getLevel();
    expect(logLevel).toBe(LogLevel.Debug);
    expect(logLevel).toBe(2);
  });
});
