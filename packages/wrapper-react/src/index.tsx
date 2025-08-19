/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { EditorApp, type EditorAppConfig, type TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfigs, LanguageClientsManager } from 'monaco-languageclient/lcwrapper';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React, { type CSSProperties, useEffect, useRef, useState } from 'react';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfigs?: LanguageClientConfigs;
    onVscodeApiInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onEditorStartDone?: (editorApp?: EditorApp) => void;
    onLanguageClientsStartDone?: (lcsManager?: LanguageClientsManager) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onError?: (error: Error) => void;
    onDisposeEditor?: () => void;
    onDisposeLanguageClients?: () => void;
    modifiedTextValue?: string;
    originalTextValue?: string;
}

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        vscodeApiConfig,
        editorAppConfig,
        languageClientConfigs,
        onVscodeApiInitDone,
        onEditorStartDone,
        onLanguageClientsStartDone,
        onTextChanged,
        onError,
        onDisposeEditor,
        onDisposeLanguageClients,
        modifiedTextValue,
        originalTextValue
    } = props;

    const apiWrapperRef = useRef<MonacoVscodeApiWrapper>(new MonacoVscodeApiWrapper(vscodeApiConfig));
    const haveEditorService = useRef(true);
    const editorAppRef = useRef<EditorApp>(null);
    const lcsManagerRef = useRef<LanguageClientsManager>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onTextChangedRef = useRef(onTextChanged);
    const [modifiedCode, setModifiedCode] = useState(modifiedTextValue);
    const [originalCode, setOriginalCode] = useState(originalTextValue);

    const performErrorHandling = (error: Error) => {
        if (onError) {
            onError(error);
        } else {
            throw error;
        }
    };

    useEffect(() => {
        // this is only available if EditorService is configured
        if (modifiedTextValue !== undefined && haveEditorService.current) {
            setModifiedCode(modifiedTextValue);
            editorAppRef.current?.updateCode({modified: modifiedTextValue});
        }
    }, [modifiedTextValue]);

    useEffect(() => {
        // this is only available if EditorService is configured
        if (originalTextValue !== undefined && haveEditorService.current) {
            setOriginalCode(originalTextValue);
            editorAppRef.current?.updateCode({original: originalTextValue});
        }
    }, [originalTextValue]);

    const awaitGlobal = async () => {
        // await global init if not completed before doing anything else
        const envEnhanced = getEnhancedMonacoEnvironment();
        return (envEnhanced.vscodeApiGlobalInitAwait !== undefined) ? envEnhanced.vscodeApiGlobalInitAwait : Promise.resolve();
    };

    const performGlobalInit = async () => {
        if (containerRef.current === null) {
            performErrorHandling(new Error('No htmlContainer found! Aborting...'));
        }
        const envEnhanced = getEnhancedMonacoEnvironment();

        // init will only performed once
        if (envEnhanced.vscodeApiInitialising !== true) {

            (async () => {
                apiWrapperRef.current.getLogger().debug('GLOBAL INIT');
                await apiWrapperRef.current.init({
                    caller: className,
                    htmlContainer: containerRef.current
                });

                // set if editor mode is available, otherwise text bindings will not work
                haveEditorService.current = envEnhanced.viewServiceType === 'EditorService';

                onVscodeApiInitDone?.(apiWrapperRef.current);
            })();
        }
    };

    useEffect(() => {
        // always try to perform kick global init
        performGlobalInit();

        (async () => {
            try {
                apiWrapperRef.current.getLogger().debug('INIT');
                await awaitGlobal();

                // it is possible to run without an editorApp, for example when using the ViewsService
                if (haveEditorService.current) {
                    editorAppRef.current = new EditorApp(editorAppConfig);
                    if (editorAppRef.current.isStarting() === true || editorAppRef.current.isDisposing() === true) {
                        await Promise.all([
                            editorAppRef.current.getStartingAwait(),
                            editorAppRef.current.getDisposingAwait()
                        ]);
                    }

                    editorAppRef.current.registerOnTextChangedCallback((textChanges) => {
                        if (textChanges.modified !== undefined) {
                            setModifiedCode(textChanges.modified);
                        }
                        if (textChanges.original !== undefined) {
                            setOriginalCode(textChanges.original);
                        }
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
                    await editorAppRef.current.start(containerRef.current!);

                    onEditorStartDone?.(editorAppRef.current);

                    // originalTextValue and modifiedTextValue useEffects may happen before
                    editorAppRef.current.updateCode({
                        original: originalCode,
                        modified: modifiedCode
                    });
                }
                apiWrapperRef.current.getLogger().debug('INIT DONE');
            } catch (error) {
                performErrorHandling(error as Error);
            }
        })();
    }, [editorAppConfig]);

    useEffect(() => {
        // always try to perform kick global init
        performGlobalInit();

        if (languageClientConfigs !== undefined) {
            (async () => {
                try {
                    apiWrapperRef.current.getLogger().debug('INIT LC');
                    await awaitGlobal();

                    if (lcsManagerRef.current === null) {
                        lcsManagerRef.current = new LanguageClientsManager(apiWrapperRef.current.getLogger());
                    }

                    await lcsManagerRef.current.setConfigs(languageClientConfigs);
                    await lcsManagerRef.current.start();

                    onLanguageClientsStartDone?.(lcsManagerRef.current);
                    apiWrapperRef.current.getLogger().debug('INIT LC DONE');
                } catch (error) {
                    performErrorHandling(error as Error);
                }
            })();
        }
    }, [languageClientConfigs]);

    useEffect(() => {
        // always try to perform kick global init
        performGlobalInit();

        return () => {
            (async () => {
                // dispose editor id used and languageclient if enforced
                try {
                    apiWrapperRef.current.getLogger().debug('DISPOSE');
                    await editorAppRef.current?.dispose();
                    onDisposeEditor?.();

                    if (languageClientConfigs?.enforceDispose === true) {
                        lcsManagerRef.current?.dispose();
                        onDisposeLanguageClients?.();
                    }
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
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
