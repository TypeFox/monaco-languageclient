/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import React, { type CSSProperties, useCallback, useEffect, useRef } from 'react';
import { MonacoEditorLanguageClientWrapper, type TextContents, type WrapperConfig } from 'monaco-editor-wrapper';

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    wrapperConfig: WrapperConfig,
    onTextChanged?: (textChanges: TextContents) => void;
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
                wrapperRef.current.registerTextChangeCallback(onTextChanged);
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
        if (!onTextChanged) return;
    }, [onTextChanged, wrapperConfig]);

    const destroyMonaco = useCallback(async () => {
        try {
            await wrapperRef.current.dispose();
        } catch {
            // The language client may throw an error during disposal.
            // This should not prevent us from continue working.
        }
    }, []);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
