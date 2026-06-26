/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { createMinilogoConfig } from './config/minilogoConfig.js';

let editorApp: EditorApp | undefined;
let lcWrapper: LanguageClientWrapper | undefined;

const startEditor = async () => {
    if (editorApp?.isStarted() === true) {
        console.warn('Editor was already started');
        return;
    }

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const appConfig = createMinilogoConfig({ htmlContainer });

    // initialize the monaco-vscode api
    const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
    await apiWrapper.start();

    // start the language client
    lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
    await lcWrapper.start();

    // start the editor
    editorApp = new EditorApp(appConfig.editorAppConfig);
    await editorApp.start(htmlContainer);

    console.log('MiniLogo editor with language client is ready');
};

export const runMinilogo = async () => {
    try {
        await startEditor();
    } catch (e) {
        console.error(e);
    }
};
