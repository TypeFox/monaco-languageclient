/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorApp } from 'monaco-languageclient/editorApp';
import { describe, expect, test } from 'vitest';
import { createEditorAppConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('Test EditorApp', () => {

    const htmlContainer = createMonacoEditorDiv();

    test('Start EditorApp with no services', async () => {
        const editorAppConfig = createEditorAppConfig({});
        const editorApp = new EditorApp(editorAppConfig);
        await expect(async () => {
            await editorApp.start('extended', htmlContainer);
        }).rejects.toThrowError('monaco-vscode-api was not initialized. Aborting.');
    });

});
