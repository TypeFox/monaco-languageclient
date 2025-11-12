/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { render } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { Deferred, delayExecution } from 'monaco-languageclient/common';
import type { EditorApp } from 'monaco-languageclient/editorApp';
import type { LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React from 'react';
import { describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig, createDefaultLanguageClientConfig, unmountDelayMs } from './support/helper.js';

describe.sequential('Test MonacoEditorReactComp: Langugae Client', () => {

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService'
        }
    };
    const code = 'const text = "Hello World!";';
    const codeUpdated = 'const text = "Goodbye World!";';

    test('test render, languageclient, manual clean-up', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig(false);

        const deferred = new Deferred();
        let lcsManager: LanguageClientManager | undefined;
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed: LanguageClientManager) => {
                lcsManager = lcsManagerPassed;
                deferred.resolve();
            }}
        />);
        await expect(await deferred.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        lcsManager?.dispose(true);
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('test render, languageclient, unmount with enforce dispose', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig(false);

        let lcsManager: LanguageClientManager | undefined;
        const deferred = new Deferred();
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed: LanguageClientManager) => {
                lcsManager = lcsManagerPassed;
                deferred.resolve();
            }}
        />);
        await expect(await deferred.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        const deferredLc = new Deferred();
        const languageClientConfig2 = createDefaultLanguageClientConfig(true);
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig2}
            onDisposeLanguageClient={() => deferredLc.resolve()}
        />);
        await expect(await deferredLc.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.haveLanguageClient()).toBeFalsy();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeFalsy();

        lcsManager?.dispose(true);
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('test render, languageclient, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig(false);

        const deferredLc = new Deferred();
        let lcsManager: LanguageClientManager | undefined;
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed: LanguageClientManager) => {
                lcsManager = lcsManagerPassed;
                deferredLc.resolve();
            }}
        />);
        await expect(await deferredLc.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

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

        lcsManager?.dispose(true);
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

    test('test render, languageclient, rerender with changed config', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig(false);

        const deferredLc = new Deferred();
        const deferredEditor = new Deferred();
        let lcsManager: LanguageClientManager | undefined;
        const renderResult = render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={(lcsManagerPassed: LanguageClientManager) => {
                lcsManager = lcsManagerPassed;
                expect(lcsManager.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();
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
        const languageClientConfigs2 = createDefaultLanguageClientConfig(false);
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

        const languageClientConfigs3 = createDefaultLanguageClientConfig(true);
        const deferred3 = new Deferred();
        // you have to enforce dispose of the LanguageClient if you want to restart with new configuration
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfigs3}
            style={{ 'height': '800px' }}
            onDisposeLanguageClient={() => deferred3.resolve()}
        />);
        await expect(await deferred3.promise).toBeUndefined();

        const languageClientConfigs4 = createDefaultLanguageClientConfig(false);
        languageClientConfigs4.clientOptions.markdown = {
            supportHtml: true
        };
        const deferred4 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfigs4}
            style={{ 'height': '800px' }}
            onLanguageClientsStartDone={() => deferred4.resolve()}
        />);
        await expect(await deferred4.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        lcsManager?.dispose(true);
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(unmountDelayMs);
    });

});
