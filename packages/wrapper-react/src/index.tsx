/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import * as vscode from 'vscode';
import React, { CSSProperties } from 'react';
import { EditorAppClassic, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { Logger } from 'monaco-languageclient/tools';

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
    private logger: Logger = new Logger();
    private containerElement?: HTMLDivElement;
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;
    private started: (value: void | PromiseLike<void>) => void;

    constructor(props: T) {
        super(props);
        const { userConfig } = this.props;
        this.logger.updateConfig(userConfig.loggerConfig);
    }

    override async componentDidMount() {
        this.logger.debug('Called: componentDidMount');
        if (!this.isRestarting) {
            await this.handleReinit();
        }
    }

    override async componentDidUpdate(prevProps: T) {
        this.logger.debug('Called: componentDidUpdate');
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

    override componentWillUnmount() {
        this.logger.debug('Called: componentWillUnmount');
        this.destroyMonaco();
    }

    protected assignRef = (component: HTMLDivElement) => {
        this.logger.debug('Called: assignRef');
        this.containerElement = component;
    };

    override render() {
        this.logger.debug('Called: render');
        return (
            <div
                ref={this.assignRef}
                style={this.props.style}
                className={this.props.className}
            />
        );
    }

    protected async handleReinit() {
        // block everything unti until (re)-start is complete
        this.isRestarting = new Promise<void>((resolve) => {
            this.started = resolve;
        });

        await this.destroyMonaco();
        await this.initMonaco();
        await this.startMonaco();
    }

    protected isReInitRequired(prevProps: T) {
        const { className, userConfig } = this.props;
        let mustReInit = false;
        if (prevProps.className !== className && this.containerElement) {
            this.containerElement.className = className ?? '';
            mustReInit = true;
        }
        return mustReInit || this.wrapper.isReInitRequired(userConfig, prevProps.userConfig);
    }

    protected async destroyMonaco(): Promise<void> {
        if (this.wrapper.isInitDone()) {
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

                // once awaiting start is done onLoad is called if available
                onLoad?.(this.wrapper);
                this.handleOnTextChanged();
            } catch (e) {
                if (onError) {
                    onError(e);
                } else {
                    throw e;
                }
            } finally {
                this.started();
                this.isRestarting = undefined;
            }
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

    getEditorWrapper() {
        return this.wrapper;
    }

    /**
     * Executes a custom VSCode/LSP command by name with args, and returns the result
     * @param cmd Command to execute
     * @param args Arguments to pass along with this command
     * @returns The result of executing this command in the language server
     */
    executeCommand(cmd: string, ...args: unknown[]): Thenable<unknown> {
        return vscode.commands.executeCommand(cmd, ...args);
    }
}
