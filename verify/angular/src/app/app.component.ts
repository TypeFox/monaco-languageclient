/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AfterViewInit, Component, signal } from '@angular/core';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { MonacoAngularWrapperComponent } from '../monaco-angular-wrapper.component';
import { buildJsonClientUserConfig } from 'monaco-languageclient-examples/json-client';
import '@codingame/monaco-vscode-groovy-default-extension';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [MonacoAngularWrapperComponent],
})
export class AppComponent implements AfterViewInit {
    wrapperConfig: WrapperConfig | undefined;
    title = 'angular-client';

    readonly codeText = signal('');


    async ngAfterViewInit(): Promise<void> {
        const config = buildJsonClientUserConfig({
            htmlContainer: document.getElementById('monaco-editor-root')!,
        });
        this.wrapperConfig = config;
    }

    onTextChanged(text: string) {
        this.codeText.set(text);
    }
}

