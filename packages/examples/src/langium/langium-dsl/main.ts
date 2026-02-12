/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import * as vscode from 'vscode';
import type { ExampleAppConfig } from '../../common/client/utils.js';
import { setupLangiumClientExtended } from './config/langiumDslConfig.js';

export const runLangiumGrammarDsl = async () => {
    try {
        const appConfig: ExampleAppConfig = await setupLangiumClientExtended();

        // perform global init
        const apiWrapper = new MonacoVscodeApiWrapper(appConfig.vscodeApiConfig);
        await apiWrapper.start();

        // init language client
        const lcWrapper = new LanguageClientWrapper(appConfig.languageClientConfig);
        await lcWrapper.start();

        await vscode.workspace.openTextDocument('/workspace/langium-types.langium');
        await vscode.workspace.openTextDocument('/workspace/langium-grammar.langium');
        await vscode.window.showTextDocument(vscode.Uri.file('/workspace/langium-grammar.langium'));
    } catch (e) {
        console.error(e);
    }
};
