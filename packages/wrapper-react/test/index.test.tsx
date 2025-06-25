/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { render, type RenderResult } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { delayExecution } from 'monaco-languageclient/common';
import { type LanguageClientsManager } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React, { StrictMode } from 'react';
import { describe, expect, test } from 'vitest';
import type { TextContents } from '../../client/lib/editorApp/config.js';
import type { EditorApp } from '../../client/lib/editorApp/editorApp.js';
import { createDefaultEditorAppConfig, createDefaultLanguageClientConfigs } from './support/helper.js';

describe('Test MonacoEditorReactComp', () => {

    const unmountDelayMs = 250;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        serviceOverrides: {},
        logLevel: LogLevel.Debug,
    };

    test.sequential('test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const promise = new Promise<void>(resolve => {
            render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise).toBeUndefined();

        renderResult!.unmount();
    });

    test.sequential('test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise).toBeUndefined();

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        const promise2 = new Promise<void>(resolve => {
            renderResult!.rerender(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise2).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise).toBeUndefined();
        renderResult!.unmount();

        const promise2 = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} />);
        });
        await expect(await promise2).toBeUndefined();

        await delayExecution(unmountDelayMs);
        renderResult!.unmount();
    });

    test.sequential('strictMode: test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const promise = new Promise<void>(resolve => {
            render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('strictMode: test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        renderResult!.unmount();
    });

    test.sequential('strictMode: test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const promise2 = new Promise<void>(resolve => {
            renderResult!.rerender(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('strictMode: test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();
        renderResult!.unmount();

        const promise2 = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()}/></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

        await delayExecution(unmountDelayMs);
        // renderResult!.unmount();
    });

    test.sequential('test render, languageclient, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfigs = createDefaultLanguageClientConfigs();

        const promise = new Promise<void>(resolve => {
            render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                languageClientConfigs={languageClientConfigs}
                style={{ 'height': '800px' }}
                onLanguagClientsStartDone={(lcsManager?: LanguageClientsManager) => {
                    expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                    resolve();
                }} />);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, languageclient, rerender', async () => {
        const code = 'const text = "Hello World!";';
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfigs = createDefaultLanguageClientConfigs();

        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                languageClientConfigs={languageClientConfigs}
                style={{ 'height': '800px' }}
                onLanguagClientsStartDone={(lcsManager?: LanguageClientsManager) => {
                    expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                    resolve();
                }} />);
        });
        await expect(await promise).toBeUndefined();

        const codeUpdated = 'const text = "Goodbye World!";';
        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const promiseRerender = new Promise<void>(resolve => {
            renderResult!.rerender(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                languageClientConfigs={languageClientConfigs}
                style={{ 'height': '800px' }}
                onEditorStartDone={async (editorAppPassed?: EditorApp) => {
                    if (editorAppPassed !== undefined) {
                        await expect(editorAppPassed.getEditor()?.getValue()).toBe(codeUpdated);
                    }
                    resolve();
                }}
            />);
        });
        await expect(await promiseRerender).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, modifiedTextValue', async () => {
        const code = 'const text = "Hello World!";';
        const codeUpdated = 'const text = "Goodbye World!";';
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let editorApp: EditorApp | undefined;

        const promise = new Promise<void>(resolve => {
            render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onTextChanged={async (textChanges: TextContents) => {
                    const modified = textChanges.modified;

                    await expect(modified).toBeOneOf([code, codeUpdated]);
                    if (editorApp !== undefined) {
                        await expect(editorApp.getEditor()?.getValue()).toBeOneOf([code, codeUpdated]);
                    }
                }}
                onEditorStartDone={(editorAppPassed?: EditorApp) => {
                    editorApp = editorAppPassed;
                    resolve();
                }}
                modifiedTextValue={codeUpdated} />);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    // test('onEditorStartDone', async () => {
    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         }
    //     });

    //     let renderResult: RenderResult;
    //     // we have to await the full start of the editor with the onEditorStartDone callback, then it is save to contine
    //     await expect(await new Promise<void>(resolve => {
    //         const handleonEditorStartDone = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
    //             resolve();
    //         };
    //         renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} />);
    //     // void promise is undefined after it was awaited
    //     })).toBeUndefined();
    // });

    // test('update onTextChanged', async () => {
    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         }
    //     });

    //     const textReceiverHello = (textChanges: TextContents) => {
    //         expect(textChanges.modified).toEqual('const text = "Hello World!";');
    //     };

    //     const handleonEditorStartDone = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //         expect(wrapper.getTextModels()?.modified?.getValue()).toEqual('const text = "Hello World!";');
    //     };
    //     render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onTextChanged={(textReceiverHello)} onEditorStartDone={handleonEditorStartDone} />);
    // });

    // test('update codeResources', async () => {
    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         }
    //     });

    //     let count = 0;
    //     const textReceiver = (textChanges: TextContents) => {
    //         // initial call
    //         if (count === 0) {
    //             expect(textChanges.modified).toBe('const text = "Hello World!";');
    //         } else {
    //             expect(textChanges.modified).toBe('const text = "Goodbye World!";');
    //         }
    //     };

    //     const handleonEditorStartDone = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //         count++;
    //         await wrapper.updateCodeResources({
    //             modified: {
    //                 text: 'const text = "Goodbye World!";',
    //                 uri: `/workspace/${expect.getState().testPath}_goodbye.js`,
    //             }
    //         });

    //     };
    //     render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} onTextChanged={textReceiver} />);
    // });

    // test('rerender without error', async () => {
    //     let errorOccurred = false;

    //     const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
    //     const worker = new Worker(workerUrl, {
    //         type: 'module',
    //         name: 'Langium LS (React Test)'
    //     });
    //     const languageClientConfig = createDefaultLcWorkerConfig(worker, 'langium');

    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         }
    //     });
    //     wrapperConfig.languageClientConfigs = {
    //         configs: {
    //             'langium': languageClientConfig
    //         }
    //     };
    //     const newWrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Goodbye World 2!";',
    //             uri: `/workspace/${expect.getState().testPath}_2.js`,
    //         }
    //     });
    //     newWrapperConfig.languageClientConfigs = {
    //         automaticallyDisposeWorkers: true,
    //         configs: {
    //             'langium': languageClientConfig
    //         }
    //     };

    //     let renderResult: RenderResult;
    //     try {
    //         const result1 = await new Promise<void>(resolve => {
    //             const handleonEditorStartDone = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //                 renderResult.rerender(<MonacoEditorReactComp wrapperConfig={newWrapperConfig} />);
    //                 resolve();
    //             };

    //             renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} />);
    //         });

    //         // void promise is undefined after it was awaited
    //         expect(result1).toBeUndefined();

    //         renderResult!.rerender(<MonacoEditorReactComp wrapperConfig={newWrapperConfig} />);
    //     } catch (error) {
    //         console.error(`Unexpected error occured: ${error}`);
    //         errorOccurred = true;
    //     }
    //     expect(errorOccurred).toBe(false);
    // });

    // test('strict-mode: editor only', async () => {
    //     let errorOccurred = false;

    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         },
    //     });

    //     try {
    //         const handleonEditorStartDone = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             console.log('onEditorStartDone');
    //         };
    //         render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} /></StrictMode>);

    //     } catch (error) {
    //         console.error(`Unexpected error occured: ${error}`);
    //         errorOccurred = true;
    //     }
    //     expect(errorOccurred).toBe(false);
    // });

    // test('strict-mode: language server', async () => {
    //     let errorOccurred = false;

    //     const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
    //     const worker = new Worker(workerUrl, {
    //         type: 'module',
    //         name: 'Langium LS (React Test 1)'
    //     });
    //     const languageClientConfig = createDefaultLcWorkerConfig(worker, 'langium');

    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.langium`,
    //         },
    //     });
    //     wrapperConfig.languageClientConfigs = {
    //         configs: {
    //             'langium': languageClientConfig
    //         }
    //     };

    //     try {
    //         const handleonEditorStartDone = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             console.log('onEditorStartDone');
    //         };
    //         render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} /></StrictMode>);

    //     } catch (error) {
    //         console.error(`Unexpected error occured: ${error}`);
    //         errorOccurred = true;
    //     }
    //     expect(errorOccurred).toBe(false);
    // });

    // test('strict-mode: language server (re-render)', async () => {
    //     let errorOccurred = false;

    //     const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
    //     const worker = new Worker(workerUrl, {
    //         type: 'module',
    //         name: 'Langium LS (React Test 1)'
    //     });
    //     const languageClientConfig = createDefaultLcWorkerConfig(worker, 'langium');

    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.langium`,
    //         },
    //     });
    //     wrapperConfig.languageClientConfigs = {
    //         automaticallyDisposeWorkers: false,
    //         configs: {
    //             'langium': languageClientConfig
    //         }
    //     };

    //     let renderResult: RenderResult;
    //     try {
    //         const result1 = await new Promise<void>(resolve => {
    //             let called = 0;
    //             const handleonEditorStartDone = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //                 called++;
    //                 console.log(`onEditorStartDone re-render call: ${called}`);

    //                 const lcWrapper = wrapper.getLanguageClientWrapper('langium');
    //                 console.log(lcWrapper?.reportStatus());

    //                 if (called === 2) {
    //                     renderResult.rerender(<StrictMode>[]</StrictMode>);
    //                     resolve();
    //                 }
    //             };

    //             renderResult = render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} /></StrictMode>);
    //             // renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onEditorStartDone={handleonEditorStartDone} />);
    //         });

    //         // void promise is undefined after it was awaited
    //         expect(result1).toBeUndefined();
    //     } catch (error) {
    //         console.error(`Unexpected error occured: ${error}`);
    //         errorOccurred = true;
    //     }

    //     expect(errorOccurred).toBe(false);
    // });
});
