/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { createModelReference } from 'vscode/monaco';
import { describe, expect, test } from 'vitest';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
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

        const app = wrapper.getMonacoEditorApp();
        expect(app).toBeDefined();

        const appConfig = app!.getConfig();
        expect(appConfig.overrideAutomaticLayout).toBeTruthy();
    });

    test('Expected throw: Start without init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            await wrapper.start();
        }).rejects.toThrowError('No init was performed. Please call init() before start()');
    });

    test('Expected throw: Call normal start with prior init', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        await expect(async () => {
            const config = createWrapperConfigClassicApp();
            await wrapper.init(config);
            await wrapper.initAndStart(config);
        }).rejects.toThrowError('init was already performed. Please call dispose first if you want to re-start.');
    });

    test('code resources main', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        await wrapper.initAndStart(wrapperConfig);
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
        app?.disposeApp();
    });

    test('code resources original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.modified = undefined;
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(wrapperConfig);
        const app = wrapper.getMonacoEditorApp();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeDefined();
        app?.disposeApp();
    });

    test('code resources main and original', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        const codeResources = wrapperConfig.editorAppConfig?.codeResources ?? {};
        codeResources.original = {
            text: 'original',
            fileExt: 'js'
        };
        await wrapper.initAndStart(wrapperConfig);
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

    test('code resources empty', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig!.codeResources = {};
        await wrapper.initAndStart(wrapperConfig);

        const app = wrapper.getMonacoEditorApp();
        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeUndefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('code resources model direct', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.editorAppConfig!.codeResources = {};
        await wrapper.initAndStart(wrapperConfig);

        const app = wrapper.getMonacoEditorApp();

        // here the modelReference is created manually and given to the updateEditorModels of the wrapper
        const uri = vscode.Uri.parse('/workspace/statemachineUri.statemachine');
        const modelRefModified = await createModelReference(uri, 'text');
        wrapper.updateEditorModels({
            modelRefModified
        });

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();
    });

    test('extended editor disposes extensions', async () => {
        createMonacoEditorDiv();
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigExtendedApp();
        wrapperConfig.extensions = [{
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
        wrapperConfig.editorAppConfig!.codeResources = {};

        await wrapper.init(wrapperConfig);
        const app = wrapper.getMonacoEditorApp();
        const promise = await wrapper.updateCodeResources({
            modified: {
                text: 'blah',
                fileExt: 'statemachine'
            }
        });
        expect(promise).toBeUndefined();
        expect(wrapper.getEditor()).toBeUndefined();
        expect(wrapper.getDiffEditor()).toBeUndefined();

        const modelRefs = app?.getModelRefs();
        expect(modelRefs?.modelRefModified).toBeDefined();
        expect(modelRefs?.modelRefOriginal).toBeUndefined();

        await wrapper.start();
    });

    test('editorConfig semanticHighlighting.enabled workaround', async () => {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();

        wrapperConfig.editorAppConfig!.editorOptions = {
            'semanticHighlighting.enabled': true,
        };
        await wrapper.init(wrapperConfig);
        expect(wrapper.getWrapperConfig()?.vscodeApiConfig?.workspaceConfig?.configurationDefaults?.['editor.semanticHighlighting.enabled']).toEqual(true);

        const semHigh = await new Promise<unknown>(resolve => {
            setTimeout(() => {
                resolve(StandaloneServices.get(IConfigurationService).getValue('editor.semanticHighlighting.enabled'));
            }, 100);
        });
        expect(semHigh).toEqual(true);
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

        await wrapper.initAndStart(wrapperConfig);
        expect(wrapper.isStarted()).toBeTruthy();

        await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                fileExt: 'js',
                enforceLanguageId: 'javascript'
            }
        });

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

        await wrapper.initAndStart(wrapperConfig);
        expect(wrapper.isStarted()).toBeTruthy();

        await wrapper.updateCodeResources({
            modified: {
                text: 'console.log("Goodbye World");',
                uri: '/workspace/main.js'
            }
        });

        const textContents = wrapper.getTextContents();
        expect(textContents?.modified).toEqual('console.log("Goodbye World");');

        expect(wrapper.getEditor()?.getModel()?.getValue()).toEqual('console.log("Goodbye World");');
    });
});
