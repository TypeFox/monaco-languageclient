/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { render, type RenderResult } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { Deferred, delayExecution } from 'monaco-languageclient/common';
import type { EditorApp, TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React, { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig, createDefaultLanguageClientConfig, unmountDelayMs } from './support/helper.js';

describe('Test MonacoEditorReactComp', () => {

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        },
        logLevel: LogLevel.Debug
    };
    const code = 'const text = "Hello World!";';
    const codeUpdated = 'const text = "Goodbye World!";';

    test.sequential('test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        await expect(renderResult).toBeDefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let editorApp: EditorApp | undefined;
        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={(editorAppPassed?: EditorApp) => {
                editorApp = editorAppPassed;
                deferred.resolve();
            }}
        />);
        await expect(await deferred.promise).toBeUndefined();

        const deferred2 = new Deferred();
        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            style={{ 'height': '800px' }}
            onConfigProcessed={async (editorApp?: EditorApp) => {
                expect(editorApp).toBeDefined();
                await delayExecution(unmountDelayMs);
                expect(editorApp?.getEditor()?.getValue()).toBe(codeUpdated);
                deferred2.resolve();
            }}
        />);
        await expect(await deferred2.promise).toBeUndefined();
        await delayExecution(unmountDelayMs);
        expect(editorApp?.getTextModels().modified?.getValue()).toBe(codeUpdated);

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult | undefined;
        const deferred = new Deferred();
        renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);

        const deferred2 = new Deferred();
        renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()} />);
        await expect(await deferred2.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, languageclient, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManager?: LanguageClientManager) => {
                expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                deferred.resolve();
            }} />);
        await expect(await deferred.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, languageclient, unmount with enforce dispose', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        let lcsManager: LanguageClientManager | undefined;
        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed?: LanguageClientManager) => {
                expect(lcsManagerPassed?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                lcsManager = lcsManagerPassed;
                deferred.resolve();
            }}
        />);
        await expect(await deferred.promise).toBeUndefined();

        const deferredLc = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            enforceDisposeLanguageClient={true}
            onDisposeLanguageClient={() => deferredLc.resolve()}
        />);

        await expect(await deferredLc.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.haveLanguageClient()).toBeFalsy();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeFalsy();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, languageclient, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        const deferredLc = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManager?: LanguageClientManager) => {
                expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                deferredLc.resolve();
            }}
        />);
        await expect(await deferredLc.promise).toBeUndefined();

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const deferred2 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onConfigProcessed={async (editorApp?: EditorApp) => {
                expect(editorApp).toBeDefined();
                await delayExecution(unmountDelayMs);
                expect(editorApp?.getEditor()?.getValue()).toBe(codeUpdated);
                deferred2.resolve();
            }}
        />);

        await expect(await deferred2.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, languageclient, rerender with changed config', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        const deferredLc = new Deferred();
        const deferredEditor = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManager?: LanguageClientManager) => {
                expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                deferredLc.resolve();
            }}
            onEditorStartDone={() => deferredEditor.resolve()}
        />);
        await expect(Promise.all([deferredEditor.promise, deferredLc.promise])).resolves.toEqual([undefined, undefined]);

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const languageClientConfigs2 = createDefaultLanguageClientConfig();
        languageClientConfigs2.clientOptions.markdown = {
            supportHtml: true
        };
        const deferred2 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            languageClientConfig={languageClientConfigs2}
            style={{ 'height': '800px' }}
            onConfigProcessed={async (editorApp?: EditorApp) => {
                expect(editorApp).toBeDefined();
                await delayExecution(unmountDelayMs);
                expect(editorApp?.getEditor()?.getValue()).toBe(codeUpdated);
                deferred2.resolve();
            }}
            onError={(error) => {
                expect(error.message).toEqual('A languageclient config with id "langium" already exists and you confiured to not override.');
            }}
        />);
        await expect(await deferred2.promise).toBeUndefined();

        const languageClientConfigs3 = createDefaultLanguageClientConfig();
        languageClientConfigs3.clientOptions.markdown = {
            supportHtml: true
        };

        const deferred3 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfigs3}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManager?: LanguageClientManager) => {
                expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                deferred3.resolve();
            }}
        />);
        await expect(await deferred3.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('strictMode: multiple editors in single render', async () => {
        const editorAppConfig1 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "FirstComponent";',
                uri: `/workspace/first-${expect.getState().testPath}.js`
            }
        });
        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "SecondComponent";',
                uri: `/workspace/second-${expect.getState().testPath}.js`
            }
        });
        const firstComponentReady = new Deferred();
        const secondComponentReady = new Deferred();
        const renderResult = render(<>
            <MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig1}
                style={{ 'height': '100px' }}
                onEditorStartDone={() => firstComponentReady.resolve()}
            />
            <MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                style={{ 'height': '100px' }}
                onEditorStartDone={() => secondComponentReady.resolve()}
            />
        </>);

        const promises = await Promise.all([firstComponentReady.promise, secondComponentReady.promise]);
        expect(promises).toEqual([undefined, undefined]);

        await delayExecution(unmountDelayMs);

        await expect(renderResult.getAllByRole('code')[0].innerText).contains('FirstComponent');
        await expect(renderResult.getAllByRole('code')[1].innerText).contains('SecondComponent');

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test render, modifiedTextValue', async () => {
        const deferredStart = new Deferred();
        const deferredChanged = new Deferred();
        let modified;
        let count = 0;

        const App = () => {
            const [testState, setTestState] = useState<string>(code);

            const editorAppConfig = createDefaultEditorAppConfig({
                modified: {
                    text: code,
                    uri: `/workspace/${expect.getState().testPath}.js`
                }
            });

            return (
                <>
                    <button id='change-button' style={{background: 'purple'}} onClick={() => setTestState(codeUpdated)}>Change Text</button>
                    <MonacoEditorReactComp
                        vscodeApiConfig={vscodeApiConfig}
                        editorAppConfig={editorAppConfig}
                        style={{ 'height': '800px' }}
                        onTextChanged={async (textChanges: TextContents) => {
                            modified = textChanges.modified;
                            count++;
                            if (codeUpdated === modified) {
                                deferredChanged.resolve();
                            }
                        }}
                        onEditorStartDone={() => deferredStart.resolve()}
                        modifiedTextValue={testState}
                    />
                </>
            );
        };
        const renderResult = render(<App />);
        await expect(await deferredStart.promise).toBeUndefined();

        // delay execute/click, so await below is already awaiting the deferredDispose
        setTimeout(() => {
            document.getElementById('change-button')?.click();
        }, unmountDelayMs);

        await expect(await deferredChanged.promise).toBeUndefined();
        // one time code, then update
        await expect(count).toBe(2);

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test.sequential('test state change effects editorconfig', async () => {
        const deferredStart = new Deferred();
        const deferredDispose = new Deferred();
        const App = () => {
            const [testState, setTestState] = useState<string>(code);

            const editorAppConfig = createDefaultEditorAppConfig({
                modified: {
                    text: testState,
                    uri: `/workspace/${expect.getState().testPath}.js`
                }
            });

            return (
                <>
                    <button id='change-button' style={{background: 'purple'}} onClick={() => setTestState(testState + '\n// comment')}>Change Text</button>
                    <MonacoEditorReactComp
                        vscodeApiConfig={vscodeApiConfig}
                        editorAppConfig={editorAppConfig}
                        style={{ 'height': '800px' }}
                        onEditorStartDone={() => deferredStart.resolve()}
                        onConfigProcessed={() => deferredDispose.resolve()}
                    />
                </>
            );
        };
        const renderResult = render(<App />);
        await expect(await deferredStart.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        expect(document.getElementsByClassName('monaco-editor').length).toBe(1);

        // delay execute/click, so await below is already awaiting the deferredDispose
        setTimeout(() => {
            document.getElementById('change-button')?.click();
        }, unmountDelayMs);
        await expect(await deferredDispose.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });
});
