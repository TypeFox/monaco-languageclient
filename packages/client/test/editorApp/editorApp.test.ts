/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

/* eslint-disable dot-notation */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { type ILogger } from '@codingame/monaco-vscode-log-service-override';
import { encodeStringOrUrlToDataUrl } from 'monaco-languageclient/common';
import { EditorApp, type TextContents } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createEditorAppConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('Test EditorApp', () => {
    const htmlContainer = createMonacoEditorDiv();
    const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'EditorService');

    beforeAll(async () => {
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.start();
    });
    const code = 'const text = "Hello World!";';
    const codeUpdated = 'const text = "Goodbye World!";';

    test('extended type: empty EditorAppConfigExtended', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        expect(editorAppConfig.editorOptions).toStrictEqual({});
        expect(apiConfig.$type).toBe('extended');
    });

    test('verifyUrlorCreateDataUrl: url', () => {
        const url = new URL('./editorAppExtended.test.ts', import.meta.url);
        expect(encodeStringOrUrlToDataUrl(url)).toBe(url.href);
    });

    test('verifyUrlorCreateDataUrl: url', async () => {
        const url = new URL('../../../node_modules/langium-statemachine-dsl/syntaxes/statemachine.tmLanguage.json', window.location.href);
        const text = await (await fetch(url)).text();
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        expect(encodeStringOrUrlToDataUrl(text)).toBe(`data:text/plain;base64,${base64}`);
    });

    test('verifyUrlorCreateDataUrl: url', () => {
        const text = '✓✓';
        const bytes = new TextEncoder().encode(text);
        const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
        const base64 = btoa(binString);
        expect(encodeStringOrUrlToDataUrl(text)).toBe(`data:text/plain;base64,${base64}`);
    });

    test('config defaults', () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        editorAppConfig.id = 'test-config-defaults';

        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getConfig().codeResources?.modified?.text).toEqual(code);
        expect(editorApp.getConfig().codeResources?.original).toBeUndefined();
        expect(editorApp.getConfig().useDiffEditor ?? false).toBeFalsy();
        expect(editorApp.getConfig().readOnly).toBeFalsy();
        expect(editorApp.getConfig().domReadOnly).toBeFalsy();
    });

    test('New editorApp has undefined editor', () => {
        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getEditor()).toBeUndefined();
    });

    test('New editorApp has undefined diff editor', () => {
        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);
        expect(editorApp.getDiffEditor()).toBeUndefined();
    });

    test('Start EditorApp', async () => {
        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        await editorApp.dispose();
    });

    test('Update code resources after start (same file)', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarted()).toBeTruthy();

        editorApp.registerOnTextChangedCallback((textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        });

        editorApp.setModelRefDisposeTimeout(1000);

        await editorApp.updateCodeResources({
            modified: {
                text: codeUpdated,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });

        const textModels = editorApp.getTextModels();
        expect(textModels.modified?.getValue()).toEqual(codeUpdated);

        expect(editorApp.getEditor()?.getModel()?.getValue()).toEqual(codeUpdated);

        await editorApp.dispose();
    });

    test('Update code resources after start (different file)', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarted()).toBeTruthy();

        editorApp.setModelRefDisposeTimeout(1000);

        await expect(
            await editorApp.updateCodeResources({
                modified: {
                    text: codeUpdated,
                    uri: `/workspace/${expect.getState().testPath}_2.js`
                }
            })
        ).toBeTruthy();

        const textModels = editorApp.getTextModels();
        expect(textModels.modified?.getValue()).toEqual(codeUpdated);

        expect(editorApp.getEditor()?.getModel()?.getValue()).toEqual(codeUpdated);

        await editorApp.dispose();
    });

    test('Verify registerTextChangeCallback', async () => {
        const editorAppConfig = createEditorAppConfig({});

        const onTextChanged = (textChanges: TextContents) => {
            console.log(`text: ${textChanges.modified}\ntextOriginal: ${textChanges.original}`);
        };
        const editorApp = new EditorApp(editorAppConfig);

        let onTextChangedDiposeable = editorApp['textChangedDisposables'].modified;
        expect(onTextChangedDiposeable).toBeUndefined();

        editorApp.registerOnTextChangedCallback(onTextChanged);

        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        const spyAnnounceModelUpdate = vi.spyOn(editorApp as any, 'announceModelUpdate');

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        onTextChangedDiposeable = editorApp['textChangedDisposables'].modified;
        expect(onTextChangedDiposeable).toBeDefined();

        const spyOnTextChangedDiposeable = vi.spyOn(onTextChangedDiposeable, 'dispose');

        // because there are default models now, the first update of models will not lead to onTextChanged dispoe
        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(1);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(0);
        editorApp.setModelRefDisposeTimeout(1000);

        await editorApp.updateCodeResources({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}_2.statemachine`
            }
        });

        expect(spyAnnounceModelUpdate).toHaveBeenCalledTimes(2);
        expect(spyOnTextChangedDiposeable).toHaveBeenCalledTimes(1);

        await editorApp.dispose();
    });

    test('Test editorApp init/start/dispose phase promises', async () => {
        let editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();
        expect(editorApp.isStarting()).toBeFalsy();
        expect(editorApp.isDisposing()).toBeFalsy();

        await expect(await editorApp.dispose()).toBeUndefined();

        expect(editorApp.isStarting()).toBeFalsy();
        expect(editorApp.isDisposing()).toBeFalsy();

        editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}_2.js`
            }
        });
        editorApp = new EditorApp(editorAppConfig);
        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        await editorApp.dispose();
    });

    test('Test html parameter with start', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        const editorApp = new EditorApp(editorAppConfig);

        await expect(await editorApp.start(htmlContainer)).toBeUndefined();

        await editorApp.dispose();
    });

    test('set verify log levels are applied', async () => {
        const editorAppConfig = createEditorAppConfig({
            modified: {
                text: code,
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });
        let editorApp = new EditorApp(editorAppConfig);
        let logLevel = (editorApp['logger'] as ILogger).getLevel();
        expect(logLevel).toBe(LogLevel.Off);
        expect(logLevel).toBe(0);

        editorAppConfig.logLevel = LogLevel.Debug;
        editorApp = new EditorApp(editorAppConfig);
        logLevel = (editorApp['logger'] as ILogger).getLevel();
        expect(logLevel).toBe(LogLevel.Debug);
        expect(logLevel).toBe(2);
    });
});
