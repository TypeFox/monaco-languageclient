/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorAppClassic, EditorAppExtended, MonacoEditorLanguageClientWrapper, UserConfig, WorkerConfigDirect, WorkerConfigOptions } from 'monaco-editor-wrapper';
import * as monaco from 'monaco-editor';
import * as vscode from 'vscode';
import React, { CSSProperties } from 'react';

export type MonacoEditorProps = {
    style?: CSSProperties;
    className?: string;
    userConfig: UserConfig,
    onTextChanged?: (text: string, isDirty: boolean) => void;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError?: (e: any) => void;
}

export class MonacoEditorReactComp<T extends MonacoEditorProps = MonacoEditorProps> extends React.Component<T> {

    private wrapper: MonacoEditorLanguageClientWrapper = new MonacoEditorLanguageClientWrapper();
    private containerElement?: HTMLDivElement;
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;
    private started: (value: void | PromiseLike<void>) => void;

    constructor(props: T) {
        super(props);
        this.containerElement = undefined;
    }

    override async componentDidMount() {
        await this.handleReinit();
    }

    protected async handleReinit() {
        await this.destroyMonaco();
        await this.initMonaco();
        await this.startMonaco();
    }

    override async componentDidUpdate(prevProps: T) {
        const { userConfig } = this.props;
        const { wrapper } = this;

        const mustReInit = this.isReInitRequired(prevProps);

        if (mustReInit) {
            await this.handleReinit();
        } else {
            // the function now ensure a model update is only required if something else than the code changed
            this.wrapper.updateModel(userConfig.wrapperConfig.editorAppConfig);

            const config = userConfig.wrapperConfig.editorAppConfig;
            const prevConfig = prevProps.userConfig.wrapperConfig.editorAppConfig;
            if (prevConfig.$type === 'classic' && config.$type === 'classic') {
                if (prevConfig.editorOptions !== config.editorOptions) {
                    (wrapper.getMonacoEditorApp() as EditorAppClassic).updateMonacoEditorOptions(config.editorOptions ?? {});
                }
            }
        }
    }

    protected isReInitRequired(prevProps: T) {
        const { className, userConfig } = this.props;
        const { wrapper } = this;

        if (prevProps.className !== className && this.containerElement) {
            this.containerElement.className = className ?? '';
        }

        let mustReInit = false;
        const config = userConfig.wrapperConfig.editorAppConfig;
        const prevConfig = prevProps.userConfig.wrapperConfig.editorAppConfig;
        const prevWorkerOptions = prevProps.userConfig.languageClientConfig?.options;
        const currentWorkerOptions = userConfig.languageClientConfig?.options;
        const prevIsWorker = (prevWorkerOptions?.$type === 'WorkerDirect');
        const currentIsWorker = (currentWorkerOptions?.$type === 'WorkerDirect');
        const prevIsWorkerConfig = (prevWorkerOptions?.$type === 'WorkerConfig');
        const currentIsWorkerConfig = (currentWorkerOptions?.$type === 'WorkerConfig');

        // check if both are configs and the workers are both undefined
        if (prevIsWorkerConfig && prevIsWorker === undefined && currentIsWorkerConfig && currentIsWorker === undefined) {
            mustReInit = (prevWorkerOptions as WorkerConfigOptions).url !== (currentWorkerOptions as WorkerConfigOptions).url;
            // check if both are workers and configs are both undefined
        } else if (prevIsWorkerConfig === undefined && prevIsWorker && currentIsWorkerConfig === undefined && currentIsWorker) {
            mustReInit = (prevWorkerOptions as WorkerConfigDirect).worker !== (currentWorkerOptions as WorkerConfigDirect).worker;
            // previous was worker and current config is not or the other way around
        } else if (prevIsWorker && currentIsWorkerConfig || prevIsWorkerConfig && currentIsWorker) {
            mustReInit = true;
        }

        if (prevConfig.$type === 'classic' && config.$type === 'classic') {
            mustReInit = (wrapper?.getMonacoEditorApp() as EditorAppClassic).isAppConfigDifferent(prevConfig, config, false) === true;
        } else if (prevConfig.$type === 'extended' && config.$type === 'extended') {
            mustReInit = (wrapper?.getMonacoEditorApp() as EditorAppExtended).isAppConfigDifferent(prevConfig, config, false) === true;
        }

        return mustReInit;
    }

    override componentWillUnmount() {
        this.destroyMonaco();
    }

    protected assignRef = (component: HTMLDivElement) => {
        this.containerElement = component;
    };

    protected async destroyMonaco(): Promise<void> {
        if (this.wrapper) {
            if (this.isRestarting) {
                await this.isRestarting;
            }
            try {
                await this.wrapper.dispose();
            } catch {
                // The language client may throw an error during disposal.
                // This should not prevent us from continue working.
            }
        }
        if (this._subscription) {
            this._subscription.dispose();
        }
    }

    protected async initMonaco() {
        const {
            userConfig
        } = this.props;

        // block "destroyMonaco" until start is complete
        this.isRestarting = new Promise<void>((resolve) => {
            this.started = resolve;
        });
        await this.wrapper.init(userConfig);
    }

    protected async startMonaco() {
        const {
            className,
            onLoad,
            onError,
        } = this.props;

        if (this.containerElement) {
            this.containerElement.className = className ?? '';

            // exceptions are forwarded to onError callback or the exception is thrown
            try {
                await this.wrapper.start(this.containerElement);
            } catch (e) {
                if (onError) {
                    onError(e);
                } else {
                    throw e;
                }
            }
            this.started();
            this.isRestarting = undefined;

            // once awaiting isStarting is done onLoad is called if available
            onLoad?.(this.wrapper);

            this.handleOnTextChanged();
        }
    }

    private handleOnTextChanged() {
        const {
            userConfig,
            onTextChanged
        } = this.props;
        if (!onTextChanged) return;

        const model = this.wrapper.getModel();
        if (model) {
            const verifyModelContent = () => {
                const modelText = model.getValue();
                onTextChanged(modelText, modelText !== userConfig.wrapperConfig.editorAppConfig.code);
            };

            this._subscription = model.onDidChangeContent(() => {
                verifyModelContent();
            });
            // do it initially
            verifyModelContent();
        }
    }

    updateLayout(): void {
        this.wrapper.updateLayout();
    }

    getEditorWrapper() {
        return this.wrapper;
    }

    /**
     * Executes a custom LSP command by name with args, and returns the result
     * @param cmd Command to execute
     * @param args Arguments to pass along with this command
     * @returns The result of executing this command in the language server
     */
    executeCommand(cmd: string, ...args: unknown[]): Thenable<unknown> {
        return vscode.commands.executeCommand(cmd, ...args);
    }

    override render() {
        return (
            <div
                ref={this.assignRef}
                style={this.props.style}
                className={this.props.className}
            />
        );
    }
}
