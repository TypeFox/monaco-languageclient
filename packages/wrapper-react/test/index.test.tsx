/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { updateExtendedAppPrototyp } from './helper';

describe('Test MonacoEditorReactComp', () => {
    test('rerender', async () => {
        updateExtendedAppPrototyp();
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
        updateExtendedAppPrototyp();
        const userConfig: UserConfig = {
            wrapperConfig: {
                editorAppConfig: {
                    $type: 'extended',
                    codeResources: {
                        main: {
                            text: 'hello world',
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

        const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
            const value = await new Promise(resolve => rerender(<MonacoEditorReactComp userConfig={userConfig} onTextChanged={resolve} />));
            expect(value).toEqual({ main: 'test', original: '', isDirty: true });
        };

        const { rerender } = render(<MonacoEditorReactComp userConfig={userConfig} onLoad={handleOnLoad} />);
    });
});
