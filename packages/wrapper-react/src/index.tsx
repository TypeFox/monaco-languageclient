/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { Logger } from 'monaco-languageclient/tools';

export type TextChanges = {
    main: string;
    original: string;
    isDirty: boolean;
}

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    userConfig: UserConfig,
    onTextChanged?: (textChanges: TextChanges) => void;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (e: any) => void;
}

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        userConfig,
        onTextChanged,
        onLoad,
        onError
    } = props;

    const wrapperRef = useRef<MonacoEditorLanguageClientWrapper>(new MonacoEditorLanguageClientWrapper());
    const loggerRef = useRef<Logger>(new Logger());
    const containerRef = useRef<HTMLDivElement>(null);
    const [onTextChangedSubscriptions, setOnTextChangedSubscriptions] = useState<monaco.IDisposable[]>([]);
    const [isRestarting, setIsRestarting] = useState<Promise<void> | undefined>();

    useEffect(() => {
        loggerRef.current.updateConfig(userConfig.loggerConfig);
        return () => {
            destroyMonaco();
        };
    }, []);

    useEffect(() => {
        handleReInit();
    }, [userConfig]);

    useEffect(() => {
        handleOnTextChanged();
    }, [onTextChanged]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.className = className ?? '';
        }
    }, [className]);

    const handleReInit = useCallback(async () => {
        if (isRestarting !== undefined) {
            await isRestarting;
        }

        const promiseExecution = async (resolve: (value: void | PromiseLike<void>) => void) => {
            await destroyMonaco();
            await initMonaco();
            await startMonaco();
            setIsRestarting(undefined);
            resolve();
        };
        setIsRestarting(new Promise<void>(promiseExecution));
    }, [userConfig]);

    const initMonaco = useCallback(async () => {
        await wrapperRef.current.init(userConfig);
    }, [userConfig]);

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
                const main = textModels.text?.getValue() ?? '';
                const original = textModels.textOriginal?.getValue() ?? '';
                const codeResources = userConfig.wrapperConfig.editorAppConfig.codeResources;
                const dirty = main !== codeResources?.main?.text;
                const dirtyOriginal = original !== codeResources?.original?.text;
                onTextChanged({
                    main,
                    original,
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
    }, [onTextChanged, userConfig]);

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
