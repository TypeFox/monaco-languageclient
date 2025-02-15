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
        const destroyMonaco = async () => {
            try {
                await wrapperRef.current.dispose();
            } catch {
                // The language client may throw an error during disposal.
                // This should not prevent us from continue working.
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
                    wrapperRef.current.registerTextChangeCallback(onTextChanged);
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
            await initMonaco();
            await startMonaco();
        })();

        return () => {
            destroyMonaco();
        };

    }, [wrapperConfig]);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
