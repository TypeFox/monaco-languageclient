/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import React, { type CSSProperties, useEffect, useRef } from 'react';
import { MonacoEditorLanguageClientWrapper, type TextContents, type WrapperConfig } from 'monaco-editor-wrapper';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig: MonacoVscodeApiConfig;
    wrapperConfig: WrapperConfig,
    onGlobalInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onError?: (e: unknown) => void;
}

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        vscodeApiConfig,
        wrapperConfig,
        onGlobalInitDone,
        onLoad,
        onTextChanged,
        onError
    } = props;

    const apiWrapperRef = useRef<MonacoVscodeApiWrapper>(new MonacoVscodeApiWrapper(vscodeApiConfig));
    const wrapperRef = useRef<MonacoEditorLanguageClientWrapper>(new MonacoEditorLanguageClientWrapper());
    const containerRef = useRef<HTMLDivElement>(null);
    const onTextChangedRef = useRef(onTextChanged);
    onTextChangedRef.current = onTextChanged;
    const initialRenderRef = useRef(true);

    useEffect(() => {
        const deferRender = async () => {
            if (containerRef.current) {
                try {
                    // await global init if not completed before doing anything else
                    const envEnhanced = getEnhancedMonacoEnvironment();
                    if (envEnhanced.vscodeApiGlobalInitAwait !== undefined) {
                        apiWrapperRef.current.getLogger().debug('AWAITING GLOBLAL INIT');
                        await envEnhanced.vscodeApiGlobalInitAwait;
                    }

                    if (wrapperRef.current.isInitializing() || wrapperRef.current.isStarting() || wrapperRef.current.isDisposing()) {
                        await Promise.all([
                            wrapperRef.current.getInitializingAwait(),
                            wrapperRef.current.getStartingAwait(),
                            wrapperRef.current.getDisposingAwait()
                        ]);
                    }

                    apiWrapperRef.current.getLogger().debug('INIT');

                    // always dispose before re-initializing
                    await wrapperRef.current.dispose();
                    await wrapperRef.current.init(wrapperConfig);

                    wrapperRef.current.registerTextChangedCallback((textChanges) => {
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
                    await wrapperRef.current.start(containerRef.current);

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
        deferRender();

    }, [wrapperConfig]);

    useEffect(() => {
        if (containerRef.current) {
            // init will only performed once
            if (initialRenderRef.current) {
                initialRenderRef.current = false;

                (async () => {
                    await apiWrapperRef.current.init({
                        caller: className,
                        htmlContainer: containerRef.current
                    });
                    onGlobalInitDone?.(apiWrapperRef.current);
                })();
            }
        }
        const disposeMonaco = async () => {
            try {
                apiWrapperRef.current.getLogger().debug('DISPOSE');
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
