/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createEditorAppConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('Test EditorApp', () => {

    test('Start EditorApp with no services', async () => {
        const htmlContainer = createMonacoEditorDiv();
        const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'ViewsService');
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.start();

        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);
        await expect(async () => {
            await editorApp.start(htmlContainer);
        }).rejects.toThrowError('No EditorService configured. monaco-editor will not be started.');
    });

});
