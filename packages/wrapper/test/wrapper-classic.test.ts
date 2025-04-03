/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { describe, expect, test } from 'vitest';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import { IConfigurationService, StandaloneServices } from '@codingame/monaco-vscode-api';
import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { createMonacoEditorDiv } from './support/helper.js';
import { createWrapperConfigClassicApp } from './support/helper-classic.js';

describe('Test MonacoEditorLanguageClientWrapper (classic)', () => {

    test('Check default values', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const app = wrapper.getEditorApp();
        expect(app).toBeDefined();

        const appConfig = app!.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();
    });

    test('Code resources main', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getEditorApp();

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();
        app?.dispose();
    });

    test('Expected throw: Call normal initAndstart with prior init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
    });

    test('Expected throw: Call normal initAndstart with prior init and automaticallyDispose=false', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            const wrapperConfig = createWrapperConfigClassicApp({
                modified: {
                    text: 'const text = "Hello World!";',
                    uri: `/workspace/${expect.getState().testPath}.js`
                }
            });
            wrapperConfig.automaticallyDispose = false;
            await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
            await wrapper.initAndStart(wrapperConfig);
        }).rejects.toThrowError('You configured the wrapper to not automatically dispose on init, but did not dispose manually. Please call dispose first if you want to re-start.');
    });

    test('Code resources original (regular editor)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            uri: '/workspace/test-code-resources-original-regular-editor.js',
        };
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getEditorApp();

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();
        app?.dispose();
    });

    test('Code resources original (diff editor)', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        wrapperConfig.editorAppConfig!.useDiffEditor = true;
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            uri: '/workspace/test-code-resources-original-diff-editor.js',
        };
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getEditorApp();

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeDefined();
        app?.dispose();
    });

    test('Code resources main and original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'modified',
                uri: `/workspace/${expect.getState().testPath}_modified.js`
            }
        });
        const codeResources = wrapperConfig.editorAppConfig!.codeResources!;
        codeResources.original = {
            text: 'original',
            uri: `/workspace/${expect.getState().testPath}_original.js`
        };
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        const app = wrapper.getEditorApp();

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        // if no diff editor is used, the original modelRef is undefined
        expect(modelRefs?.original).toBeUndefined();

        const name = modelRefs?.modified.object.name;
        const nameOriginal = modelRefs?.original?.object.name;
        expect(name).toBeDefined();
        expect(nameOriginal).toBeUndefined();
        expect(name).not.toEqual(nameOriginal);

        app?.dispose();
    });

    test('Code resources empty', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        wrapperConfig.editorAppConfig!.codeResources = {};
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const app = wrapper.getEditorApp();
        const modelRefs = app?.['modelRefs'];
        // default modelRef is created with regular editor even if no codeResources are given
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();
    });

    test('Code resources model direct', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        wrapperConfig.editorAppConfig!.codeResources = {};
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        wrapper.updateCodeResources({
            modified: {
                text: 'const text = "Hello World!";',
                uri: '/workspace/statemachineUri.statemachine'
            }
        });

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();
    });

    test('Early code resources update on wrapper are ok', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({});

        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();

        wrapper.registerTextChangedCallback((textChanges: TextContents) => {
            expect(textChanges.modified).toEqual('// comment');
        });

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await expect(await wrapper.updateCodeResources({
            modified: {
                text: '// comment',
                uri: '/workspace/test.statemachine',
            }
        })).toBeUndefined();
        expect(wrapper.getEditor()).toBeUndefined();
        expect(wrapper.getDiffEditor()).toBeUndefined();

        const modelRefs = app?.['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();

        await expect(await wrapper.start()).toBeUndefined();
    });

    test('editorConfig semanticHighlighting.enabled workaround', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        wrapperConfig.editorAppConfig!.editorOptions = {
            'semanticHighlighting.enabled': true,
        };
        await expect(await wrapper.init(wrapperConfig)).toBeUndefined();
        expect(wrapper.getWrapperConfig()?.vscodeApiConfig?.workspaceConfig?.configurationDefaults?.['editor.semanticHighlighting.enabled']).toEqual(true);

        const semHigh = await new Promise<unknown>(resolve => {
            setTimeout(() => {
                resolve(StandaloneServices.get(IConfigurationService).getValue('editor.semanticHighlighting.enabled'));
            }, 100);
        });
        expect(semHigh).toEqual(true);
    });

    test('Check current model is globally removed after dispose', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "test";',
                uri: `/workspace/${expect.getState().testPath}_single-model.js`
            }
        });
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const currentModel = wrapper.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeTruthy();
        wrapper.getEditor()?.getModel()!.dispose();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeFalsy();
    });

    test('Check current model is globally removed after dispose (second model)', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "test";',
                uri: `/workspace/${expect.getState().testPath}_second-model.js`
            }
        });
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        const currentModel = wrapper.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeTruthy();

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        await wrapper.updateCodeResources({
            modified: {
                text: 'const text = "test 2";',
                uri: `/workspace/${expect.getState().testPath}_second-model_2.js`
            }
        });
        const currentModelMod = wrapper.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModelMod!)).toBeTruthy();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeFalsy();
    });

});
