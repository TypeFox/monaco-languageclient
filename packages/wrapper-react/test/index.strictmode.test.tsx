/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { render, type RenderResult } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { delayExecution } from 'monaco-languageclient/common';
import type { EditorApp, TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React, { StrictMode, useState } from 'react';
import { describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig, createDefaultLanguageClientConfig, Deferred, unmountDelayMs } from './support/helper.js';

describe('Test MonacoEditorReactComp', () => {

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        },
        logLevel: LogLevel.Debug
    };

    test.sequential('strictMode: test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} /></StrictMode>);
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        const renderResult = render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} /></StrictMode>);
        await expect(await deferred.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult.unmount();

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        const renderResult = render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} /></StrictMode>);
        await expect(await deferred.promise).toBeUndefined();

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const deferred2 = new Deferred();
        renderResult.rerender(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()} /></StrictMode>);
        await expect(await deferred2.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult | undefined;
        const deferred = new Deferred();
        renderResult = render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()}/></StrictMode>);
        await expect(await deferred.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult.unmount();

        const deferred2 = new Deferred();
        renderResult = render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()}/></StrictMode>);
        await expect(await deferred2.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult.unmount();

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, languageclient, unmount with enforce dispose', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        let lcsManager: LanguageClientManager | undefined;

        const deferred = new Deferred();
        const renderResult = render(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed?: LanguageClientManager) => {
                expect(lcsManagerPassed?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                lcsManager = lcsManagerPassed;
                deferred.resolve();
            }}
        /></StrictMode>);
        await expect(await deferred.promise).toBeUndefined();

        const deferredLc = new Deferred();
        renderResult.rerender(<StrictMode><MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            enforceDisposeLanguageClient={true}
            onDisposeLanguageClient={() => deferredLc.resolve()}
        /></StrictMode>);

        await expect(await deferredLc.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.haveLanguageClient()).toBeFalsy();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeFalsy();

        renderResult.unmount();

        cleanHtmlBody();
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
        const renderResult = render(<StrictMode>
            <MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig1}
                style={{ 'height': '100px' }}
                onEditorStartDone={() => firstComponentReady.resolve()} />
            <MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                style={{ 'height': '100px' }}
                onEditorStartDone={() => secondComponentReady.resolve()} />
        </StrictMode>);

        expect(await firstComponentReady.promise).toBeUndefined();
        expect(await secondComponentReady.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);

        await expect(renderResult.getAllByRole('code')[0].innerText).contains('FirstComponent');
        await expect(renderResult.getAllByRole('code')[1].innerText).contains('SecondComponent');

        cleanHtmlBody();
    });

    test.sequential('srict mode: test render, modifiedTextValue', async () => {
        const code = 'const text = "Hello World!";';
        const codeUpdated = 'const text = "Goodbye World!";';

        let editorApp: EditorApp | undefined;

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
                <StrictMode>
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
                        onEditorStartDone={(editorAppPassed?: EditorApp) => {
                            editorApp = editorAppPassed;
                            deferredStart.resolve();
                        }}
                        modifiedTextValue={testState}
                    />
                </StrictMode>
            );
        };
        const renderResult = render(<App />);
        await expect(await deferredStart.promise).toBeUndefined();

        // delay execute/click, so await below is already awaiting the deferredDispose
        setTimeout(() => {
            document.getElementById('change-button')?.click();
        }, unmountDelayMs);

        await expect(await deferredChanged.promise).toBeUndefined();
        await expect(count).toBe(2);
        await expect(editorApp?.getEditor()?.getValue()).toBe(codeUpdated);

        renderResult.unmount();

        cleanHtmlBody();
    });

    test.sequential('strictmode: test state change effects editorconfig', async () => {
        const deferredStart = new Deferred();
        const deferredDispose = new Deferred();
        const App = () => {
            const code = 'const text = "Hello World!";';
            const [testState, setTestState] = useState<string>(code);

            const editorAppConfig = createDefaultEditorAppConfig({
                modified: {
                    text: testState,
                    uri: `/workspace/${expect.getState().testPath}.js`
                }
            });

            return (
                <StrictMode>
                    <button id='change-button' style={{background: 'purple'}} onClick={() => setTestState(testState + '\n// comment')}>Change Text</button>
                    <MonacoEditorReactComp
                        vscodeApiConfig={vscodeApiConfig}
                        editorAppConfig={editorAppConfig}
                        style={{ 'height': '800px' }}
                        onEditorStartDone={() => deferredStart.resolve()}
                        onDisposeEditor={() => {
                            console.log('Editor disposed');
                            deferredDispose.resolve();
                        }}
                    />
                </StrictMode>
            );
        };

        const renderResult = render(<App />);

        await expect(await deferredStart.promise).toBeUndefined();
        expect(document.getElementsByClassName('monaco-editor').length).toBe(1);

        // delay execute/click, so await below is already awaiting the deferredDispose
        setTimeout(() => {
            document.getElementById('change-button')?.click();
        }, unmountDelayMs);
        await expect(await deferredDispose.promise).toBeUndefined();

        renderResult.unmount();

        cleanHtmlBody();
    });

});

