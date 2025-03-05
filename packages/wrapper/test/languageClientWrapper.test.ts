/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-editor-wrapper';
import { initServices } from 'monaco-languageclient/vscode/services';
import { createDefaultLcUnreachableUrlConfig, createDefaultLcWorkerConfig } from './support/helper.js';

describe('Test LanguageClientWrapper', () => {

    beforeAll(async () => {
        await initServices({});
    });

    test('Constructor: no config', async () => {
        const languageClientConfig = createDefaultLcWorkerConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });
        expect(languageClientWrapper.haveLanguageClient).toBeTruthy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        const languageClientConfig = createDefaultLcWorkerConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        expect(languageClientWrapper.getWorker()).toBeFalsy();

        // WA: language client in fails due to vitest (reason not clear, yet)
        await expect(async () => {
            await languageClientWrapper.start();
        }).rejects.toThrowError('Error occurred in language client: Error: Reader received error. Reason: unknown');

        expect(languageClientWrapper.getWorker()).toBeTruthy();

        // dispose & verify
        await languageClientWrapper.disposeLanguageClient(true);
        expect(languageClientWrapper.getWorker()).toBeUndefined();
    });

    test('Start: unreachable url', async () => {
        const languageClientConfig: LanguageClientConfig = createDefaultLcUnreachableUrlConfig();
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        await expect(languageClientWrapper.start()).rejects.toEqual({
            message: 'languageClientWrapper (test-ws-unreachable): Websocket connection failed.',
            error: 'No error was provided.'
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
        const languageClientConfig: LanguageClientConfig = {
            name: 'test-worker-unreachable',
            clientOptions: {
                documentSelector: ['javascript']
            },
            connection: {
                options: {
                    $type: 'WorkerConfig',
                    url: new URL(`${import.meta.url.split('@fs')[0]}/packages/wrapper/test/worker/langium-server.ts`),
                    type: 'module'
                }
            }
        };

        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });

        await expect(languageClientWrapper.start()).rejects.toEqual({
            message: 'languageClientWrapper (test-worker-unreachable): Illegal worker configuration detected.',
            error: 'No error was provided.'
        });
    });

});
