/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
    Component,
    effect,
    EventEmitter,
    input,
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
    templateUrl: './monaco-angular-wrapper.component.html',
    styleUrls: ['./monaco-angular-wrapper.component.scss'],
})
export class MonacoAngularWrapperComponent implements OnDestroy {
    @Output() onTextChanged = new EventEmitter<string>();
    wrapperConfig = input<WrapperConfig>();
    monacoEditorId = input<string>();
    editorInlineStyle   = input<string>();
    private wrapper: MonacoEditorLanguageClientWrapper =
        new MonacoEditorLanguageClientWrapper();
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;

    constructor() {
        effect(async () => {
            try {
                if (this.wrapperConfig() !== undefined) {
                    if (this.wrapperConfig() !== undefined) {
                        await this.wrapper.initAndStart(
                            this.wrapperConfig() as WrapperConfig
                        );
                        this.handleOnTextChanged();
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
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

    handleOnTextChanged() {
        const textModels = this.wrapper.getTextModels();
        if (textModels) {
            const verifyModelContent = () => {
                const text = textModels.text?.getValue() ?? '';
                const textOriginal = textModels.textOriginal?.getValue() ?? '';
                const codeResources = (this.wrapperConfig() as WrapperConfig)
                    .editorAppConfig.codeResources;
                const dirty = text !== codeResources?.main?.text;
                const dirtyOriginal =
                    textOriginal !== codeResources?.original?.text;
                this.onTextChanged.emit(text);
                console.log('dirty , dirtyOriginal', dirty, dirtyOriginal);
            };

            const newSubscriptions: monaco.IDisposable[] = [];

            if (textModels.text) {
                verifyModelContent();
                newSubscriptions.push(
                    textModels.text.onDidChangeContent(() => {
                        verifyModelContent();
                    })
                );
            }
        }
    }
}
