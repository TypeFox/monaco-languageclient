/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { render, type RenderResult } from '@testing-library/react';
import React from 'react';
import { MonacoEditorLanguageClientWrapper, type TextContents } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { createDefaultWrapperConfig } from './helper.js';

describe('Test MonacoEditorReactComp', () => {

    test('onLoad', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`,
            }
        });

        let renderResult: RenderResult;
        // we have to await the full start of the editor with the onLoad callback, then it is save to contine
        await expect(await new Promise<void>(resolve => {
            const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
                resolve();
            };
            renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
        // void promise is undefined after it was awaited
        })).toBeUndefined();
    });

    test('update onTextChanged', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`,
            }
        });

        const textReceiverHello = (textChanges: TextContents) => {
            expect(textChanges.modified).toEqual('const text = "Hello World!";');
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            expect(wrapper.getTextModels()?.modified?.getValue()).toEqual('const text = "Hello World!";');
        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onTextChanged={(textReceiverHello)} onLoad={handleOnLoad} />);
    });

    test('update codeResources', async () => {
        const wrapperConfig = createDefaultWrapperConfig({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`,
            }
        });

        let count = 0;
        const textReceiver = (textChanges: TextContents) => {
            // initial call
            if (count === 0) {
                expect(textChanges.modified).toBe('const text = "Hello World!";');
            } else {
                expect(textChanges.modified).toBe('const text = "Goodbye World!";');
            }
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            count++;
            await wrapper.updateCodeResources({
                modified: {
                    text: 'const text = "Goodbye World!";',
                    uri: `/workspace/${expect.getState().testPath}_goodbye.js`,
                }
            });

        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} onTextChanged={textReceiver} />);
    });

    test('rerender without error', async () => {
        let error = false;
        try {
            const wrapperConfig = createDefaultWrapperConfig({
                modified: {
                    text: 'const text = "Hello World!";',
                    uri: `/workspace/${expect.getState().testPath}.js`,
                }
            });
            const newWrapperConfig = createDefaultWrapperConfig({
                modified: {
                    text: 'const text = "Goodbye World 2!";',
                    uri: `/workspace/${expect.getState().testPath}_2.js`,
                }
            });
            let renderResult: RenderResult;

            const result1 = await new Promise<void>(resolve => {
                const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                    renderResult.rerender(<MonacoEditorReactComp wrapperConfig={newWrapperConfig} />);
                    resolve();
                };

                renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
            });

            // void promise is undefined after it was awaited
            expect(result1).toBeUndefined();

            renderResult!.rerender(<MonacoEditorReactComp wrapperConfig={newWrapperConfig} />);
        } catch (_e) {
            error = true;
        }
        expect(error).toBe(false);
    });
});
