/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { createModelReference } from 'vscode/monaco';
import { describe, expect, test } from 'vitest';
import { isReInitRequired, EditorAppClassic, EditorAppConfigExtended, MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { createBaseConfig, createMonacoEditorDiv } from './helper.js';

describe('Test MonacoEditorLanguageClientWrapper', () => {

    test('New wrapper has undefined editor', () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(wrapper.haveLanguageClient()).toBeFalsy();
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

    test('Verify if configuration changes make re-init necessary', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfigClassic = createBaseConfig('classic');
        wrapper.init(userConfigClassic);
        const app = wrapper.getMonacoEditorApp();
        expect(app).toBeDefined();
        if (app) {
            expect(isReInitRequired(app, userConfigClassic, userConfigClassic)).toBeFalsy();

            const userConfigExtended = createBaseConfig('extended');
            expect(isReInitRequired(app, userConfigClassic, userConfigExtended)).toBeTruthy();

            const userConfigClassicNew = createBaseConfig('classic');
            userConfigClassicNew.wrapperConfig.editorAppConfig.useDiffEditor = true;

            expect(isReInitRequired(app, userConfigClassicNew, userConfigClassic)).toBeTruthy();
        }
    });

    test('code resources main', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
        app?.disposeApp();
    });

    test('code resources original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        let codeResources = userConfig.wrapperConfig.editorAppConfig.codeResources;
        if (!codeResources) {
            codeResources = {};
        }
        codeResources.main = undefined;
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();
        app?.disposeApp();
    });

    test('code resources main and original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        let codeResources = userConfig.wrapperConfig.editorAppConfig.codeResources;
        if (!codeResources) {
            codeResources = {};
        }
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();

        const name = modelRefs?.modelRef?.object.name;
        const nameOriginal = modelRefs?.modelRefOriginal?.object.name;
        expect(name).toBeDefined();
        expect(nameOriginal).toBeDefined();
        expect(name).not.toEqual(nameOriginal);

        app?.disposeApp();
    });

    test('code resources empty', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        userConfig.wrapperConfig.editorAppConfig.codeResources = {};
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));

        const app = wrapper.getMonacoEditorApp();
        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('code resources model direct', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        userConfig.wrapperConfig.editorAppConfig.codeResources = {};
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));

        const app = wrapper.getMonacoEditorApp();

        // here the modelReference is created manually and given to the updateEditorModels of the wrapper
        const uri = vscode.Uri.parse('/workspace/statemachineUri.statemachine');
        const modelRef = await createModelReference(uri, 'text');
        wrapper.updateEditorModels({
            modelRef
        });

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    /**
     * Test does not work headlessly on Linux/CI that's why it is currently skipped
     */
    test.skip('extended editor disposes extensions', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('extended');
        (userConfig.wrapperConfig.editorAppConfig as EditorAppConfigExtended).extensions = [{
            config: {
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
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));
        await wrapper.dispose();
        await wrapper.initAndStart(userConfig, document.getElementById('monaco-editor-root'));
    });

    test('Early code resources update on wrapper are ok', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createBaseConfig('classic');
        userConfig.wrapperConfig.editorAppConfig.codeResources = {};

        await wrapper.init(userConfig);
        const app = wrapper.getMonacoEditorApp();
        const promise = await wrapper.updateCodeResources({
            main: {
                text: 'blah',
                fileExt: 'statemachine'
            }
        });
        expect(promise).toBeUndefined();
        expect(wrapper.getEditor()).toBeUndefined();
        expect(wrapper.getDiffEditor()).toBeUndefined();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();

        await wrapper.start(document.getElementById('monaco-editor-root'));
    });

});
