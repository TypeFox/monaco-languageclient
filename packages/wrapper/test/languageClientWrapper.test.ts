/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-editor-wrapper';
import { initServices } from 'monaco-languageclient/vscode/services';
import { createDefaultLcUnreachableUrlConfig, createDefaultLcWorkerConfig, createUnreachableWorkerConfig } from './support/helper.js';

describe('Test LanguageClientWrapper', () => {

    let worker: Worker;
    let languageClientConfig: LanguageClientConfig;

    beforeAll(async () => {
        await initServices({});

        worker = new Worker('../workers/langium-server.ts', {
            type: 'module',
            name: 'Langium LS'
        });
        languageClientConfig = createDefaultLcWorkerConfig(worker);
    });

    test('Constructor: no config', () => {
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });
        expect(languageClientWrapper.haveLanguageClient()).toBeFalsy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        expect(worker).toBeDefined();
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

});
