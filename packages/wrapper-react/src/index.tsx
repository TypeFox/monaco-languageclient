/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { EditorApp, type EditorAppConfig, type TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfig, LanguageClientsManager } from 'monaco-languageclient/lcwrapper';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React, { type CSSProperties, useEffect, useRef, useState } from 'react';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
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
        languageClientConfig,
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

    const runQueue = useRef<Array<() => Promise<void>>>([]);

    const executeQueue = (id: string, newfunc: () => Promise<void>) => {
        debugLogging(`Adding to queue: ${id}`);
        debugLogging(`QUEUE SIZE before: ${runQueue.current.length}`);
        runQueue.current.push(newfunc);
        (async () => {
            // always expect to need to await the global init
            await awaitGlobal();

            while (runQueue.current.length > 0) {
                const func = runQueue.current.shift();
                debugLogging('QUEUE FUNC start', true);
                await func?.();
                debugLogging('QUEUE FUNC end');
            }
            debugLogging(`QUEUE SIZE after: ${runQueue.current.length}`);
        })();
    };

    const debugLogging = (id: string, useTime?: boolean) => {
        if (useTime === true) {
            apiWrapperRef.current.getLogger().debug(`${id}: ${Date.now()}`);
        } else {
            apiWrapperRef.current.getLogger().debug(id);
        }
    };

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
        return envEnhanced.vscodeApiGlobalInitAwait ?? Promise.resolve();
    };

    const performGlobalInit = async () => {
        if (containerRef.current === null) {
            performErrorHandling(new Error('No htmlContainer found! Aborting...'));
        }
        const envEnhanced = getEnhancedMonacoEnvironment();

        // init will only performed once
        if (envEnhanced.vscodeApiInitialising !== true) {

            const globalInitFunc = async () => {
                debugLogging('GLOBAL INIT', true);

                apiWrapperRef.current.overrideViewsConfig({
                    $type: apiWrapperRef.current.getMonacoVscodeApiConfig().viewsConfig.$type,
                    htmlContainer: containerRef.current!
                });
                await apiWrapperRef.current.start();

                // set if editor mode is available, otherwise text bindings will not work
                haveEditorService.current = envEnhanced.viewServiceType === 'EditorService';

                onVscodeApiInitDone?.(apiWrapperRef.current);

                debugLogging('GLOBAL INIT DONE', true);
            };
            globalInitFunc();
        }
    };

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        const editorInitFunc = async () => {
            try {
                debugLogging('INIT', true);

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
                    const type = apiWrapperRef.current.getMonacoVscodeApiConfig().$type;
                    await editorAppRef.current.start(type, containerRef.current!);

                    onEditorStartDone?.(editorAppRef.current);

                    // originalTextValue and modifiedTextValue useEffects may happen before
                    editorAppRef.current.updateCode({
                        original: originalCode,
                        modified: modifiedCode
                    });
                }

                debugLogging('INIT DONE', true);
            } catch (error) {
                performErrorHandling(error as Error);
            }
        };
        executeQueue('editorInit', editorInitFunc);
    }, [editorAppConfig]);

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        if (languageClientConfig !== undefined) {
            const lcInitFunc = async () => {
                try {
                    debugLogging('INIT LC', true);

                    lcsManagerRef.current = new LanguageClientsManager(apiWrapperRef.current.getLogger());

                    await lcsManagerRef.current.setConfig(languageClientConfig);
                    await lcsManagerRef.current.start();

                    onLanguageClientsStartDone?.(lcsManagerRef.current);

                    debugLogging('INIT LC DONE', true);
                } catch (error) {
                    performErrorHandling(error as Error);
                }
            };
            executeQueue('lcInit', lcInitFunc);
        }
    }, [languageClientConfig]);

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        return () => {
            const disposeFunc = async () => {
                // dispose editor id used and languageclient if enforced
                try {
                    debugLogging('DISPOSE', true);

                    await editorAppRef.current?.dispose();
                    onDisposeEditor?.();

                    if (languageClientConfig?.enforceDispose === true) {
                        lcsManagerRef.current?.dispose();
                        onDisposeLanguageClients?.();
                    }

                    debugLogging('DISPOSE DONE', true);
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
            };
            executeQueue('dispose', disposeFunc);
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
