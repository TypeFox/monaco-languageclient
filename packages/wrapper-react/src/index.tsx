/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import React, { type CSSProperties, useEffect, useRef } from 'react';
import { MonacoEditorLanguageClientWrapper, type TextContents, type WrapperConfig } from 'monaco-editor-wrapper';

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    wrapperConfig: WrapperConfig,
    onTextChanged?: (textChanges: TextContents) => void;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
    onError?: (e: unknown) => void;
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
        const disposeMonaco = async () => {
            try {
                await wrapperRef.current.dispose();
            } catch {
                // The language client may throw an error during disposal, but we want to continue anyway
            }
        };

        const initMonaco = async () => {
            if (containerRef.current) {
                wrapperConfig.htmlContainer = containerRef.current;
                await wrapperRef.current.init(wrapperConfig);
            } else {
                throw new Error('No htmlContainer found! Aborting...');
            }
        };

        const startMonaco = async () => {
            if (containerRef.current) {
                try {
                    wrapperRef.current.registerTextChangedCallback(onTextChanged);
                    await wrapperRef.current.start();
                    onLoad?.(wrapperRef.current);
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
        };

        (async () => {
            await disposeMonaco();
            await initMonaco();
            await startMonaco();
        })();
    }, [wrapperConfig]);

    useEffect(() => {
        // exact copy of the above function, to prevent declaration in useCallback
        const disposeMonaco = async () => {
            try {
                await wrapperRef.current.dispose();
            } catch {
                // The language client may throw an error during disposal, but we want to continue anyway
            }
        };

        return () => {
            (async () => {
                await disposeMonaco();
            })();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
