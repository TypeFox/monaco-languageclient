/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { LanguageClientConfig, LanguageClientWrapper, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createBaseConfig, createWorkerFromFunction } from './helper.js';

describe('Test LanguageClientWrapper', () => {

    test('Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(createBaseConfig('extended'));

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('Constructor: no config', async () => {
        // create a web worker to pass to the wrapper
        const worker = createWorkerFromFunction(() => {
            console.info('Hello');
        });
        const languageClientConfig: LanguageClientConfig = {
            languageId: 'javascript',
            options: {
                $type: 'WorkerDirect',
                worker
            }
        };

        const languageClientWrapper = new LanguageClientWrapper();
        languageClientWrapper.init({
            languageClientConfig
        });
        expect(languageClientWrapper).toBeDefined();
        expect(languageClientWrapper.haveLanguageClient).toBeTruthy();
        expect(languageClientWrapper.haveLanguageClientConfig).toBeTruthy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        // create a web worker to pass to the wrapper
        const worker = createWorkerFromFunction(() => {
            console.info('Hello');
        });

        // setup the wrapper
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                options: {
                    $type: 'WorkerDirect',
                    worker
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        // start up & verify (don't wait for start to finish, just roll past it, we only care about the worker)
        languageClientWrapper!.start();
        expect(languageClientWrapper!.getWorker()).toBeTruthy();

        // dispose & verify
        languageClientWrapper!.disposeLanguageClient();
        expect(languageClientWrapper!.getWorker()).toBeUndefined();
    });

    test('Constructor: config', async () => {
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                options: {
                    $type: 'WebSocketUrl',
                    url: 'ws://localhost:12345/Tester'
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        expect(languageClientWrapper!.haveLanguageClientConfig()).toBeTruthy();
    });

    test('Start: unreachable url', async () => {
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                name: 'test-unreachable',
                options: {
                    $type: 'WebSocketUrl',
                    url: 'ws://localhost:12345/Tester'
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        expect(languageClientWrapper!.haveLanguageClientConfig()).toBeTruthy();
        console.log('start');
        await expect(languageClientWrapper!.start()).rejects.toEqual({
            message: 'languageClientWrapper (test-unreachable): Websocket connection failed.',
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
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                options: {
                    $type: 'WorkerConfig',
                    url: new URL('http://localhost:20101'),
                    type: 'classic'
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        expect(languageClientWrapper!.haveLanguageClientConfig()).toBeTruthy();
        await expect(languageClientWrapper!.start()).rejects.toEqual({
            message: 'languageClientWrapper (unnamed): Illegal worker configuration detected. Potentially the url is wrong.',
            error: 'No error was provided.'
        });
    });

});
