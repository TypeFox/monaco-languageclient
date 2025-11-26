/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { Logger } from 'monaco-languageclient/common';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { beforeAll, describe, expect, test } from 'vitest';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { createDefaultLcUnreachableUrlConfig, createDefaultLcWorkerConfig, createMonacoEditorDiv, createUnreachableWorkerConfig } from '../support/helper.js';

describe('Test LanguageClientWrapper', () => {

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

    const createWorkerAndConfig = () => {
        const workerUrl = 'monaco-languageclient-examples/worker/langium';
        const worker = new Worker(workerUrl, {
            type: 'module',
            name: 'Langium LS'
        });

        const reader = new BrowserMessageReader(worker);
        const writer = new BrowserMessageWriter(worker);
        reader.listen((message) => {
            console.log('Received message from worker:', message);
        });
        const languageClientConfig = createDefaultLcWorkerConfig(worker, 'langium', { reader, writer });
        languageClientConfig.disposeWorker = true;
        return {
            worker,
            languageClientConfig
        };
    };

    test('Constructor: no config', () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper(workerAndConfig.languageClientConfig);
        expect(languageClientWrapper.haveLanguageClient()).toBeFalsy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper(workerAndConfig.languageClientConfig);

        expect(workerAndConfig.worker).toBeDefined();
        expect(languageClientWrapper.getWorker()).toBeUndefined();

        // WA: language client in fails due to vitest (reason not clear, yet)
        try {
            await languageClientWrapper.start();
        } catch (_error) {
            // ignore
        };

        expect(languageClientWrapper.getWorker()).toBeTruthy();

        // dispose & verify
        await languageClientWrapper.dispose();
        expect(languageClientWrapper.getWorker()).toBeUndefined();
    });

    test('Start: unreachable url', async () => {
        const languageClientConfig = createDefaultLcUnreachableUrlConfig(23456);
        const languageClientWrapper = new LanguageClientWrapper(languageClientConfig);

        try {
            await languageClientWrapper.start();
        } catch (error) {
            expect(error).toEqual({
                message: 'languageClientWrapper (javascript): Websocket connection failed.',
                error: 'No error was provided.'
            });
        }
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
            message: 'languageClientWrapper (javascript): Illegal worker configuration detected.',
            error: 'No error was provided.'
        });
    });

    test('Dispose: start, dispose worker and restart', async () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper(workerAndConfig.languageClientConfig);

        expect(workerAndConfig.worker).toBeDefined();
        expect(languageClientWrapper.getWorker()).toBeUndefined();

        // WA: language client in fails due to vitest (reason not clear, yet)
        try {
            await languageClientWrapper.start();
        } catch (_error) {
            // ignore
            console.error(_error);
        };
        expect(languageClientWrapper.getWorker()).toBeTruthy();

        // dispose & verify
        await languageClientWrapper.dispose();
        expect(languageClientWrapper.getWorker()).toBeUndefined();

        // restart & verify
        try {
            await languageClientWrapper.start();
        } catch (_error) {
            // ignore
            console.error(_error);
        };
        expect(languageClientWrapper.getWorker()).toBeTruthy();
    });

    test('set verify log levels are applied', async () => {
        const workerAndConfig = createWorkerAndConfig();
        let languageClientWrapper = new LanguageClientWrapper(workerAndConfig.languageClientConfig);
        let logLevel = (languageClientWrapper['logger'] as Logger).getLevel();
        expect(logLevel).toBe(LogLevel.Off);
        expect(logLevel).toBe(0);

        workerAndConfig.languageClientConfig.logLevel = LogLevel.Debug;
        languageClientWrapper = new LanguageClientWrapper(workerAndConfig.languageClientConfig);
        logLevel = (languageClientWrapper['logger'] as Logger).getLevel();
        expect(logLevel).toBe(LogLevel.Debug);
        expect(logLevel).toBe(2);
    });

});
