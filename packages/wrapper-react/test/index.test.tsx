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
import React from 'react';
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

    test.sequential('test render, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
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
    });

    test.sequential('test render, unmount', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
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

        renderResult.unmount();

        cleanHtmlBody();
    });

    test.sequential('test render, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
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

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World 2!";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        const deferred2 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()}/>);
        await expect(await deferred2.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('test render, unmount and render new', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
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

        const deferred2 = new Deferred();
        renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onEditorStartDone={() => deferred2.resolve()} />);

        await expect(await deferred2.promise).toBeUndefined();

        await delayExecution(unmountDelayMs);
        renderResult.unmount();

        cleanHtmlBody();
    });

    test.sequential('test render, languageclient, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const languageClientConfig = createDefaultLanguageClientConfig();

        const deferred = new Deferred();
        render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManager?: LanguageClientManager) => {
                expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
                deferred.resolve();
            }} />);
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('test render, languageclient, unmount with enforce dispose', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
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
    });

    test.sequential('test render, languageclient, rerender', async () => {
        const code = 'const text = "Hello World!";';
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

        const codeUpdated = 'const text = "Goodbye World!";';
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
            onEditorStartDone={async (editorAppPassed?: EditorApp) => {
                if (editorAppPassed !== undefined) {
                    await expect(editorAppPassed.getEditor()?.getValue()).toBe(codeUpdated);
                }
                deferred2.resolve();
            }}
        />);
        await expect(await deferred2.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('test render, languageclient, rerender with changed config', async () => {
        const code = 'const text = "Hello World!";';
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
            }}
        />);
        await expect(await deferred.promise).toBeUndefined();

        const codeUpdated = 'const text = "Goodbye World!";';
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
            onEditorStartDone={async (editorAppPassed?: EditorApp) => {
                if (editorAppPassed !== undefined) {
                    await expect(editorAppPassed.getEditor()?.getValue()).toBe(codeUpdated);
                }
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

        cleanHtmlBody();
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

        const deferred = new Deferred();
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
                deferred.resolve();
            }}
            modifiedTextValue={codeUpdated} />);
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
    });
});
