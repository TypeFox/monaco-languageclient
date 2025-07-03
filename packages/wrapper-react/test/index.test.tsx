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

    test.sequential('test render, languageclient, unmount with enforce dispose', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfigs = createDefaultLanguageClientConfigs();
        languageClientConfigs.enforceDispose = true;

        let renderResult: RenderResult;
        // eslint-disable-next-line no-async-promise-executor
        const promiseLc = new Promise<void>(async (resolveLc) => {
            const promise = new Promise<void>(resolve => {
                renderResult = render(<MonacoEditorReactComp
                    vscodeApiConfig={vscodeApiConfig}
                    editorAppConfig={editorAppConfig}
                    languageClientConfigs={languageClientConfigs}
                    style={{ 'height': '800px' }}
                    onLanguagClientsStartDone={(lcsManager?: LanguageClientsManager) => {
                        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                        resolve();
                    }}
                    onDisposeLanguagaeClients={() => {
                        resolveLc();
                    }}
                />);
            });
            await expect(await promise).toBeUndefined();

            renderResult!.unmount();
        });

        await expect(await promiseLc).toBeUndefined();
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

    test.sequential('test render, languageclient, rerender with changed config', async () => {
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
                }}
            />);
        });
        await expect(await promise).toBeUndefined();

        const codeUpdated = 'const text = "Goodbye World!";';
        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const languageClientConfigs2 = createDefaultLanguageClientConfigs();
        languageClientConfigs2.configs.langium.clientOptions.markdown = {
            supportHtml: true
        };
        await new Promise<void>(resolve => {
            renderResult!.rerender(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                languageClientConfigs={languageClientConfigs2}
                style={{ 'height': '800px' }}
                onEditorStartDone={async (editorAppPassed?: EditorApp) => {
                    if (editorAppPassed !== undefined) {
                        await expect(editorAppPassed.getEditor()?.getValue()).toBe(codeUpdated);
                    }
                    resolve();
                }}
                onError={(error) => {
                    expect(error.message).toEqual('A languageclient config with id "langium" already exists and you confiured to not override.');
                }}
            />);
        });

        const languageClientConfigs3 = createDefaultLanguageClientConfigs();
        languageClientConfigs3.overwriteExisting = true;
        languageClientConfigs3.enforceDispose = true;
        languageClientConfigs3.configs.langium.clientOptions.markdown = {
            supportHtml: true
        };
        await new Promise<void>(resolve => {
            renderResult!.rerender(<MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                languageClientConfigs={languageClientConfigs3}
                style={{ 'height': '800px' }}
                onLanguagClientsStartDone={(lcsManager?: LanguageClientsManager) => {
                    expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                    resolve();
                }}
                onDisposeLanguagaeClients={() => {
                    console.log('Hello');
                }}
            />);
        });

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
});
