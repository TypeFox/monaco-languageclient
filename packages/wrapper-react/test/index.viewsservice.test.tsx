/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { render } from '@testing-library/react';
import { Deferred } from 'monaco-languageclient/common';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import React from 'react';
import { describe, expect, test } from 'vitest';
import { cleanHtmlBody, createDefaultEditorAppConfig } from './support/helper.js';

describe('Test MonacoEditorReactComp', () => {

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'ViewsService'
        },
        logLevel: LogLevel.Debug
    };

    test.sequential('views service: no HTMLElement', async () => {
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        await expect(render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onError={(error) => {
                expect(error.message).toEqual('View Service Type "ViewsService" requires a HTMLElement.');
                deferred.resolve();
            }}
        />));
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
    });

    test.sequential('views service: HTMLElement', async () => {
        vscodeApiConfig.viewsConfig.htmlContainer = document.createElement('div');
        const editorAppConfig = createDefaultEditorAppConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`
            }
        });

        const deferred = new Deferred();
        await expect(render(<MonacoEditorReactComp
            vscodeApiConfig={vscodeApiConfig}
            editorAppConfig={editorAppConfig}
            style={{ 'height': '800px' }}
            onVscodeApiInitDone={() => deferred.resolve()}
        />));
        await expect(await deferred.promise).toBeUndefined();

        cleanHtmlBody();
    });
});
