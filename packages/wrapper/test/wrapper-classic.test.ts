/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';

import { IConfigurationService, StandaloneServices } from '@codingame/monaco-vscode-api';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createMewModelReference, createMonacoEditorDiv } from './support/helper.js';
import { createWrapperConfigClassicApp } from './support/helper-classic.js';

describe('Test MonacoEditorLanguageClientWrapper', () => {

    test('Check default values', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(await wrapper.initAndStart(createWrapperConfigClassicApp())).toBeUndefined();

        const app = wrapper.getMonacoEditorApp();
        expect(app).toBeDefined();

        const appConfig = app!.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();
    });

    test('Code resources main', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
        app?.disposeApp();
    });

    test('Expected throw: Call normal start with prior init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            const config = createWrapperConfigClassicApp();
            expect(await wrapper.init(config)).toBeUndefined();
            await wrapper.initAndStart(config);
        }).rejects.toThrowError('init was already performed. Please call dispose first if you want to re-start.');
    });

    test('Code resources original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();
        app?.disposeApp();
    });

    test('Code resources main and original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();

        const name = modelRefs?.modelRefModified?.object.name;
        const nameOriginal = modelRefs?.modelRefOriginal?.object.name;
        expect(name).toBeDefined();
        expect(nameOriginal).toBeDefined();
        expect(name).not.toEqual(nameOriginal);

        app?.disposeApp();
    });

    test('Code resources empty', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig!.codeResources = {};
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const app = wrapper.getMonacoEditorApp();
        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('Code resources model direct', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig!.codeResources = {};
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const app = wrapper.getMonacoEditorApp();

        // here the modelReference is created manually and given to the updateEditorModels of the wrapper
        wrapper.updateEditorModels({
            modelRefModified: await createMewModelReference()
        });

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('Early code resources update on wrapper are ok', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig!.codeResources = {};

        expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        const app = wrapper.getMonacoEditorApp();
        expect(await wrapper.updateCodeResources({
            modified: {
                text: 'blah',
                fileExt: 'statemachine'
            }
        })).toBeUndefined();
        expect(wrapper.getEditor()).toBeUndefined();
        expect(wrapper.getDiffEditor()).toBeUndefined();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();

        expect(await wrapper.start()).toBeUndefined();
    });

    test('editorConfig semanticHighlighting.enabled workaround', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();

        wrapperConfig.editorAppConfig!.editorOptions = {
            'semanticHighlighting.enabled': true,
        };
        expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        expect(wrapper.getWrapperConfig()?.vscodeApiConfig?.workspaceConfig?.configurationDefaults?.['editor.semanticHighlighting.enabled']).toEqual(true);

        const semHigh = await new Promise<unknown>(resolve => {
            setTimeout(() => {
                resolve(StandaloneServices.get(IConfigurationService).getValue('editor.semanticHighlighting.enabled'));
            }, 100);
        });
        expect(semHigh).toEqual(true);
    });
});
