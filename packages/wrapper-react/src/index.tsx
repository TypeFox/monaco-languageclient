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
export type ConfigProcessedResult = {
    textUpdated: boolean;
    modelUpdated: boolean;
    editorApp?: EditorApp;
};

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig?: MonacoVscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
    onVscodeApiInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onEditorStartDone?: (editorApp?: EditorApp) => void;
    onLanguageClientsStartDone?: (lcsManager: LanguageClientManager) => void;
    /**
     * Called when the text in the editor has changed
     */
    onTextChanged?: (textChanges: TextContents) => void;
    /**
     * Called when an error occurred within the component
     */
    onError?: (error: Error) => void;
    onDisposeEditor?: () => void;
    onDisposeLanguageClient?: () => void;
    /**
     * Trigger reprocessing oft the editorAppConfig to update code/models or editor options.
     * This is performed once and only repeated if the value is increased again.
     */
    triggerReprocessConfig?: number;
    /**
     * Always called after the config was re-processed.
     */
    onConfigProcessed?: (result: ConfigProcessedResult) => void;
    /**
     * Enforce disposal of the language client
     */
    enforceLanguageClientDispose?: boolean;
    /**
     * Set the log level for the internal logger
     */
    logLevel?: LogLevel | number;
}

// All must be outside of the component as they ars valid across all instances and should not be re-created
let apiWrapper: MonacoVscodeApiWrapper | undefined;
const lcsManager = new LanguageClientManager();
const haveEditorService = () => {
    return getEnhancedMonacoEnvironment().viewServiceType === 'EditorService';
};
const logger = new ConsoleLogger(LogLevel.Off);

type QueueEntry = {
    id: string;
    func: (htmlContainer: HTMLElement | null) => Promise<void>;
    currentContainer: HTMLElement | null;
};
const runQueue: QueueEntry[] = [];
let runQueueLock = true;
let intervalId: number | unknown | undefined = undefined;
const queueIntervalMs = 10;

const addQueue = (queueEntry: QueueEntry) => {
    debugLogging('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    debugLogging(`Adding to queue: ${queueEntry.id}: QUEUE SIZE before: ${runQueue.length}`);
    runQueue.push(queueEntry);
    kickQueue();
};

const executeQueue = async () => {
    if (runQueue.length > 0) {
        runQueueLock = true;
        while (runQueue.length > 0) {
            const lengthBefore = runQueue.length;
            const queueObj = runQueue.shift();
            debugLogging('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
            debugLogging(`QUEUE ${queueObj?.id} start: SIZE before: ${lengthBefore}`);
            await queueObj?.func(queueObj.currentContainer);
            debugLogging(`QUEUE ${queueObj?.id} end: SIZE after: ${runQueue.length}`);
        }
        runQueueLock = false;
    }
};

const kickQueue = () => {
    if (intervalId === undefined && runQueue.length > 0) {
        intervalId = setInterval(async () =>  {
            debugLogging(`Checking queue (lock state: ${runQueueLock})`);
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

const debugLogging = (id: string) => {
    const now = new Date(Date.now());
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    logger.debug(`[${hours}:${minutes}:${seconds}.${milliseconds}]: ${id}`);
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
        logLevel,
        triggerReprocessConfig,
        enforceLanguageClientDispose
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
    const triggerReprocessConfigRef = useRef<number>(0);
    const enforceLanguageClientDisposeRef = useRef<boolean>(undefined);

    const performErrorHandling = (error: Error) => {
        debugLogging(`ERROR: ${error.message}`);
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

        if (vscodeApiConfig === undefined && envEnhanced.vscodeApiInitialised !== true) {
            throw new Error('vscodeApiConfig is not provided, but the monaco-vscode-api is not initialized! Aborting...');
        }

        // init will only performed once
        if (envEnhanced.vscodeApiInitialising !== true) {

            apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig!);
            const globalInitFunc = async () => {
                try {
                    if (apiWrapper === undefined) throw new Error('Unexpected error occurred: apiWrapper is not available! Aborting...');

                    await apiWrapper.start();
                    onVscodeApiInitDone?.(apiWrapper);
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

    const editorInit = async (htmlContainer: HTMLElement | null) => {
        try {
            // it is possible to run without an editorApp, when the ViewsService or WorkbenchService
            if (haveEditorService()) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (htmlContainer === null || (htmlContainer !== null && htmlContainer.parentElement === null)) {
                    debugLogging('INIT EDITOR: Unable to create editor. HTML container or the parent is missing.');
                } else {
                    if (editorAppRef.current === undefined && !launchingRef.current) {
                        launchingRef.current = true;

                        editorAppRef.current = new EditorApp(editorAppConfigRef.current);
                        if (editorAppRef.current.isStarting() === true || editorAppRef.current.isDisposing() === true) {
                            await Promise.all([
                                editorAppRef.current.getStartingAwait(),
                                editorAppRef.current.getDisposingAwait()
                            ]);
                        }
                        updateModelRelatedRefs();

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
                        // await retrieveContainerRef('INIT EDITOR');
                        await editorAppRef.current.start(htmlContainer);

                        onEditorStartDone?.(editorAppRef.current);
                        launchingRef.current = false;
                        debugLogging('INIT EDITOR: Editor start was successful.');
                    } else {
                        debugLogging('INIT EDITOR: Editor was already started.');
                    }
                }
            } else {
                debugLogging('INIT EDITOR: Do nothing: Using ViewsService');
            }
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const updateEditorModel = async () => {
        try {
            if (!launchingRef.current && editorAppRef.current) {
                editorAppRef.current.updateCodeResources(editorAppConfigRef.current?.codeResources);
                updateModelRelatedRefs();
                onConfigProcessed?.({ modelUpdated: true, textUpdated: true, editorApp: editorAppRef.current });
                debugLogging('UPDATE EDITOR MODEL: Model was updated.');
            } else {
                onConfigProcessed?.({modelUpdated: false, textUpdated: false, editorApp: editorAppRef.current });
                debugLogging('UPDATE EDITOR MODEL: No editor is avilable. Model update was not possible.');
            }
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const updateModelRelatedRefs = () => {
        modifiedCodeRef.current = editorAppConfigRef.current?.codeResources?.modified?.text;
        originalCodeRef.current = editorAppConfigRef.current?.codeResources?.original?.text;
        modifiedCodeUriRef.current = editorAppConfigRef.current?.codeResources?.modified?.uri;
        originalCodeUriRef.current = editorAppConfigRef.current?.codeResources?.original?.uri;
    };

    const disposeEditor = async () => {
        try {
            // dispose editor if used
            if (editorAppRef.current !== undefined) {
                await editorAppRef.current.dispose();
                editorAppRef.current = undefined;
                onDisposeEditor?.();
                debugLogging('DISPOSE: EditorApp was disposed');
            } else {
                debugLogging('DISPOSE: EditorApp is not disposed');
            }
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const processConfig = () => {
        let modelUpdated = false;
        let textUpdated = false;
        try {
            debugLogging('CONFIG PROCESSED: Started');
            if (!launchingRef.current && editorAppRef.current) {
                if (editorAppConfigRef.current?.codeResources !== undefined) {
                    const newModifiedCodeUri = editorAppConfigRef.current.codeResources.modified?.uri;
                    const newOriginalCodeUri = editorAppConfigRef.current.codeResources.original?.uri;

                    const modifiedUri = modifiedCodeUriRef.current !== newModifiedCodeUri ? newModifiedCodeUri : undefined;
                    const originalUri = originalCodeUriRef.current !== newOriginalCodeUri ? newOriginalCodeUri : undefined;
                    // re-create the editor if the URIs have changed
                    if (modifiedUri !== undefined || originalUri !== undefined) {
                        modelUpdated = true;
                    } else {
                        const newModifiedCode = editorAppConfigRef.current.codeResources.modified?.text;
                        const newOriginalCode = editorAppConfigRef.current.codeResources.original?.text;
                        const modified = modifiedCodeRef.current !== newModifiedCode ? newModifiedCode : undefined;
                        const original = originalCodeRef.current !== newOriginalCode ? newOriginalCode : undefined;
                        if (modified !== undefined || original !== undefined) {
                            textUpdated = true;
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
            // notitfy now if no async model update was necessary
            if (!modelUpdated) {
                onConfigProcessed?.({modelUpdated, textUpdated, editorApp: editorAppRef.current });
            }
            debugLogging('CONFIG PROCESSED: Done');
        } catch (error) {
            performErrorHandling(error as Error);
        }
        return modelUpdated;
    };

    useEffect(() => {
        // fast-fail
        if (editorAppConfig === undefined) return;

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        editorAppConfigRef.current = editorAppConfig;
        // it is possible to run without an editorApp, when the ViewsService or WorkbenchService
        if (haveEditorService()) {
            if (editorAppRef.current === undefined) {
                addQueue({ id: 'editorInit', func: editorInit, currentContainer: containerRef.current});
            } else {
                debugLogging('CHECK EDITOR: Editor already created. No queueing necessary.');
            }
        } else {
            debugLogging('INIT EDITOR: Do nothing: Using ViewsService');
        }
    }, [editorAppConfig]);

    useEffect(() => {
        const triggerValue = triggerReprocessConfig ?? 0;
        if (triggerValue > triggerReprocessConfigRef.current) {
            debugLogging('REPROCESS CONFIG: Triggered');
            const updateModel = processConfig();
            if (updateModel) {
                addQueue({ id: 'modelUpdate', func: updateEditorModel, currentContainer: containerRef.current});
            }
            triggerReprocessConfigRef.current = triggerValue;
        } else {
            debugLogging('REPROCESS CONFIG: Denied');
        }
    }, [triggerReprocessConfig]);

    const lcInitFunc = async () => {
        try {
            await lcsManager.start();
            onLanguageClientsStartDone?.(lcsManager);
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    useEffect(() => {
        // fast-fail
        if (languageClientConfig === undefined) return;

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        lcsManager.setLogLevel(languageClientConfig.logLevel);
        lcsManager.setConfig(languageClientConfig);
        if (!lcsManager.isStarted() && (enforceLanguageClientDisposeRef.current === undefined || !enforceLanguageClientDisposeRef.current)) {
            addQueue({ id:'lcInit', func: lcInitFunc, currentContainer: containerRef.current });
        } else {
            debugLogging('INIT LC: Language client is already running. No need to schedule async start.');
        }
    }, [languageClientConfig]);

    useEffect(() => {
        enforceLanguageClientDisposeRef.current = enforceLanguageClientDispose === true;
        if (enforceLanguageClientDisposeRef.current === true) {
            const disposeLCFunc = async () => {
                try {
                    await lcsManager.dispose();
                    onDisposeLanguageClient?.();
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
            };
            if (lcsManager.isStarted()) {
                addQueue({ id:'lcDispose', func: disposeLCFunc, currentContainer: containerRef.current });
            } else {
                debugLogging('ENFORCE DISPOSE LC: Denied: No language client is running.');
            }
        } else {
            debugLogging('ENFORCE DISPOSE LC: Denied: enforceLanguageClientDisposeRef.current is false.');
            if (!lcsManager.isStarted()) {
                addQueue({ id:'lcInit', func: lcInitFunc, currentContainer: containerRef.current });
            }
        }
    }, [enforceLanguageClientDispose]);

    useEffect(() => {
        // this part runs on mount (componentDidMount)

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        // this part runs on unmount (componentWillUnmount)
        return () => {
            addQueue({ id:'disposeEditor', func: disposeEditor, currentContainer: containerRef.current });
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
