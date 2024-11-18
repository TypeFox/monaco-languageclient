/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';
import { render, RenderResult } from '@testing-library/react';
import React from 'react';
import { LogLevel } from 'vscode/services';
import { MonacoEditorLanguageClientWrapper, TextChanges, WrapperConfig } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { configureMonacoWorkers, createMonacoEditorDiv } from './helper.js';

describe('Test MonacoEditorReactComp', () => {
    test('rerender', async () => {
        const wrapperConfig: WrapperConfig = {
            logLevel: LogLevel.Debug,
            htmlContainer: createMonacoEditorDiv(),
            vscodeApiConfig: {
                enableTextmate: true,
                loadThemes: false
            },
            editorAppConfig: {
                $type: 'extended',
                monacoWorkerFactory: configureMonacoWorkers
            }
        };
        const { rerender } = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
        rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);
        await Promise.resolve();
        rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);

        let renderResult: RenderResult;
        // we have to await the full start of the editor with the onLoad callback, then it is save to contine
        const p = await new Promise<void>(resolve => {
            const handleOnLoad = async (_wrapper: MonacoEditorLanguageClientWrapper) => {
                renderResult.rerender(<MonacoEditorReactComp wrapperConfig={wrapperConfig} />);

                resolve();
            };
            renderResult = render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} />);
        });
        // void promise is undefined after it was awaited
        expect(p).toBeUndefined();
    });

    test('update onTextChanged', async () => {
        const wrapperConfig: WrapperConfig = {
            logLevel: LogLevel.Debug,
            htmlContainer: createMonacoEditorDiv(),
            vscodeApiConfig: {
                enableTextmate: true,
                loadThemes: false
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: 'hello world',
                        fileExt: 'js'
                    }
                },
                monacoWorkerFactory: configureMonacoWorkers
            }
        };

        const textReceiverHello = (textChanges: TextChanges) => {
            expect(textChanges.text).toEqual('hello world');
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            expect(wrapper.getTextModels()?.text?.getValue()).toEqual('hello world');
        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onTextChanged={(textReceiverHello)} onLoad={handleOnLoad} />);
    });

    test('update codeResources', async () => {
        const wrapperConfig: WrapperConfig = {
            logLevel: LogLevel.Debug,
            htmlContainer: createMonacoEditorDiv(),
            vscodeApiConfig: {
                enableTextmate: true,
                loadThemes: false
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: 'hello world',
                        fileExt: 'js'
                    }
                },
                monacoWorkerFactory: configureMonacoWorkers
            }
        };

        let count = 0;
        const textReceiver = (textChanges: TextChanges) => {
            if (count === 0) {
                expect(textChanges.text).toBe('hello world');
            } else {
                expect(textChanges.text).toBe('goodbye world');
            }
        };

        const handleOnLoad = async (wrapper: MonacoEditorLanguageClientWrapper) => {
            count++;

            await wrapper.updateCodeResources({
                main: {
                    text: 'goodbye world',
                    fileExt: 'js'
                }
            });

        };
        render(<MonacoEditorReactComp wrapperConfig={wrapperConfig} onLoad={handleOnLoad} onTextChanged={textReceiver} />);
    });
});
