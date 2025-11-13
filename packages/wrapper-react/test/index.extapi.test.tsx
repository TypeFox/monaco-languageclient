/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { render, type RenderResult } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { Deferred, delayExecution } from 'monaco-languageclient/common';
import type { EditorApp, TextContents } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React, { useState } from 'react';
import { beforeAll, describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig, unmountDelayMs } from './support/helper.js';

describe.sequential('Test MonacoEditorReactComp: External monaco-vscode-api', () => {

    const code = 'const text = "Hello World!";';
    const codeUpdated = 'const text = "Goodbye World!";';

    beforeAll(async () => {
        const vscodeApiConfig: MonacoVscodeApiConfig = {
            $type: 'extended',
            viewsConfig: {
                $type: 'EditorService'
            }
        };
        const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
        await apiWrapper.start();
    });

    test('test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        await expect(renderResult).toBeDefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let editorApp: EditorApp | undefined;
        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
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

    test('test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let renderResult: RenderResult | undefined;
        const deferred = new Deferred();
        renderResult = render(<MonacoEditorReactComp
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred.resolve()} />);
        await expect(await deferred.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);

        const deferred2 = new Deferred();
        renderResult = render(<MonacoEditorReactComp
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()} />);
        await expect(await deferred2.promise).toBeUndefined();

        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('strictMode: multiple editors in single render', async () => {
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
                editorAppConfig={editorAppConfig1}
                style={{ 'height': '100px' }}
                onEditorStartDone={() => firstComponentReady.resolve()}
            />
            <MonacoEditorReactComp
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

    test('test render, modify code', async () => {
        const deferredStart = new Deferred();
        const deferredChanged = new Deferred();
        let modified;
        let count = 0;

        const App = () => {
            const [codeState, setCodeState] = useState<string>(code);

            const editorAppConfig = createDefaultEditorAppConfig({
                modified: {
                    text: codeState,
                    uri: `/workspace/${expect.getState().testPath}.js`
                }
            });

            return (
                <>
                    <button id='change-button' style={{background: 'purple'}} onClick={() => setCodeState(codeUpdated)}>Change Text</button>
                    <MonacoEditorReactComp
                        editorAppConfig={editorAppConfig}
                        style={{ 'height': '800px' }}
                        onTextChanged={async (textChanges: TextContents) => {
                            modified = textChanges.modified;
                            count++;
                            console.log(`count: ${count} text: ${modified}`);
                            if (codeUpdated === modified) {
                                deferredChanged.resolve();
                            }
                        }}
                        onEditorStartDone={() => deferredStart.resolve()}
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
});
