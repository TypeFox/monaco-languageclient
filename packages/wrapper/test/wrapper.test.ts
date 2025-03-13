/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test, vi } from 'vitest';
import { buildModelReference, MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { createDefaultLcUnreachableUrlConfig, createMonacoEditorDiv, createWrapperConfigExtendedApp } from './support/helper.js';

describe('Test MonacoEditorLanguageClientWrapper', () => {

    test('New wrapper has undefined editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.haveLanguageClients()).toBeFalsy();
        expect(wrapper.getEditor()).toBeUndefined();
    });

    test('New wrapper has undefined diff editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.getDiffEditor()).toBeUndefined();
    });

    test('Expected throw: Start without init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.start();
        }).rejects.toThrowError('No init was performed. Please call init() before start()');
    });

    test('extended editor disposes extensions', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.extensions = [{
            config: {
                name: 'unit-test-extension',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                },
                contributes: {
                    languages: [{
                        id: 'js',
                        extensions: ['.js'],
                        configuration: './language-configuration.json'
                    }],
                    grammars: [{
                        language: 'js',
                        scopeName: 'source.js',
                        path: './javascript.tmLanguage.json'
                    }]
                }
            },
            filesOrContents: new Map([
                ['/language-configuration.json', '{}'],
                ['/javascript.tmLanguage.json', '{}']
            ]),
        }];
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        await expect(await wrapper.dispose()).toBeUndefined();
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
    });

    test('Update code resources after start (same file)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.editorAppConfig!.codeResources = {
            modified: {
                text: 'console.log("Hello World");',
                uri: '/workspace/test.js',
                enforceLanguageId: 'javascript'
            }
        };

        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        wrapper.registerTextChangeCallback((textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        });

        await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                uri: '/workspace/test2.js',
                enforceLanguageId: 'javascript'
            }
        });

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('console.log("Goodbye World");');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('console.log("Goodbye World");');
    });

    test('Update code resources after start (different file)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.editorAppConfig!.codeResources = {
            modified: {
                text: 'console.log("Hello World");',
                uri: '/workspace/main.js',
            }
        };

        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        await expect(await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                uri: '/workspace/main2.js'
            }
        })).toBeUndefined();

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('console.log("Goodbye World");');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('console.log("Goodbye World");');
    });

    test('Verify registerTextChangeCallback', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();

        const onTextChanged = (textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        };

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        // eslint-disable-next-line dot-notation
        const disposableStoreMonaco = wrapper['disposableStoreMonaco'];
        expect(disposableStoreMonaco).toBeDefined();

        wrapper.registerTextChangeCallback(onTextChanged);

        // eslint-disable-next-line dot-notation
        const spyModelUpdateCallback = vi.spyOn(wrapper['editorApp'], 'modelUpdateCallback');
        const spyDisposableStoreMonaco = vi.spyOn(disposableStoreMonaco, 'clear');

        await expect(await wrapper.start()).toBeUndefined();

        expect(spyModelUpdateCallback).toHaveBeenCalledTimes(1);
        expect(spyDisposableStoreMonaco).toHaveBeenCalledTimes(1);

        const codeContent = {
            text: 'console.log("Hello World!");',
            uri: '/workspace/statemachineUri.statemachine'
        };
        const modelRefModified = await buildModelReference(codeContent);

        wrapper.updateEditorModels({
            modelRefModified
        });

        expect(spyModelUpdateCallback).toHaveBeenCalledTimes(2);
        expect(spyDisposableStoreMonaco).toHaveBeenCalledTimes(2);
    });

    test('LanguageClientWrapper Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();

        await expect(await wrapper.init(createWrapperConfigExtendedApp())).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('LanguageClientWrapper unreachable rejection handling', async () => {
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.languageClientConfigs = {
            configs: {
                javascript: createDefaultLcUnreachableUrlConfig(12345)
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();

        try {
            await wrapper.start();
        } catch (_error) {
            // ignore
        };

        expect(wrapper.isInitializing()).toBeFalsy();
        expect(wrapper.isStarting()).toBeFalsy();
        expect(wrapper.isDisposing()).toBeFalsy();

        await expect(await wrapper.dispose()).toBeUndefined();

        expect(wrapper.isInitializing()).toBeFalsy();
        expect(wrapper.isStarting()).toBeFalsy();
        expect(wrapper.isDisposing()).toBeFalsy();

        const wrapperConfig2 = createWrapperConfigExtendedApp();
        await expect(await wrapper.initAndStart(wrapperConfig2)).toBeUndefined();
    });

    test('Test html parameter with start', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        const htmlContainer = wrapperConfig.htmlContainer;
        wrapperConfig.htmlContainer = undefined;

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        await expect(await wrapper.start(htmlContainer)).toBeUndefined();
    });
});
