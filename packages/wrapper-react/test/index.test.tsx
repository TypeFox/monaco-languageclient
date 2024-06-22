/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, test } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { UserConfig } from 'monaco-editor-wrapper';

describe('Test MonacoEditorReactComp', () => {
    test('rerender', async () => {
        const userConfig: UserConfig = {
            wrapperConfig: {
                editorAppConfig: {
                    $type: 'extended',
                }
            },
            loggerConfig: {
                enabled: true,
                debugEnabled: true,
            }
        };
        const { rerender } = render(<MonacoEditorReactComp userConfig={userConfig} />);
        rerender(<MonacoEditorReactComp userConfig={userConfig} />);
        await Promise.resolve();
        rerender(<MonacoEditorReactComp userConfig={userConfig} />);
    });

    test('update onTextChanged', async () => {
        const userConfig: UserConfig = {
            wrapperConfig: {
                editorAppConfig: {
                    $type: 'extended',
                    codeResources: {
                        main: {
                            text: '',
                            fileExt: 'js'
                        }
                    }
                }
            },
            loggerConfig: {
                enabled: true,
                debugEnabled: true,
            }
        };
        const { rerender } = render(<MonacoEditorReactComp userConfig={userConfig} />);
        await new Promise(resolve => rerender(<MonacoEditorReactComp userConfig={userConfig} onTextChanged={resolve} />));
    });
});