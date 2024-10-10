/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
} from '@angular/core';

import * as monaco from 'monaco-editor';
import {
    MonacoEditorLanguageClientWrapper,
    WrapperConfig,
} from 'monaco-editor-wrapper';

@Component({
    standalone: true,
    selector: 'monaco-angular-wrapper',
    template: `
        <div>
            <div id='monaco-editor-root' class='monaco-editor'></div>
        </div>
    `,
    styles: `
.monaco-editor {
  height: 50vh;
}
`,
})
export class MonacoAngularWrapperComponent implements AfterViewInit, OnDestroy {
    @Output() onTextChanged = new EventEmitter<string>();
    @Input() wrapperConfig: WrapperConfig;
    title = 'angluar-lang-client';
    private wrapper: MonacoEditorLanguageClientWrapper =
        new MonacoEditorLanguageClientWrapper();
    private containerElement?: HTMLDivElement;
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;
    private started: (value: void | PromiseLike<void>) => void;

    async ngAfterViewInit(): Promise<void> {
        this.containerElement = document.getElementById(
            'monaco-editor-root'
        ) as HTMLDivElement;
        //  await this.handleReinit();
        try {
            await this.wrapper.initAndStart(this.wrapperConfig);
        } catch (e) {
            console.error(e);
        }
    }

    protected async handleReinit() {
        await this.destroyMonaco();
        await this.initMonaco();
        await this.startMonaco();
    }

    protected async destroyMonaco(): Promise<void> {

        if (this.isRestarting) {
            await this.isRestarting;
        }
        try {
            await this.wrapper.dispose();
        } catch {
            // The language client may throw an error during disposal.
            // This should not prevent us from continue working.
        }
        if (this._subscription) {
            this._subscription.dispose();
        }
    }

    async ngOnDestroy() {
        this.destroyMonaco();
    }

    protected async initMonaco() {
        this.isRestarting = new Promise<void>((resolve) => {
            this.started = resolve;
        });
        await this.wrapper.init(this.wrapperConfig);
    }

    protected async startMonaco() {
        if (this.containerElement) {
            // exceptions are forwarded to onError callback or the exception is thrown
            try {
                await this.wrapper.start();
            } catch (e) {
                console.error(e);
            }
            this.started();
            this.isRestarting = undefined;

            this.handleOnTextChanged();
        }
    }

    handleOnTextChanged() {
        const textModels = this.wrapper.getTextModels();
        if (textModels) {
            const verifyModelContent = () => {
                const text = textModels.text?.getValue() ?? '';
                const textOriginal = textModels.textOriginal?.getValue() ?? '';
                const codeResources =
                    this.wrapperConfig.editorAppConfig.codeResources;
                const dirty = text !== codeResources?.main?.text;
                const dirtyOriginal =
                    textOriginal !== codeResources?.original?.text;
                this.onTextChanged.emit(text);
                console.log('dirty , dirtyOriginal', dirty, dirtyOriginal);
            };

            const newSubscriptions: monaco.IDisposable[] = [];

            if (textModels.text) {
                newSubscriptions.push(
                    textModels.text.onDidChangeContent(() => {
                        verifyModelContent();
                    })
                );
            }
        }
    }
}
