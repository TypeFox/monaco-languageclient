/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { render, type RenderResult } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { delayExecution } from 'monaco-languageclient/common';
import { type LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React, { StrictMode } from 'react';
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

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult | undefined;
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult?.unmount();

        cleanHtmlBody();
    });

    test.sequential('strictMode: test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        let renderResult: RenderResult | undefined;
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
            renderResult?.rerender(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig2}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()} /></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

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
        const promise = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()}/></StrictMode>);
        });
        await expect(await promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult?.unmount();

        const promise2 = new Promise<void>(resolve => {
            renderResult = render(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                style={{ 'height': '800px' }}
                onEditorStartDone={() => resolve()}/></StrictMode>);
        });
        await expect(await promise2).toBeUndefined();

        await delayExecution(unmountDelayMs);
        await expect(renderResult).toBeDefined();
        renderResult?.unmount();

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

        let renderResult: RenderResult | undefined;
        let lcsManager: LanguageClientManager | undefined;
        // eslint-disable-next-line no-async-promise-executor
        const promiseLc = new Promise<void>(async (resolveLc) => {
            const promise = new Promise<void>(resolve => {
                renderResult = render(<StrictMode><MonacoEditorReactComp
                    vscodeApiConfig={vscodeApiConfig}
                    editorAppConfig={editorAppConfig}
                    languageClientConfig={languageClientConfig}
                    style={{ 'height': '800px' }}
                    onLanguageClientsStartDone={(lcsManagerPassed?: LanguageClientManager) => {
                        expect(lcsManagerPassed?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                        lcsManager = lcsManagerPassed;
                        resolve();
                    }}
                /></StrictMode>);
            });
            await expect(await promise).toBeUndefined();

            renderResult?.rerender(<StrictMode><MonacoEditorReactComp
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                enforceDisposeLanguageClient={true}
                onDisposeLanguageClient={() => {
                    resolveLc();
                }}
            /></StrictMode>);
        });

        await expect(await promiseLc).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.haveLanguageClient()).toBeFalsy();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeFalsy();

        renderResult?.unmount();

        cleanHtmlBody();
    });
});
