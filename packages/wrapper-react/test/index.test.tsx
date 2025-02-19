/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { render, type RenderResult } from '@testing-library/react';
import React from 'react';
import {
    MonacoEditorLanguageClientWrapper,
    type TextContents,
} from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createDefaultWrapperConfig } from './helper.js';

describe('Test MonacoEditorReactComp', () => {
    test('rerender', async () => {
        const wrapperConfig = createDefaultWrapperConfig();
        const { rerender } = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
        rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
        rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
    });

    test('onLoad', async () => {
        const wrapperConfig = createDefaultWrapperConfig();

        let renderResult: RenderResult;
        // we have to await the full start of the editor with the onLoad callback, then it is save to contine
        await expect(await new Promise<void>(resolve => {
            const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);

                console.log('onLoad');
                resolve();
            };

            renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
        // void promise is undefined after it was awaited
        })).toBeUndefined();
    });

    test('update onTextChanged', async () => {
        const wrapperConfig = createDefaultWrapperConfig();

        const textReceiverHello = (textChanges: TextContents) => {
            expect(textChanges.modified).toEqual('hello world');
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            expect(wrapper.getTextModels()?.modified?.getValue()).toEqual('hello world');
        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onTextChanged={(textReceiverHello)} onLoad={handleOnLoad} />);
    });

    test('update codeResources', async () => {
        const wrapperConfig = createDefaultWrapperConfig();

        let count = 0;
        const textReceiver = (textChanges: TextContents) => {
            // initial call
            if (count === 0) {
                expect(textChanges.modified).toBe('hello world');
            } else {
                expect(textChanges.modified).toBe('goodbye world');
            }
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            count++;
            await wrapper.updateCodeResources({
                modified: {
                    text: 'goodbye world',
                    fileExt: 'js'
                }
            });

        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} onTextChanged={textReceiver} />);
    });

    test('should rerender without error', async () => {
        const wrapperConfig = createDefaultWrapperConfig();

        let renderResult: RenderResult;
        expect(await new Promise<void>(resolve => {
            const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);

                resolve();
            };

            renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
        // void promise is undefined after it was awaited
        })).toBeUndefined();

        expect(await new Promise<void>(resolve => {
            const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);

                resolve();
            };
            const newWrapperConfig = createDefaultWrapperConfig();

            renderResult!.rerender(
                <MonacoEditorReactComp wrapperConfig={newWrapperConfig} onLoad={handleOnLoad} />
            );
        // void promise is undefined after it was awaited
        })).toBeUndefined();
    });
});
