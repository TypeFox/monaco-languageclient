/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { LanguageClientConfig, LanguageClientWrapper, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createBaseConfig } from './helper.js';

describe('Test LanguageClientWrapper', () => {

    test('Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(createBaseConfig('extended'));

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('Constructor: no config', async () => {
        // create a web worker to pass to the wrapper
        const worker = new Worker('./worker/langium-server.ts', {
            type: 'module',
            name: 'Langium LS',
        });
        const languageClientConfig: LanguageClientConfig = {
            languageId: 'javascript',
            connection: {
                options: {
                    $type: 'WorkerDirect',
                    worker
                }
            }
        };

        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig
        });
        expect(languageClientWrapper).toBeDefined();
        expect(languageClientWrapper.haveLanguageClient).toBeTruthy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        // create a web worker to pass to the wrapper
        const worker = new Worker('./worker/langium-server.ts', {
            type: 'module',
            name: 'Langium LS',
        });

        // setup the wrapper
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker
                    }
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        expect(languageClientWrapper?.getWorker()).toBeFalsy();

        // WA: for whatever reasons "await" kills the test,
        // but the languageClientWrapper needs to be fully initialised as otherwise the follow up steps fail
        languageClientWrapper?.start();

        setTimeout(async () => {
            // dispose & verify
            await languageClientWrapper?.disposeLanguageClient();
            expect(languageClientWrapper?.getWorker()).toBeUndefined();
        }, 250);
        expect(languageClientWrapper?.getWorker()).toBeTruthy();
    });

    test('Constructor: config', async () => {
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:12345/Tester'
                    }
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();
    });

    test('Start: unreachable url', async () => {
        const config = createBaseConfig('extended');
        config.languageClientConfigs = {
            javascript: {
                languageId: 'javascript',
                name: 'test-unreachable',
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:12345/Tester'
                    }
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

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
                connection: {
                    options: {
                        $type: 'WorkerConfig',
                        url: new URL('http://localhost:20101'),
                        type: 'classic'
                    }
                }
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(config);

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        await expect(languageClientWrapper!.start()).rejects.toEqual({
            message: 'languageClientWrapper (unnamed): Illegal worker configuration detected. Potentially the url is wrong.',
            error: 'No error was provided.'
        });
    });

});
