/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { createModelReference } from '@codingame/monaco-vscode-api/monaco';
import { describe, expect, test, vi } from 'vitest';
import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { createDefaultLcUnreachableUrlConfig, createMonacoEditorDiv, createWrapperConfigClassicApp, createWrapperConfigExtendedApp } from './helper.js';
import { IConfigurationService, StandaloneServices } from '@codingame/monaco-vscode-api';

const createMewModelReference = async () => {
    const uri = vscode.Uri.parse('/workspace/statemachineUri.statemachine');
    return await createModelReference(uri, 'text');
};

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
        expect(await wrapper.initAndStart(createWrapperConfigClassicApp())).toBeUndefined();

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
            expect(await wrapper.init(config)).toBeUndefined();
            await wrapper.initAndStart(config);
        }).rejects.toThrowError('init was already performed. Please call dispose first if you want to re-start.');
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
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(await wrapper.dispose()).toBeUndefined();
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
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
            javascript: createDefaultLcUnreachableUrlConfig()
        };
        const wrapper = new MonacoEditorLanguageClientWrapper();
        expect(await wrapper.init(config)).toBeUndefined();

        const languageClientWrapper = wrapper.getLanguageClientWrapper('javascript');
        expect(languageClientWrapper).toBeDefined();
    });

    test('LanguageClientWrapper unreachable rejection handling', async () => {
        const config = createWrapperConfigExtendedApp();
        config.languageClientConfigs = {
            javascript: createDefaultLcUnreachableUrlConfig()
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
        expect(await wrapper.start(true, htmlContainer)).toBeUndefined();
    });
});
