/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { LanguageClientWrapper, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createWrapperConfigExtendedApp } from './helper.js';

describe('Test LanguageClientWrapper', () => {

    test('Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.init(createWrapperConfigExtendedApp());

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('Constructor: no config', async () => {
        const languageClientWrapper = new LanguageClientWrapper({
            languageClientConfig: {
                clientOptions: {
                    documentSelector: ['javascript']
                },
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        // create a web worker to pass to the wrapper
                        worker: new Worker('./worker/langium-server.ts', {
                            type: 'module',
                            name: 'Langium LS',
                        })
                    }
                }
            }
        });
        expect(languageClientWrapper).toBeDefined();
        expect(languageClientWrapper.haveLanguageClient).toBeTruthy();
    });

    test('Dispose: direct worker is cleaned up afterwards', async () => {
        // setup the wrapper
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            javascript: {
                clientOptions: {
                    documentSelector: ['javascript']
                },
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        // create a web worker to pass to the wrapper
                        worker: new Worker('./worker/langium-server.ts', {
                            type: 'module',
                            name: 'Langium LS',
                        })
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
            await languageClientWrapper?.disposeLanguageClient(false);
            expect(languageClientWrapper?.getWorker()).toBeUndefined();
        }, 250);
        expect(languageClientWrapper?.getWorker()).toBeTruthy();
    });

    test('Constructor: config', async () => {
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            javascript: {
                clientOptions: {
                    documentSelector: ['javascript']
                },
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
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            javascript: {
                clientOptions: {
                    documentSelector: ['javascript']
                },
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
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            javascript: {
                clientOptions: {
                    documentSelector: ['javascript']
                },
                connection: {
                    options: {
                        $type: 'WorkerConfig',
                        url: new URL(`${import.meta.url.split('@fs')[0]}/packages/wrapper/test/worker/langium-server.ts`),
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
            message: 'languageClientWrapper (unnamed): Illegal worker configuration detected.',
            error: 'No error was provided.'
        });
    });

});
