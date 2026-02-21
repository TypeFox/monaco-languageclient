/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { render } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { Deferred, delayExecution } from 'monaco-languageclient/common';
import type { LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React from 'react';
import { describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig, createDefaultLanguageClientConfig, hundredMs } from './support/helper.js';

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
        const languageClientConfig = createDefaultLanguageClientConfig();

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
        expect(await deferred.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        await delayExecution(hundredMs);
        try {
            await lcsManager?.dispose(true);
        } catch (error) {
            console.log('Error during manual dispose of LanguageClientManager:', error);
        }
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(hundredMs);
    });

    test('test render, languageclient, unmount with enforce dispose', async () => {
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
            onLanguageClientsStartDone={(lcsManagerPassed: LanguageClientManager) => {
                lcsManager = lcsManagerPassed;
                deferred.resolve();
            }}
        />);
        expect(await deferred.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        const deferredLc = new Deferred();
        const languageClientConfig2 = createDefaultLanguageClientConfig();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfig2}
            enforceLanguageClientDispose={true}
            onDisposeLanguageClient={() => deferredLc.resolve()}
        />);
        expect(await deferredLc.promise).toBeUndefined();

        expect(lcsManager?.getLanguageClientWrapper('langium')?.haveLanguageClient()).toBeFalsy();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeFalsy();

        await delayExecution(hundredMs);
        try {
            await lcsManager?.dispose(true);
        } catch (error) {
            console.log('Error during manual dispose of LanguageClientManager:', error);
        }
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(hundredMs);
    });

    test('test render, languageclient, rerender', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig();

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
        expect(await deferredLc.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        const editorAppConfig2 = createDefaultEditorAppConfig({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const deferred2 = new Deferred();
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig2}
            languageClientConfig={languageClientConfig}
            style={{ 'height': '800px' }}
            triggerReprocessConfig={1}
            onConfigProcessed={async (result) => {
                expect(result.textUpdated).toBe(true);
                expect(result.editorApp).toBeDefined();
                await delayExecution(hundredMs);
                expect(result.editorApp?.getEditor()?.getValue()).toBe(codeUpdated);
                deferred2.resolve();
            }}
        />);
        expect(await deferred2.promise).toBeUndefined();

        await delayExecution(hundredMs);
        try {
            await lcsManager?.dispose(true);
        } catch (error) {
            console.log('Error during manual dispose of LanguageClientManager:', error);
        }
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(hundredMs);
    });

    test('test render, languageclient, rerender with changed config', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const languageClientConfig = createDefaultLanguageClientConfig();

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
                uri: `/workspace/${expect.getState().testPath}.js`
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
            triggerReprocessConfig={1}
            onConfigProcessed={async (result) => {
                expect(result.textUpdated).toBe(true);
                expect(result.editorApp).toBeDefined();
                await delayExecution(hundredMs);
                expect(result.editorApp?.getEditor()?.getValue()).toBe(codeUpdated);
                deferred2.resolve();
            }}
            onError={(error) => {
                expect(error.message).toEqual('A languageclient config with id "langium" already exists and you confiured to not override.');
            }}
        />);
        expect(await deferred2.promise).toBeUndefined();

        const languageClientConfigs3 = createDefaultLanguageClientConfig();
        const deferred3 = new Deferred();
        // you have to enforce dispose of the LanguageClient if you want to restart with new configuration
        renderResult.rerender(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            languageClientConfig={languageClientConfigs3}
            style={{ 'height': '800px' }}
            enforceLanguageClientDispose={true}
            onDisposeLanguageClient={() => deferred3.resolve()}
        />);
        expect(await deferred3.promise).toBeUndefined();

        const languageClientConfigs4 = createDefaultLanguageClientConfig();
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
        expect(await deferred4.promise).toBeUndefined();
        expect(lcsManager?.getLanguageClientWrapper('langium')?.isStarted()).toBeTruthy();

        await delayExecution(hundredMs);
        try {
            await lcsManager?.dispose(true);
        } catch (error) {
            console.log('Error during manual dispose of LanguageClientManager:', error);
        }
        renderResult.unmount();
        cleanHtmlBody();
        await delayExecution(hundredMs);
    });

});
