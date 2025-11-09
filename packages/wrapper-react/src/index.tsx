/* --------------------------------------------------------------------------------------------
* Copyright (c) 2024 TypeFox and others.
* Licensed under the MIT License. See LICENSE in the package root for license information.
* ------------------------------------------------------------------------------------------ */

import * as monaco from '@codingame/monaco-vscode-editor-api';
import { EditorApp, type EditorAppConfig, type TextContents } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfig, LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { getEnhancedMonacoEnvironment, type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import React, { type CSSProperties, useEffect, useRef } from 'react';

export type ResolveFc = (value: void | PromiseLike<void>) => void;

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig?: EditorAppConfig;
    languageClientConfig?: LanguageClientConfig;
    enforceDisposeLanguageClient?: boolean;
    onVscodeApiInitDone?: (monacoVscodeApiManager: MonacoVscodeApiWrapper) => void;
    onEditorStartDone?: (editorApp?: EditorApp) => void;
    onLanguageClientsStartDone?: (lcsManager?: LanguageClientManager) => void;
    onTextChanged?: (textChanges: TextContents) => void;
    onConfigProcessed?: (editorApp?: EditorApp) => void;
    onError?: (error: Error) => void;
    onDisposeEditor?: () => void;
    onDisposeLanguageClient?: () => void;
    modifiedTextValue?: string;
    originalTextValue?: string;
}

// All must be outside of the component as they ars valid across all instances and should not be re-created
let apiWrapper: MonacoVscodeApiWrapper | undefined;
const lcsManager = new LanguageClientManager();
const haveEditorService = () => {
    return getEnhancedMonacoEnvironment().viewServiceType === 'EditorService';
};

const runQueue: Array<{id: string, func: () => Promise<void>}> = [];
// let deferred: Deferred = new Deferred();
let lock = true;
let intervalId: number | unknown | undefined = undefined;

const addQueue = (id: string, func: () => Promise<void>) => {
    debugLogging('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    debugLogging(`Adding to queue: ${id}: QUEUE SIZE before: ${runQueue.length}`);
    runQueue.push({id, func});

    kickQueue();
};

const executeQueue = async () => {
    // while (runQueue.length > 0) {
    console.log(`Queue size: ${runQueue.length}`);

    if (runQueue.length > 0) {
        lock = true;
        while (runQueue.length > 0) {
            // deferred = new Deferred();
            const lengthBefore = runQueue.length;
            const queueObj = runQueue.shift();
            debugLogging('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
            debugLogging(`QUEUE ${queueObj?.id} start: SIZE before: ${lengthBefore}`, true);
            await queueObj?.func();
            debugLogging(`QUEUE ${queueObj?.id} end: SIZE after: ${runQueue.length}`);
            // deferred.resolve();
        }
        lock = false;
    }
};

const kickQueue = () => {
    if (intervalId === undefined && runQueue.length > 0) {
        intervalId = setInterval(async () =>  {
            debugLogging('Checking queue...');
            if (!lock) {
            // await deferred.promise;
                executeQueue();
                stopQueue();
            }
        }, 50);
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
        apiWrapper?.getLogger().debug(`${id}: ${Date.now()}`);
    } else {
        apiWrapper?.getLogger().debug(id);
    }
};

export const MonacoEditorReactComp: React.FC<MonacoEditorProps> = (props) => {
    const {
        style,
        className,
        vscodeApiConfig,
        editorAppConfig,
        languageClientConfig,
        enforceDisposeLanguageClient,
        onVscodeApiInitDone,
        onEditorStartDone,
        onLanguageClientsStartDone,
        onTextChanged,
        onConfigProcessed,
        onError,
        onDisposeEditor,
        onDisposeLanguageClient,
        modifiedTextValue,
        originalTextValue
    } = props;

    const editorAppRef = useRef<EditorApp>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const onTextChangedRef = useRef(onTextChanged);
    const modifiedCode = useRef<string>(modifiedTextValue);
    const originalCode = useRef<string>(originalTextValue);
    const launchingRef = useRef<boolean>(false);
    const editorAppConfigRef = useRef<EditorAppConfig>(undefined);

    const performErrorHandling = (error: Error) => {
        if (onError) {
            onError(error);
        } else {
            throw error;
        }
    };

    useEffect(() => {
        // this is only available if EditorService is configured
        if (haveEditorService() && modifiedTextValue !== undefined) {
            modifiedCode.current = modifiedTextValue;
            editorAppRef.current?.updateCode({modified: modifiedTextValue});
        }
    }, [modifiedTextValue]);

    useEffect(() => {
        // this is only available if EditorService is configured
        if (haveEditorService() && originalTextValue !== undefined) {
            originalCode.current = originalTextValue;
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

            apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
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

                    lcsManager.setLogger(apiWrapper.getLogger());

                    onVscodeApiInitDone?.(apiWrapper);
                    debugLogging('GLOBAL INIT DONE', true);

                    // deferred?.resolve();
                    lock = false;
                } catch (error) {
                    performErrorHandling(error as Error);
                }
            };
            globalInitFunc();
        }
    };

    const editorInitFunc = async () => {
        try {
            debugLogging('INIT', true);

            // it is possible to run without an editorApp, for example when using the ViewsService
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

                    editorAppRef.current.registerOnTextChangedCallback((textChanges) => {
                        if (textChanges.modified !== undefined) {
                            modifiedCode.current = textChanges.modified;
                        }
                        if (textChanges.original !== undefined) {
                            originalCode.current = textChanges.original;
                        }
                        if (onTextChangedRef.current !== undefined) {
                            onTextChangedRef.current(textChanges);
                        }
                    });
                    await editorAppRef.current.start(containerRef.current!);

                    onEditorStartDone?.(editorAppRef.current);
                    launchingRef.current = false;
                }
            }

            debugLogging('INIT DONE', true);
        } catch (error) {
            performErrorHandling(error as Error);
        }
    };

    const configProcessedFunc = () => {
        if (!launchingRef.current) {
            if (editorAppConfigRef.current?.codeResources !== undefined && editorAppRef.current) {
                editorAppRef.current.updateCodeResources(editorAppConfigRef.current.codeResources);
            }
            if (editorAppConfigRef.current?.editorOptions !== undefined && editorAppRef.current) {
                if (!editorAppRef.current.isDiffEditor()) {
                    editorAppRef.current.getEditor()?.updateOptions(editorAppConfigRef.current.editorOptions as monaco.editor.IEditorOptions);
                }
            }
            if (editorAppConfigRef.current?.diffEditorOptions !== undefined && editorAppRef.current) {
                if (editorAppRef.current.isDiffEditor()) {
                    editorAppRef.current.getDiffEditor()?.updateOptions(editorAppConfigRef.current.diffEditorOptions as monaco.editor.IDiffEditorOptions);
                }
            }
        }
        onConfigProcessed?.(editorAppRef.current);
        debugLogging('Config processed');
    };

    useEffect(() => {
        // fast-fail
        if (editorAppConfig === undefined) return;

        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        editorAppConfigRef.current = editorAppConfig;

        addQueue('editorInit', editorInitFunc);
        if (editorAppRef.current !== undefined && !launchingRef.current) {
            configProcessedFunc();
        }
    }, [editorAppConfig]);

    useEffect(() => {
        // fast-fail
        if (languageClientConfig === undefined) return;

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
                debugLogging('DISPOSE', true);

                if (editorAppRef.current !== undefined) {
                    await editorAppRef.current.dispose();
                    editorAppRef.current = undefined;
                    onDisposeEditor?.();
                }

                debugLogging('DISPOSE DONE', true);
            };
            addQueue('dispose', disposeFunc);
        };
    }, []);

    useEffect(() => {
        // always try to perform global init. Reason: we cannot ensure order
        performGlobalInit();

        if (enforceDisposeLanguageClient === true) {
            const disposeLCFunc = async () => {
                // dispose editor if used
                try {
                    debugLogging('DISPOSE LC', true);

                    await lcsManager.dispose();
                    onDisposeLanguageClient?.();

                    debugLogging('DISPOSE LC DONE', true);
                } catch (error) {
                    // The language client may throw an error during disposal, but we want to continue anyway
                    performErrorHandling(new Error(`Unexpected error occurred during disposal of the language client: ${error}`));
                }
            };
            addQueue('dispose lc', disposeLCFunc);
        }
    }, [enforceDisposeLanguageClient]);

    return (
        <div
            ref={containerRef}
            style={style}
            className={className}
        />
    );
};
