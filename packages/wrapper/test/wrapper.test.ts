/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { beforeAll, describe, expect, test, vi } from 'vitest';
import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv, createWrapperConfigExtendedApp } from './support/helper.js';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

describe('Test MonacoEditorLanguageClientWrapper', () => {

    const htmlContainer = createMonacoEditorDiv();

    beforeAll(async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig(htmlContainer);
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.init();
    });

    test('New wrapper has undefined editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.getEditor()).toBeUndefined();
    });

    test('New wrapper has undefined diff editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.getDiffEditor()).toBeUndefined();
    });

    test('Expected throw: Start without init', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.start(htmlContainer);
        }).rejects.toThrowError('No init was performed. Please call init() before start()');
    });

    test('Update code resources after start (same file)', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.initAndStart(wrapperConfig, htmlContainer)).toBeUndefined();
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

        const textModels = wrapper.getTextModels();
        expect(textModels?.modified?.getValue()).toEqual('const text = "Goodbye World";');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Update code resources after start (different file)', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.initAndStart(wrapperConfig, htmlContainer)).toBeUndefined();
        expect(wrapper.isStarted()).toBeTruthy();

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await expect(await wrapper.updateCodeResources({
            modified: {
                text: 'const text = "Goodbye World";',
                uri: `/workspace/${expect.getState().testPath}_2.js`,
            }
        })).toBeUndefined();

        const textModels = wrapper.getTextModels();
        expect(textModels?.modified?.getValue()).toEqual('const text = "Goodbye World";');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('const text = "Goodbye World";');
    });

    test('Verify registerTextChangeCallback', async () => {
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

        await expect(await wrapper.start(htmlContainer)).toBeUndefined();

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

    test('Test wrapper init/start/dispose phase promises', async () => {
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const wrapper = new MonacoEditorLanguageClientWrapper();

        await expect(await wrapper.initAndStart(wrapperConfig, htmlContainer)).toBeUndefined();
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
        await expect(await wrapper.initAndStart(wrapperConfig2, htmlContainer)).toBeUndefined();
    });

    test('Test html parameter with start', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp({
            modified: {
                text: 'const text = "Hello World";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        await expect(await wrapper.start(htmlContainer)).toBeUndefined();
    });

});
