/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { describe, expect, test } from 'vitest';
import { createDefaultMonacoVscodeApiConfig, createEditorAppConfigClassicExtended, createMonacoEditorDiv } from '../support/helper.js';

describe('Test EditorApp', () => {

    const htmlContainer = createMonacoEditorDiv();

    test('Start EditorApp with no services', async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig(htmlContainer);
        apiConfig.viewsConfig = {
            viewServiceType: 'ViewsService'
        };
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.init();

        const editorAppConfig = createEditorAppConfigClassicExtended({});
        const editorApp = new EditorApp(editorAppConfig);
        await expect(async () => {
            await editorApp.start(htmlContainer);
        }).rejects.toThrowError('No EditorService configured. monaco-editor will not be started.');
    });

});
