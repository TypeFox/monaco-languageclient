/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { LanguageClientWrapper } from 'monaco-editor-wrapper';
import { initServices } from 'monaco-languageclient/vscode/services';
import { createDefaultLcUnreachableUrlConfig, createDefaultLcWorkerConfig, createUnreachableWorkerConfig } from './support/helper.js';

describe('Test LanguageClientWrapper', () => {

    beforeAll(async () => {
        await initServices({});
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
        return {
            worker,
            languageClientConfig
        };
    };

    test('Constructor: no config', () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig: workerAndConfig.languageClientConfig
        });
        expect(languageClientWrapper.haveLanguageClient()).toBeFalsy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig: workerAndConfig.languageClientConfig
        });

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
        await languageClientWrapper.disposeLanguageClient(true);
        expect(languageClientWrapper.getWorker()).toBeUndefined();
    });

    test('Start: unreachable url', async () => {
        const languageClientConfig = createDefaultLcUnreachableUrlConfig(23456);
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        try {
            await languageClientWrapper.start();
        } catch (error) {
            expect(error).toEqual({
                message: 'languageClientWrapper (test-ws-unreachable): Websocket connection failed.',
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
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        await expect(languageClientWrapper.start()).rejects.toEqual({
            message: 'languageClientWrapper (test-worker-unreachable): Illegal worker configuration detected.',
            error: 'No error was provided.'
        });
    });

    test('Dispose: start, dispose worker and restart', async () => {
        const workerAndConfig = createWorkerAndConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig: workerAndConfig.languageClientConfig
        });

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
        await languageClientWrapper.disposeLanguageClient(true);
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

});
