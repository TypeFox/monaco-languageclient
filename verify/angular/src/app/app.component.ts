/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Component, inject, signal } from '@angular/core';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { MonacoAngularWrapperComponent } from '../monaco-angular-wrapper/monaco-angular-wrapper.component';
import { SaveCodeService } from '../save-code.service';
import { firstValueFrom } from 'rxjs';
import { getGroovyClientConfig } from '../config/groovy.config';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [MonacoAngularWrapperComponent],
})
export class AppComponent {
    private saveCodeService = inject(SaveCodeService);
    groovyWrapperConfig = signal<WrapperConfig | undefined>(undefined); // this can be updated at runtime
    title = 'angular demo for saving code';
    editorId = 'monaco-editor-root'; // this can be parameterized or it can be in a loop to support multiple editors
    groovyEditorId = 'monaco-editor-groovy'; // this can be parameterized or it can be in a loop to support multiple editors
    editorInlineStyle = signal('height: 50vh;');
    readonly codeText = signal('');

    constructor() {
        this.groovyWrapperConfig.set(getGroovyClientConfig());
    }

    onTextChanged(text: string) {
        this.codeText.set(text);
    }

    save = async () => {
        try {
            const response = await firstValueFrom(
                this.saveCodeService.saveCode(this.codeText())
            );
            alert('Code saved:' + JSON.stringify(response));
        } catch (error) {
            console.error('Error saving code:', error);
        }
    };
}
