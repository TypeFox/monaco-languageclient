/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { MonacoEditorLanguageClientWrapper, TextContents, WrapperConfig } from 'monaco-editor-wrapper';
import { Logger } from 'monaco-languageclient/tools';

export type TextChanges = TextContents & {
    isDirty: boolean;
}

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
    const loggerRef = useRef<Logger>(new Logger());
    const containerRef = useRef<HTMLDivElement>(null);
    const [onTextChangedSubscriptions, setOnTextChangedSubscriptions] = useState<monaco.IDisposable[]>([]);

    useEffect(() => {
        loggerRef.current.updateConfig(wrapperConfig.loggerConfig);
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
        await wrapperRef.current.init(wrapperConfig);
    }, [wrapperConfig]);

    const startMonaco = useCallback(async () => {
        if (containerRef.current) {
            containerRef.current.className = className ?? '';
            try {
                await wrapperRef.current.start(containerRef.current);
                onLoad?.(wrapperRef.current);
                handleOnTextChanged();
            } catch (e) {
                if (onError) {
                    onError(e);
                } else {
                    throw e;
                }
            }
        }
    }, [className, onError, onLoad]);

    const handleOnTextChanged = useCallback(() => {
        disposeOnTextChanged();

        if (!onTextChanged) return;

        const textModels = wrapperRef.current.getTextModels();
        if (textModels?.text || textModels?.textOriginal) {
            const verifyModelContent = () => {
                const text = textModels.text?.getValue() ?? '';
                const textOriginal = textModels.textOriginal?.getValue() ?? '';
                const codeResources = wrapperConfig.editorAppConfig.codeResources;
                const dirty = text !== codeResources?.main?.text;
                const dirtyOriginal = textOriginal !== codeResources?.original?.text;
                onTextChanged({
                    text,
                    textOriginal,
                    isDirty: dirty || dirtyOriginal
                });
            };

            const newSubscriptions: monaco.IDisposable[] = [];

            if (textModels.text) {
                newSubscriptions.push(textModels.text.onDidChangeContent(() => {
                    verifyModelContent();
                }));
            }

            if (textModels.textOriginal) {
                newSubscriptions.push(textModels.textOriginal.onDidChangeContent(() => {
                    verifyModelContent();
                }));
            }
            setOnTextChangedSubscriptions(newSubscriptions);
            // do it initially
            verifyModelContent();
        }
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
        for (const subscription of onTextChangedSubscriptions) {
            subscription.dispose();
        }
        setOnTextChangedSubscriptions([]);
    }, []);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
