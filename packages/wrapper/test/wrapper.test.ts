/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { describe, expect, test, vi } from 'vitest';
import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
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
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
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
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        wrapper.registerTextChangedCallback((textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        });

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await wrapper.updateCodeResources({
            modified: {
                text: 'const text = "Goodbye World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('const text = "Goodbye World";');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Update code resources after start (different file)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await expect(await wrapper.updateCodeResources({
            modified: {
                text: 'const text = "Goodbye World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`,
            }
        })).toBeUndefined();

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('const text = "Goodbye World";');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Verify registerTextChangeCallback', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({});

        const onTextChanged = (textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        };

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        let onTextChangedDiposeable = wrapper.getEditorApp()!['textChangedDiposeables'].modified;
        expect(onTextChangedDiposeable).toBeUndefined();

        wrapper.registerTextChangedCallback(onTextChanged);

        const spyAnnounceModelUpdate = vi.spyOn(wrapper['editorApp'], 'announceModelUpdate');

        await expect(await wrapper.start()).toBeUndefined();

        onTextChangedDiposeable = wrapper.getEditorApp()!['textChangedDiposeables'].modified;
        expect(onTextChangedDiposeable).toBeDefined();

        const spyOnTextChangedDiposeable = vi.spyOn(onTextChangedDiposeable, 'dispose');

        // because there are default models now, the first update of models will not lead to onTextChanged dispoe
        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(1);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(0);

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await wrapper.updateCodeResources({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}_2.statemachine`,
            }
        });

        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(2);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(1);
    });

    test('LanguageClientWrapper Not defined after construction without configuration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('unknown');
        expect(languageClientWrapper).toBeUndefined();
    });

    test('LanguageClientWrapper unreachable rejection handling', async () => {
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
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

        const wrapperConfig2 = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        await expect(await wrapper.initAndStart(wrapperConfig2)).toBeUndefined();
    });

    test('Test html parameter with start', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const htmlContainer = wrapperConfig.htmlContainer;
        wrapperConfig.htmlContainer = undefined;

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        await expect(await wrapper.start(htmlContainer)).toBeUndefined();
    });
});
