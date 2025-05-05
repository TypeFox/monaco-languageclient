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
    const onTextChangedRef = useRef(onTextChanged);
    onTextChangedRef.current = onTextChanged;

    useEffect(() => {

        (async () => {
            if (containerRef.current) {
                try {
                    wrapperConfig.htmlContainer = containerRef.current;
                    if (wrapperRef.current.isInitializing() || wrapperRef.current.isStarting() || wrapperRef.current.isDisposing()) {
                        await Promise.all([
                            wrapperRef.current.getInitializingAwait(),
                            wrapperRef.current.getStartingAwait(),
                            wrapperRef.current.getDisposingAwait()
                        ]);
                    }

                    await wrapperRef.current.init(wrapperConfig);

                    wrapperRef.current.registerTextChangedCallback((textChanges) => {
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
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
        })();
    }, [wrapperConfig]);

    useEffect(() => {
        const disposeMonaco = async () => {
            try {
                await wrapperRef.current.dispose();
            } catch (error) {
                // The language client may throw an error during disposal, but we want to continue anyway
                console.error(`Unexpected error occurred during disposal of the language client: ${error}`);
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
