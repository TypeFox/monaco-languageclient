/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { createModelReference } from 'vscode/monaco';
import { describe, expect, test } from 'vitest';
import { isReInitRequired, EditorAppClassic, EditorAppConfigExtended, MonacoEditorLanguageClientWrapper, EditorAppConfigClassic } from 'monaco-editor-wrapper';
import { createMonacoEditorDiv, createWrapperConfigClassicApp, createWrapperConfigExtendedApp } from './helper.js';
import { IConfigurationService, StandaloneServices } from 'vscode/services';

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

    test('Check default values', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await wrapper.initAndStart(createWrapperConfigClassicApp());

        const app = wrapper.getMonacoEditorApp() as EditorAppClassic;
        expect(app).toBeDefined();

        const appConfig = app.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();
    });

    test('Expected throw: Start without init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(async () => {
            await wrapper.start();
        }).rejects.toThrowError('No init was performed. Please call init() before start()');
    });

    test('Expected throw: Call normal start with prior init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(async () => {
            const config = createWrapperConfigClassicApp();
            await wrapper.init(config);
            await wrapper.initAndStart(config);
        }).rejects.toThrowError('init was already performed. Please call dispose first if you want to re-start.');
    });

    test('Verify if configuration changes make re-init necessary', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfigClassic = createWrapperConfigClassicApp();
        wrapper.init(wrapperConfigClassic);
        const app = wrapper.getMonacoEditorApp();
        expect(app).toBeDefined();
        if (app) {
            expect(isReInitRequired(app, wrapperConfigClassic.editorAppConfig, wrapperConfigClassic.editorAppConfig)).toBeFalsy();

            const wrapperConfigExtended = createWrapperConfigExtendedApp();
            expect(isReInitRequired(app, wrapperConfigClassic.editorAppConfig, wrapperConfigExtended.editorAppConfig)).toBeTruthy();

            const wrapperConfigClassicNew = createWrapperConfigClassicApp();
            wrapperConfigClassicNew.editorAppConfig.useDiffEditor = true;

            expect(isReInitRequired(app, wrapperConfigClassicNew.editorAppConfig, wrapperConfigClassic.editorAppConfig)).toBeTruthy();
        }
    });

    test('code resources main', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const userConfig = createWrapperConfigClassicApp();
        await wrapper.initAndStart(userConfig);
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
        app?.disposeApp();
    });

    test('code resources original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        let codeResources = wrapperConfig.editorAppConfig.codeResources;
        if (!codeResources) {
            codeResources = {};
        }
        codeResources.main = undefined;
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(wrapperConfig);
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();
        app?.disposeApp();
    });

    test('code resources main and original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        let codeResources = wrapperConfig.editorAppConfig.codeResources;
        if (!codeResources) {
            codeResources = {};
        }
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(wrapperConfig);
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
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig.codeResources = {};
        await wrapper.initAndStart(wrapperConfig);

        const app = wrapper.getMonacoEditorApp();
        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRef).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('code resources model direct', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig.codeResources = {};
        await wrapper.initAndStart(wrapperConfig);

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
        const wrapperConfig = createWrapperConfigExtendedApp();
        (wrapperConfig.editorAppConfig as EditorAppConfigExtended).extensions = [{
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
        await wrapper.initAndStart(wrapperConfig);
        await wrapper.dispose();
        await wrapper.initAndStart(wrapperConfig);
    });

    test('Early code resources update on wrapper are ok', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig.codeResources = {};

        await wrapper.init(wrapperConfig);
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

        await wrapper.start();
    });

    test('config userConfiguration', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        (wrapperConfig.editorAppConfig as EditorAppConfigClassic).editorOptions = {
            'semanticHighlighting.enabled': true,
        };
        const updatedWrapperConfig = await wrapper.init(wrapperConfig);
        expect(updatedWrapperConfig.vscodeApiConfig?.workspaceConfig?.configurationDefaults?.['editor.semanticHighlighting.enabled']).toEqual(true);

        // why is this configuredByTheme?
        const semHigh = StandaloneServices.get(IConfigurationService).getValue('editor.semanticHighlighting.enabled');
        expect(semHigh).toEqual('configuredByTheme');
    });
});
