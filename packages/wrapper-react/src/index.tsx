/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger } from 'monaco-languageclient/common';
import { EditorApp, type EditorAppConfig, type TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfig, LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React, { type CSSProperties, useEffect, useRef } from 'react';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig?: MonacoVscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
    onVscodeApiInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onEditorStartDone?: (editorApp?: EditorApp) => void;
    onLanguageClientsStartDone?: (lcsManager: LanguageClientManager) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onConfigProcessed?: (editorApp?: EditorApp) => void;
    onError?: (error: Error) => void;
    onDisposeEditor?: () => void;
    onDisposeLanguageClient?: () => void;
    logLevel?: LogLevel | number;
}

// All must be outside of the component as they ars valid across all instances and should not be re-created
let apiWrapper: MonacoVscodeApiWrapper | undefined;
const lcsManager = new LanguageClientManager();
const haveEditorService = () => {
    return getEnhancedMonacoEnvironment().viewServiceType === 'EditorService';
};
const logger = new ConsoleLogger(LogLevel.Off);

const runQueue: Array<{id: string, func: () => Promise<void>}> = [];
let runQueueLock = true;
let intervalId: number | unknown | undefined = undefined;
const queueIntervalMs = 25;

const addQueue = (id: string, func: () => Promise<void>) => {
    debugLogging('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    debugLogging(`Adding to queue: ${id}: QUEUE SIZE before: ${runQueue.length}`);
    runQueue.push({id, func});
    kickQueue();
};

const executeQueue = async () => {
    if (runQueue.length > 0) {
        runQueueLock = true;
        while (runQueue.length > 0) {
            const lengthBefore = runQueue.length;
            const queueObj = runQueue.shift();
            debugLogging('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
            debugLogging(`QUEUE ${queueObj?.id} start: SIZE before: ${lengthBefore}`, true);
            await queueObj?.func();
            debugLogging(`QUEUE ${queueObj?.id} end: SIZE after: ${runQueue.length}`);
        }
        runQueueLock = false;
    }
};

const kickQueue = () => {
    if (intervalId === undefined && runQueue.length > 0) {
        intervalId = setInterval(async () =>  {
            debugLogging('Checking queue...' + runQueueLock);
            if (!runQueueLock) {
                await executeQueue();
                stopQueue();
            }
        }, queueIntervalMs);
    }
};

const stopQueue = () => {
    if (intervalId !== undefined && runQueue.length === 0) {
        debugLogging('Stopping queue...');
        clearInterval(intervalId as number);
        intervalId = undefined;
    }
};

const debugLogging = (id: string, useTime?: boolean) => {
    if (useTime === true) {
        logger.debug(`${id}: ${Date.now()}`);
    } else {
        logger.debug(id);
    }
};

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
        onConfigProcessed,
        onError,
        onDisposeEditor,
        onDisposeLanguageClient,
        logLevel
    } = props;

    const editorAppRef = useRef<EditorApp>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const modifiedCodeUriRef = useRef<string>(undefined);
    const modifiedCodeRef = useRef<string>(undefined);
    const originalCodeUriRef = useRef<string>(undefined);
    const originalCodeRef = useRef<string>(undefined);
    const onTextChangedRef = useRef(onTextChanged);
    const launchingRef = useRef<boolean>(false);
    const editorAppConfigRef = useRef<EditorAppConfig>(undefined);

    const performErrorHandling = (error: Error) => {
        debugLogging(`ERROR: ${error.message}`, true);
        if (onError) {
            onError(error);
        } else {
            debugLogging(`INTERCEPTED Error: ${error}. Stopping queue...`);
            runQueueLock = false;
            throw error;
        }
    };

    const performGlobalInit = async () => {
        if (containerRef.current === null) {
            performErrorHandling(new Error('No htmlContainer found! Aborting...'));
        }
        const envEnhanced = getEnhancedMonacoEnvironment();

        // let apiConfig: MonacoVscodeApiConfig;
        if (vscodeApiConfig === undefined && envEnhanced.vscodeApiInitialised !== true) {
            throw new Error('vscodeApiConfig is not provided, but the monaco-vscode-api is not initialized! Aborting...');
        }

        // init will only performed once
        if (envEnhanced.vscodeApiInitialising !== true) {

            apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig!);
            const globalInitFunc = async () => {
                try {
                    debugLogging('GLOBAL INIT', true);

                    if (apiWrapper === undefined) throw new Error('Unexpected error occurred: apiWrapper is not available! Aborting...');

                    if (apiWrapper.getMonacoVscodeApiConfig().viewsConfig.$type === 'EditorService') {
                        apiWrapper.overrideViewsConfig({
                            $type: 'EditorService',
                            htmlContainer: containerRef.current!
                        });
                    }
                    await apiWrapper.start();
                    onVscodeApiInitDone?.(apiWrapper);

                    debugLogging('GLOBAL INIT DONE', true);

                    runQueueLock = false;
                } catch (error) {
                    performErrorHandling(error as Error);
                }
            };
            globalInitFunc();
        } else if (envEnhanced.vscodeApiInitialised === true) {
            if (runQueueLock && intervalId !== undefined) {
                runQueueLock = false;
            }
        }
    };

    const editorInit = async () => {
        try {
            debugLogging('INIT EDITOR', true);
            // it is possible to run without an editorApp, when the ViewsService or WorkbenchService
            if (haveEditorService()) {
                if (editorAppRef.current === undefined && !launchingRef.current) {
                    launchingRef.current = true;
                    debugLogging('INIT: Creating editor', true);

                    editorAppRef.current = new EditorApp(editorAppConfigRef.current);
                    if (editorAppRef.current.isStarting() === true || editorAppRef.current.isDisposing() === true) {
                        await Promise.all([
                            editorAppRef.current.getStartingAwait(),
                            editorAppRef.current.getDisposingAwait()
                        ]);
                    }
                    modifiedCodeRef.current = editorAppConfigRef.current?.codeResources?.modified?.text;
                    originalCodeRef.current = editorAppConfigRef.current?.codeResources?.original?.text;
                    modifiedCodeUriRef.current = editorAppConfigRef.current?.codeResources?.modified?.uri;
                    originalCodeUriRef.current = editorAppConfigRef.current?.codeResources?.original?.uri;

                    editorAppRef.current.registerOnTextChangedCallback((textChanges) => {
                        if (textChanges.modified !== undefined) {
                            modifiedCodeRef.current = textChanges.modified;
                        }
                        if (textChanges.original !== undefined) {
                            originalCodeRef.current = textChanges.original;
                        }
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
                    await editorAppRef.current.start(containerRef.current!);

                    onEditorStartDone?.(editorAppRef.current);
                    launchingRef.current = false;
                } else {
                    debugLogging('INIT EDITOR: Editor already created', true);
                }
            } else {
                debugLogging('INIT EDITOR: Do nothing: Using ViewsService', true);
            }
            debugLogging('INIT EDITOR: Done', true);
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const updateEditorModel = async () => {
        try {
            debugLogging('UPDATE EDITOR MODEL', true);
            if (!launchingRef.current && editorAppRef.current) {
                editorAppRef.current.updateCodeResources(editorAppConfigRef.current?.codeResources);
                onConfigProcessed?.(editorAppRef.current);
            } else {
                debugLogging('UPDATE EDITOR MODEL: Not Possible: No editor', true);
            }
            debugLogging('UPDATE EDITOR MODEL: Done', true);
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const disposeEditor = async () => {
        try {
            // dispose editor if used
            debugLogging('DISPOSE', true);

            if (editorAppRef.current !== undefined) {
                await editorAppRef.current.dispose();
                editorAppRef.current = undefined;
                onDisposeEditor?.();
            } else {
                debugLogging('DISPOSE: EditorApp is not disposed', true);
            }
            debugLogging('DISPOSE DONE', true);
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const processConfig = () => {
        let updateModel = false;
        try {
            debugLogging('CONFIG PROCESSED', true);
            if (!launchingRef.current && editorAppRef.current) {
                if (editorAppConfigRef.current?.codeResources !== undefined) {
                    const newModifiedCodeUri = editorAppConfigRef.current.codeResources.modified?.uri;
                    const newOriginalCodeUri = editorAppConfigRef.current.codeResources.original?.uri;

                    const modifiedUri = modifiedCodeUriRef.current !== newModifiedCodeUri ? newModifiedCodeUri : undefined;
                    const originalUri = originalCodeUriRef.current !== newOriginalCodeUri ? newOriginalCodeUri : undefined;
                    // re-create the editor if the URIs have changed
                    if (modifiedUri !== undefined || originalUri !== undefined) {
                        updateModel = true;
                    } else {
                        const newModifiedCode = editorAppConfigRef.current.codeResources.modified?.text;
                        const newOriginalCode = editorAppConfigRef.current.codeResources.original?.text;
                        const modified = modifiedCodeRef.current !== newModifiedCode ? newModifiedCode : undefined;
                        const original = originalCodeRef.current !== newOriginalCode ? newOriginalCode : undefined;
                        if (modified !== undefined || original !== undefined) {
                            editorAppRef.current.updateCode({ modified, original });
                        }
                    }
                }
                if (editorAppConfigRef.current?.editorOptions !== undefined) {
                    if (!editorAppRef.current.isDiffEditor()) {
                        editorAppRef.current.getEditor()?.updateOptions(editorAppConfigRef.current.editorOptions);
                    }
                }
                if (editorAppConfigRef.current?.diffEditorOptions !== undefined) {
                    if (editorAppRef.current.isDiffEditor()) {
                        editorAppRef.current.getDiffEditor()?.updateOptions(editorAppConfigRef.current.diffEditorOptions);
                    }
                }
            }
            if (!updateModel) {
                onConfigProcessed?.(editorAppRef.current);
            }
            debugLogging('CONFIG PROCESSED: Done', true);
        } catch (error) {
            performErrorHandling(error as Error);
        }
        return updateModel;
    };

    useEffect(() => {
        // fast-fail
        if (editorAppConfig === undefined) return;

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        editorAppConfigRef.current = editorAppConfig;
        // it is possible to run without an editorApp, when the ViewsService or WorkbenchService
        if (haveEditorService()) {
            const updateModel = processConfig();
            if (updateModel) {
                addQueue('model update', updateEditorModel);
            } else {
                if (editorAppRef.current === undefined) {
                    addQueue('editorInit', editorInit);
                } else {
                    debugLogging('CHECK EDITOR: Editor already created', true);
                }
            }
        } else {
            debugLogging('INIT EDITOR: Do nothing: Using ViewsService', true);
        }
    }, [editorAppConfig]);

    useEffect(() => {
        // fast-fail
        if (languageClientConfig === undefined) return;

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        if (languageClientConfig.enforceDispose === true) {
            const disposeLCFunc = async () => {
                // dispose editor if used
                try {
                    debugLogging('DISPOSE LC ENFORCED', true);

                    await lcsManager.dispose();
                    onDisposeLanguageClient?.();

                    debugLogging('DISPOSE LC ENFORCED DONE', true);
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
            };
            addQueue('dispose lc', disposeLCFunc);
        } else {
            const lcInitFunc = async () => {
                try {
                    debugLogging('INIT LC', true);

                    lcsManager.setLogLevel(languageClientConfig.logLevel);
                    lcsManager.setConfig(languageClientConfig);
                    if (!lcsManager.isStarted()) {
                        await lcsManager.start();
                        onLanguageClientsStartDone?.(lcsManager);
                        debugLogging('INIT LC: Language client started', true);
                    } else {
                        debugLogging('INIT LC: Language client is not (re-)started', true);
                    }
                    debugLogging('INIT LC DONE', true);
                } catch (error) {
                    performErrorHandling(error as Error);
                }
            };
            addQueue('lcInit', lcInitFunc);
        }
    }, [languageClientConfig]);

    useEffect(() => {
        // this part runs on mount (componentDidMount)

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        // this part runs on unmount (componentWillUnmount)
        return () => {
            addQueue ('disposeEditor', disposeEditor);
        };
    }, []);

    useEffect(() => {
        if (logLevel !== undefined) {
            logger.setLevel(logLevel);
        }
    }, [logLevel]);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
