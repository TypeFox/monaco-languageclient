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
    TextContents,
    TextModels,
    didModelContentChange,
    EditorAppConfig,
    EditorApp
} from 'monaco-languageclient/editorApp';
import { LanguageClientConfig, LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';

@Component({
    standalone: true,
    selector: 'monaco-angular-wrapper',
    templateUrl: './monaco-angular-wrapper.component.html',
    styleUrls: ['./monaco-angular-wrapper.component.scss'],
})
export class MonacoAngularWrapperComponent implements OnDestroy {
    @Output() onTextChanged = new EventEmitter<string>();
    monacoVscodeApiConfig = input<MonacoVscodeApiConfig>();
    languageClientConfig = input<LanguageClientConfig>();
    editorAppConfig = input<EditorAppConfig>();
    monacoEditorId = input<string>();
    editorInlineStyle = input<string>();
    private editorApp: EditorApp | undefined;
    private lcWrapper: LanguageClientWrapper | undefined;
    private _subscription: monaco.IDisposable | null = null;
    private isRestarting?: Promise<void>;

    constructor() {
        effect(async () => {
            try {
                if (this.monacoVscodeApiConfig() !== undefined && this.languageClientConfig() !== undefined && this.editorAppConfig() !== undefined) {
                    const apiWrapper = new MonacoVscodeApiWrapper(this.monacoVscodeApiConfig()!);
                    await apiWrapper.start();

                    this.lcWrapper = new LanguageClientWrapper(this.languageClientConfig()!);
                    this.editorApp = new EditorApp(this.editorAppConfig()!);

                    await this.editorApp.start(this.monacoVscodeApiConfig()!.viewsConfig.htmlContainer!);
                    await this.lcWrapper.start();

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
            await this.editorApp?.dispose();
            await this.lcWrapper?.dispose();
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
        const editorAppConfig = this.editorAppConfig();
        const textModels = this.editorApp?.getTextModels();
        if (textModels?.modified !== undefined && editorAppConfig !== undefined) {
            const newSubscriptions: monaco.IDisposable[] = [];
            this.emitCodeChange(textModels);
            newSubscriptions.push(
                textModels.modified!.onDidChangeContent(() => {
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
