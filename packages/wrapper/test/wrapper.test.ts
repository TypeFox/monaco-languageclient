/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test, vi } from 'vitest';

import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { createDefaultLcUnreachableUrlConfig, createMewModelReference, createMonacoEditorDiv, createWrapperConfigExtendedApp } from './support/helper.js';

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
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(await wrapper.dispose()).toBeUndefined();
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
    });

    test('Update code resources after start (fileExt)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.editorAppConfig!.codeResources = {
            modified: {
                text: 'console.log("Hello World");',
                fileExt: 'js',
                enforceLanguageId: 'javascript'
            }
        };

        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        expect(await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                fileExt: 'js',
                enforceLanguageId: 'javascript'
            }
        })).toBeUndefined();

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('console.log("Goodbye World");');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('console.log("Goodbye World");');
    });

    test('Update code resources after start (uri)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.editorAppConfig!.codeResources = {
            modified: {
                text: 'console.log("Hello World");',
                uri: '/workspace/main.js',
            }
        };

        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        expect(await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                uri: '/workspace/main.js'
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

        expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        // eslint-disable-next-line dot-notation
        const disposableStoreMonaco = wrapper['disposableStoreMonaco'];
        expect(disposableStoreMonaco).toBeDefined();

        wrapper.registerTextChangeCallback(onTextChanged);

        // eslint-disable-next-line dot-notation
        const spyModelUpdateCallback = vi.spyOn(wrapper['editorApp'], 'modelUpdateCallback');
        const spyDisposableStoreMonaco = vi.spyOn(disposableStoreMonaco, 'clear');

        expect(await wrapper.start()).toBeUndefined();

        expect(spyModelUpdateCallback).toHaveBeenCalledTimes(1);
        expect(spyDisposableStoreMonaco).toHaveBeenCalledTimes(1);

        wrapper.updateEditorModels({
            modelRefModified: await createMewModelReference()
        });

        expect(spyModelUpdateCallback).toHaveBeenCalledTimes(2);
        expect(spyDisposableStoreMonaco).toHaveBeenCalledTimes(2);
    });

    test('LanguageClientWrapper Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(await wrapper.init(createWrapperConfigExtendedApp())).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('LanguageClientWrapper constructor config works', async () => {
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            automaticallyInit: true,
            automaticallyStart: true,
            automaticallyDispose: true,
            configs: {
                javascript: createDefaultLcUnreachableUrlConfig()
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(await wrapper.init(config)).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();
    });

    test('LanguageClientWrapper unreachable rejection handling', async () => {
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            automaticallyInit: true,
            automaticallyStart: true,
            automaticallyDispose: true,
            configs: {
                javascript: createDefaultLcUnreachableUrlConfig()
            }
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.initAndStart(config);
        }).rejects.toEqual({
            message: 'languageClientWrapper (test-ws-unreachable): Websocket connection failed.',
            error: 'No error was provided.'
        });

        expect(wrapper.isInitializing()).toBeFalsy();
        expect(wrapper.isStarting()).toBeFalsy();
        expect(wrapper.isStopping()).toBeFalsy();

        expect(await wrapper.dispose()).toBeUndefined();

        expect(wrapper.isInitializing()).toBeFalsy();
        expect(wrapper.isStarting()).toBeFalsy();
        expect(wrapper.isStopping()).toBeFalsy();

        const config2 = createWrapperConfigExtendedApp();
        expect(await wrapper.initAndStart(config2)).toBeUndefined();
    });

    test('Test html parameter with start', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        const htmlContainer = wrapperConfig.htmlContainer;
        wrapperConfig.htmlContainer = undefined;

        expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        expect(await wrapper.start(htmlContainer)).toBeUndefined();
    });
});
