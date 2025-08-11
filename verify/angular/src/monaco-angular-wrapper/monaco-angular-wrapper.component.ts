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

import * as monaco from '@codingame/monaco-vscode-editor-api';
import {
    MonacoEditorLanguageClientWrapper,
    TextContents,
    TextModels,
    WrapperConfig, didModelContentChange
} from 'monaco-languageclient/editorApp';

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
    editorInlineStyle = input<string>();
    private wrapper: MonacoEditorLanguageClientWrapper =
        new MonacoEditorLanguageClientWrapper();
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;

    constructor() {
        effect(async () => {
            try {
                if (this.wrapperConfig() !== undefined) {
                    await this.wrapper.initAndStart(
                        this.wrapperConfig() as WrapperConfig
                    );
                    this.handleOnTextChanged();
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
            console.error('Error during disposal of the language client.');
        }
        if (this._subscription) {
            this._subscription.dispose();
        }
    }

    async ngOnDestroy() {
        this.destroyMonaco();
    }

    handleOnTextChanged() {
        const wrapperConfig = this.wrapperConfig();
        const textModels = this.wrapper.getTextModels();
        if (textModels?.modified !== undefined && wrapperConfig !== undefined) {
            const newSubscriptions: monaco.IDisposable[] = [];
            this.emitCodeChange(textModels);
            newSubscriptions.push(
                textModels.modified.onDidChangeContent(() => {
                    this.emitCodeChange(textModels);
                })
            );
        }
    }

    emitCodeChange(textModels: TextModels) {
        const onTextChanged = (textChanges: TextContents) => {
            this.onTextChanged.emit(textChanges.modified);
        };
        didModelContentChange(textModels, onTextChanged);
    }

}
