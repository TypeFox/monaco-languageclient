/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { type EditorAppConfig, EditorApp, type TextContents } from 'monaco-languageclient/editorApp';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React, { type CSSProperties, useEffect, useRef } from 'react';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig: EditorAppConfig,
    onVscodeApiInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onLoad?: (editorApp: EditorApp) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onError?: (e: unknown) => void;
}

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        vscodeApiConfig,
        editorAppConfig,
        onVscodeApiInitDone,
        onLoad,
        onTextChanged,
        onError
    } = props;

    const apiWrapperRef = useRef<MonacoVscodeApiWrapper>(new MonacoVscodeApiWrapper(vscodeApiConfig));
    const editorAppRef = useRef<EditorApp>(null);
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

                    // wrapper is always re-created
                    editorAppRef.current = new EditorApp(editorAppConfig);
                    if (editorAppRef.current.isStarting() === true || editorAppRef.current.isDisposing() === true) {
                        await Promise.all([
                            editorAppRef.current.getStartingAwait(),
                            editorAppRef.current.getDisposingAwait()
                        ]);
                    }

                    apiWrapperRef.current.getLogger().debug('INIT');

                    editorAppRef.current.registerOnTextChangedCallback((textChanges) => {
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
                    await editorAppRef.current.start(containerRef.current);

                    onLoad?.(editorAppRef.current);
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

    }, [editorAppConfig]);

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
                    onVscodeApiInitDone?.(apiWrapperRef.current);
                })();
            }
        }
        const disposeMonaco = async () => {
            try {
                apiWrapperRef.current.getLogger().debug('DISPOSE');
                await editorAppRef.current?.dispose();
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
