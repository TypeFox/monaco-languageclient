/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';
import { render, type RenderResult } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { delayExecution } from 'monaco-languageclient/common';
// import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createDefaultWrapperConfig } from './helper.js';

describe('Test MonacoEditorReactComp', () => {

    beforeAll(async () => {
        // const apiConfig: MonacoVscodeApiConfig = {
        //     $type: 'extended',
        //     htmlContainer: createMonacoEditorDiv(),
        //     serviceOverrides: {}
        // };
        // const monacoVscodeApiManager = new MonacoVscodeApiWrapper(apiConfig);
        // await monacoVscodeApiManager.init();
    });

    const unmountDelayMs = 250;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        serviceOverrides: {},
        logLevel: LogLevel.Debug,
    };

    test.sequential('test render, manual clean-up', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const promise = new Promise<void>(resolve => {
            render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, unmount', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise).toBeUndefined();

        renderResult!.unmount();
    });

    test.sequential('test render, rerender', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise).toBeUndefined();
        console.log('RE-RENDER');

        const wrapperConfig2 = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        const promise2 = new Promise<void>(resolve => {
            renderResult!.rerender(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig2}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise2).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('test render, unmount and render new', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise).toBeUndefined();
        renderResult!.unmount();

        const promise2 = new Promise<void>(resolve => {
            renderResult = render(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/>);
        });
        await expect(await promise2).toBeUndefined();

        await delayExecution(unmountDelayMs);
        renderResult!.unmount();
    });

    test.sequential('strictMode: test render, manual clean-up', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        wrapperConfig.id ='strict';

        const promise = new Promise<void>(resolve => {
            render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('strictMode: test render, unmount', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        renderResult!.unmount();
    });

    test.sequential('strictMode: test render, rerender', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();
        console.log('RE-RENDER');

        const wrapperConfig2 = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        const promise2 = new Promise<void>(resolve => {
            renderResult!.rerender(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig2}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

        // manual clean document body
        document.body.innerHTML = '';
    });

    test.sequential('strictMode: test render, unmount and render new', async () => {

        // TODO: strict mode breaks uris. Same are created for both editors
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();
        renderResult!.unmount();

        const promise2 = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                wrapperConfig={wrapperConfig}
                style={{ 'height': '800px' }}
                onLoad={() => resolve()}/></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

        await delayExecution(unmountDelayMs);
        // renderResult!.unmount();
    });

    // test('onLoad', async () => {
    //     const wrapperConfig = createDefaultWrapperConfig({
    //         modified: {
    //             text: 'const text = "Hello World!";',
    //             uri: `/workspace/${expect.getState().testPath}.js`,
    //         }
    //     });

    //     let renderResult: RenderResult;
    //     // we have to await the full start of the editor with the onLoad callback, then it is save to contine
    //     await expect(await new Promise<void>(resolve => {
    //         const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
    //             resolve();
    //         };
    //         renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
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

    //     const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //         expect(wrapper.getTextModels()?.modified?.getValue()).toEqual('const text = "Hello World!";');
    //     };
    //     render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onTextChanged={(textReceiverHello)} onLoad={handleOnLoad} />);
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

    //     const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //         count++;
    //         await wrapper.updateCodeResources({
    //             modified: {
    //                 text: 'const text = "Goodbye World!";',
    //                 uri: `/workspace/${expect.getState().testPath}_goodbye.js`,
    //             }
    //         });

    //     };
    //     render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} onTextChanged={textReceiver} />);
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
    //             const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //                 renderResult.rerender(<MonacoEditorReactComp wrapperConfig={newWrapperConfig} />);
    //                 resolve();
    //             };

    //             renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
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
    //         const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             console.log('onLoad');
    //         };
    //         render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} /></StrictMode>);

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
    //         const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
    //             console.log('onLoad');
    //         };
    //         render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} /></StrictMode>);

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
    //             const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
    //                 called++;
    //                 console.log(`onLoad re-render call: ${called}`);

    //                 const lcWrapper = wrapper.getLanguageClientWrapper('langium');
    //                 console.log(lcWrapper?.reportStatus());

    //                 if (called === 2) {
    //                     renderResult.rerender(<StrictMode>[]</StrictMode>);
    //                     resolve();
    //                 }
    //             };

    //             renderResult = render(<StrictMode><MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} /></StrictMode>);
    //             // renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
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
