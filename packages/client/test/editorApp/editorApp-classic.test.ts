/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { EditorApp, type TextContents } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { beforeAll, describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createEditorAppConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('Test Test EditorApp (classic)', () => {

    const htmlContainer = createMonacoEditorDiv();
    const apiConfig = createDefaultMonacoVscodeApiConfig('classic', htmlContainer);

    beforeAll(async () => {
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.start();
    });

    test('classic type: empty EditorAppConfigClassic', () => {
        const editorAppConfig = createEditorAppConfig({});
        expect(editorAppConfig.editorOptions).toStrictEqual({});
        expect(apiConfig.$type).toBe('classic');
    });

    test('config defaults', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.id = 'test-config-defaults';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().codeResources?.modified?.text).toEqual('const text = "Hello World!";');
        expect(editorApp.getConfig().codeResources?.original).toBeUndefined();
        expect(editorApp.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(editorApp.getConfig().readOnly).toBeFalsy();
        expect(editorApp.getConfig().domReadOnly).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting=false', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig!.editorOptions!['semanticHighlighting.enabled'] = false;
        editorAppConfig.id = 'test-semanticHighlighting-false';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeFalsy();
    });

    test('editorOptions: semanticHighlighting="configuredByTheme"', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig!.editorOptions!['semanticHighlighting.enabled'] = 'configuredByTheme';
        editorAppConfig.id = 'test-semanticHighlighting-theme';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toEqual('configuredByTheme');
    });

    test('editorOptions: semanticHighlighting=true', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig!.editorOptions!['semanticHighlighting.enabled'] = true;
        editorAppConfig.id = 'test-semanticHighlighting-true';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().editorOptions?.['semanticHighlighting.enabled']).toBeTruthy();
    });

    test('Check default values', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        expect(editorApp).toBeDefined();

        const appConfig = editorApp!.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();

        await editorApp.dispose();
    });

    test('Code resources main', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const modelRefs = editorApp['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();

        await editorApp.dispose();
    });

    test('Call start twice without prior disposal', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        await expect(async () => {
            await editorApp.start(htmlContainer);
        }).rejects.toThrowError('Start was called without properly disposing the EditorApp first.');

        await editorApp.dispose();
    });

    test('Call start twice with prior disposal', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        await editorApp.dispose();
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        await editorApp.dispose();
    });

    test('Code resources original (regular editor)', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const codeResources = editorAppConfig.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            uri: '/workspace/test-code-resources-original-regular-editor.js',
        };

        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const modelRefs = editorApp['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();
        await editorApp.dispose();
    });

    test('Code resources original (diff editor)', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.useDiffEditor = true;
        const codeResources = editorAppConfig.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            uri: '/workspace/test-code-resources-original-diff-editor.js',
        };
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const modelRefs = editorApp['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeDefined();
        await editorApp.dispose();
    });

    test('Code resources main and original', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'modified',
                uri: `/workspace/${expect.getState().testPath}_modified.js`
            }
        });
        const codeResources = editorAppConfig.codeResources!;
        codeResources.original = {
            text: 'original',
            uri: `/workspace/${expect.getState().testPath}_original.js`
        };
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const modelRefs = editorApp['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        // if no diff editor is used, the original modelRef is undefined
        expect(modelRefs?.original).toBeUndefined();

        const name = modelRefs?.modified.object.name;
        const nameOriginal = modelRefs?.original?.object.name;
        expect(name).toBeDefined();
        expect(nameOriginal).toBeUndefined();
        expect(name).not.toEqual(nameOriginal);

        await editorApp.dispose();
    });

    test('Code resources empty', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.codeResources = {};
        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const modelRefs = editorApp['modelRefs'];
        // default modelRef is created with regular editor even if no codeResources are given
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();

        await editorApp.dispose();
    });

    test('Code resources model direct', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.codeResources = {};
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        editorApp.setModelRefDisposeTimeout(1000);

        editorApp.updateCodeResources({
            modified: {
                text: 'const text = "Hello World!";',
                uri: '/workspace/statemachineUri.statemachine'
            }
        });

        const modelRefs = editorApp['modelRefs'];
        expect(modelRefs?.modified).toBeDefined();
        expect(modelRefs?.original).toBeUndefined();

        await editorApp.dispose();
    });

    test('Early code resources update on editorApp are ok', async () => {
        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);

        editorApp.setModelRefDisposeTimeout(1000);

        expect(editorApp.getEditor()).toBeUndefined();
        expect(editorApp.getDiffEditor()).toBeUndefined();

        const modelRefsBefore = editorApp['modelRefs'];
        expect(modelRefsBefore?.modified).toBeUndefined();
        expect(modelRefsBefore?.original).toBeUndefined();

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        editorApp.registerOnTextChangedCallback((textChanges: TextContents) => {
            console.log(textChanges);
            expect(textChanges.modified).toEqual('// comment');
        });

        await expect(await editorApp.updateCodeResources({
            modified: {
                text: '// comment',
                uri: '/workspace/test.statemachine',
            }
        })).toBeUndefined();

        const modelRefsAfter = editorApp['modelRefs'];
        expect(modelRefsAfter?.modified).toBeDefined();
        expect(modelRefsAfter?.original).toBeUndefined();

        await editorApp.dispose();
    });

    test('Check current model is globally removed after dispose', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "test";',
                uri: `/workspace/${expect.getState().testPath}_single-model.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const currentModel = editorApp.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeTruthy();
        editorApp.getEditor()?.getModel()!.dispose();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeFalsy();

        await editorApp.dispose();
    });

    test('Check current model is globally removed after dispose (second model)', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: 'const text = "test";',
                uri: `/workspace/${expect.getState().testPath}_second-model.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        const currentModel = editorApp.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeTruthy();

        editorApp.setModelRefDisposeTimeout(1000);

        await editorApp.updateCodeResources({
            modified: {
                text: 'const text = "test 2";',
                uri: `/workspace/${expect.getState().testPath}_second-model_2.js`
            }
        });
        const currentModelMod = editorApp.getEditor()?.getModel();
        expect(monaco.editor.getModels().includes(currentModelMod!)).toBeTruthy();
        expect(monaco.editor.getModels().includes(currentModel!)).toBeFalsy();

        await editorApp.dispose();
    });

});
