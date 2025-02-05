/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import React, { type CSSProperties, useCallback, useEffect, useRef } from 'react';
import { didModelContentChange, MonacoEditorLanguageClientWrapper, type TextChanges, type TextModels, type WrapperConfig } from 'monaco-editor-wrapper';

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    wrapperConfig: WrapperConfig,
    onTextChanged?: (textChanges: TextChanges) => void;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (e: any) => void;
}

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        wrapperConfig,
        onTextChanged,
        onLoad,
        onError
    } = props;

    const wrapperRef = useRef<MonacoEditorLanguageClientWrapper>(new MonacoEditorLanguageClientWrapper());
    const containerRef = useRef<HTMLDivElement>(null);
    const onTextChangedSubscriptions = useRef<monaco.IDisposable[]>([]);

    useEffect(() => {
        return () => {
            destroyMonaco();
        };
    }, []);

    useEffect(() => {
        handleReInit();
    }, [wrapperConfig]);

    useEffect(() => {
        handleOnTextChanged();
    }, [onTextChanged]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.className = className ?? '';
            wrapperConfig.htmlContainer = containerRef.current;
        }
    }, [className]);

    const handleReInit = useCallback(async () => {
        if (wrapperRef.current.isStopping() === undefined) {
            await destroyMonaco();
        } else {
            await wrapperRef.current.isStopping();
        }

        if (wrapperRef.current.isStarting() === undefined) {
            await initMonaco();
            await startMonaco();
        } else {
            await wrapperRef.current.isStarting();
        }

    }, [wrapperConfig]);

    const initMonaco = useCallback(async () => {
        if (containerRef.current) {
            wrapperConfig.htmlContainer = containerRef.current;
            await wrapperRef.current.init(wrapperConfig);
        } else {
            throw new Error('No htmlContainer found! Aborting...');
        }
    }, [wrapperConfig]);

    const startMonaco = useCallback(async () => {
        if (containerRef.current) {
            try {
                wrapperRef.current.registerModelUpdate((textModels: TextModels) => {
                    if (textModels.modified !== undefined || textModels.original !== undefined) {
                        const newSubscriptions: monaco.IDisposable[] = [];

                        if (textModels.modified !== undefined) {
                            newSubscriptions.push(textModels.modified.onDidChangeContent(() => {
                                didModelContentChange(textModels, wrapperConfig.editorAppConfig?.codeResources, onTextChanged);
                            }));
                        }

                        if (textModels.original !== undefined) {
                            newSubscriptions.push(textModels.original.onDidChangeContent(() => {
                                didModelContentChange(textModels, wrapperConfig.editorAppConfig?.codeResources, onTextChanged);
                            }));
                        }
                        onTextChangedSubscriptions.current = newSubscriptions;
                        // do it initially
                        didModelContentChange(textModels, wrapperConfig.editorAppConfig?.codeResources, onTextChanged);
                    }
                });

                await wrapperRef.current.start();
                onLoad?.(wrapperRef.current);
                handleOnTextChanged();
            } catch (e) {
                if (onError) {
                    onError(e);
                } else {
                    throw e;
                }
            }
        } else {
            throw new Error('No htmlContainer found! Aborting...');
        }
    }, [onError, onLoad, onTextChanged]);

    const handleOnTextChanged = useCallback(() => {
        disposeOnTextChanged();

        if (!onTextChanged) return;

    }, [onTextChanged, wrapperConfig]);

    const destroyMonaco = useCallback(async () => {
        try {
            await wrapperRef.current.dispose();
        } catch {
            // The language client may throw an error during disposal.
            // This should not prevent us from continue working.
        }
        disposeOnTextChanged();
    }, []);

    const disposeOnTextChanged = useCallback(() => {
        for (const subscription of onTextChangedSubscriptions.current) {
            subscription.dispose();
        }
        onTextChangedSubscriptions.current = [];
    }, []);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
