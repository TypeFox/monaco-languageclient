/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { EditorAppClassic, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createBaseConfig, createMonacoEditorDiv } from './helper.js';

describe('Test MonacoEditorLanguageClientWrapper', () => {

    test('New wrapper has undefined editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.getEditor()).toBeUndefined();
    });

    test('New wrapper has undefined diff editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.getDiffEditor()).toBeUndefined();
    });

    test('Check default values', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.initAndStart(createBaseConfig('classic'), document.getElementById('monaco-editor-root'));

        const app = wrapper.getMonacoEditorApp() as EditorAppClassic;
        expect(app).toBeDefined();

        const appConfig = app.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();
        expect(appConfig.theme).toBe('vs-light');
    });

    test('No HTML in Userconfig', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.initAndStart(createBaseConfig('classic'), null);
        }).rejects.toThrowError('No HTMLElement provided for monaco-editor.');
    });

    test('Expected throw: Start without init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.start(document.getElementById('monaco-editor-root'));
        }).rejects.toThrowError('No init was performed. Please call init() before start()');
    });

    test('Expected throw: Call normal start with prior init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            const config = createBaseConfig('classic');
            await wrapper.init(config);
            await wrapper.initAndStart(config, document.getElementById('monaco-editor-root'));
        }).rejects.toThrowError('init was already performed. Please call dispose first if you want to re-start.');
    });

    test('Test if ', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfigClassic = createBaseConfig('classic');
        wrapper.init(userConfigClassic);
        expect(wrapper.isReInitRequired(userConfigClassic, userConfigClassic)).toBeFalsy();

        const userConfigExtended = createBaseConfig('extended');
        expect(wrapper.isReInitRequired(userConfigClassic, userConfigExtended)).toBeTruthy();

        const userConfigClassicNew = createBaseConfig('classic');
        userConfigClassicNew.wrapperConfig.editorAppConfig.useDiffEditor = true;

        expect(wrapper.isReInitRequired(userConfigClassicNew, userConfigClassic)).toBeTruthy();
    });
});
