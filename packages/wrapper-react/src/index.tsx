/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { EditorApp, type EditorAppConfig, type TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfig, LanguageClientManager } from 'monaco-languageclient/lcwrapper';
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
    onLanguageClientsStartDone?: (lcsManager?: LanguageClientManager) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onError?: (error: Error) => void;
    onDisposeEditor?: () => void;
    onDisposeLanguageClient?: () => void;
    modifiedTextValue?: string;
    originalTextValue?: string;
}

// this must be outside of the component as this is valid across multiple instances
const lcsManager = new LanguageClientManager();

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
        modifiedTextValue,
        originalTextValue
    } = props;

    const apiWrapperRef = useRef<MonacoVscodeApiWrapper>(new MonacoVscodeApiWrapper(vscodeApiConfig));
    const haveEditorService = useRef(true);
    const currentEditorConfig = useRef<EditorAppConfig | undefined>(undefined);
    const editorAppRef = useRef<EditorApp>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onTextChangedRef = useRef(onTextChanged);
    const [modifiedCode, setModifiedCode] = useState(modifiedTextValue);
    const [originalCode, setOriginalCode] = useState(originalTextValue);

    const runQueue = useRef<Array<{id: string, func: () => Promise<void>}>>([]);
    let queueAwait: Promise<void> | undefined = undefined;
    let queueResolve: ((value: void | PromiseLike<void>) => void) | undefined = undefined;

    const addQueue = (id: string, func: () => Promise<void>) => {
        debugLogging(`Adding to queue: ${id}`);
        debugLogging(`QUEUE SIZE before: ${runQueue.current.length}`);
        runQueue.current.push({id, func});
    };

    const triggerQueue = () => {
        setInterval(() =>  {
            if (queueAwait === undefined) {
                queueAwait = new Promise<void>((resolve) => {
                    queueResolve = resolve;
                });
                executeQueue();
            }
        }, 50);
    };

    const executeQueue = async () => {
        while (runQueue.current.length > 0) {
            const queueObj = runQueue.current.shift();
            if (queueObj !== undefined) {
                debugLogging(`QUEUE ${queueObj.id} start`, true);
                await queueObj.func();
                debugLogging(`QUEUE ${queueObj.id} SIZE after: ${runQueue.current.length}`);
                debugLogging(`QUEUE ${queueObj.id} end`);
            }
        }
        queueResolve?.();
        queueAwait = undefined;
        queueResolve = undefined;
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
                lcsManager.setLogger(apiWrapperRef.current.getLogger());

                onVscodeApiInitDone?.(apiWrapperRef.current);
                triggerQueue();
                debugLogging('GLOBAL INIT DONE', true);
            };
            globalInitFunc();
        } else if (envEnhanced.vscodeApiInitialised === true) {
            triggerQueue();
        }
    };

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        let createEditor = false;
        // it is possible to run without an editorApp, for example when using the ViewsService
        if (haveEditorService.current) {
            createEditor = currentEditorConfig.current === undefined || JSON.stringify(editorAppConfig) !== JSON.stringify(currentEditorConfig.current);
        }

        const editorInitFunc = async () => {
            try {
                debugLogging('INIT', true);

                if (createEditor) {
                    debugLogging('INIT: Creating editor', true);

                    currentEditorConfig.current = editorAppConfig;
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
                }

                debugLogging('INIT DONE', true);
            } catch (error) {
                performErrorHandling(error as Error);
            }
        };
        addQueue('editorInit', editorInitFunc);
    }, [editorAppConfig]);

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        const lcInitFunc = async () => {
            try {
                debugLogging('INIT LC', true);

                await lcsManager.setConfig(languageClientConfig);
                await lcsManager.start();

                onLanguageClientsStartDone?.(lcsManager);

                debugLogging('INIT LC DONE', true);
            } catch (error) {
                performErrorHandling(error as Error);
            }
        };
        addQueue('lcInit', lcInitFunc);
    }, [languageClientConfig]);

    useEffect(() => {
        // this part runs on mount (componentDidMount)

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        // this part runs on unmount (componentWillUnmount)
        return () => {
            const disposeFunc = async () => {
                // dispose editor if used
                try {
                    debugLogging('DISPOSE', true);

                    await editorAppRef.current?.dispose();
                    onDisposeEditor?.();
                    editorAppRef.current = null;

                    debugLogging('DISPOSE DONE', true);
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
            };
            addQueue('dispose', disposeFunc);
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
