/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AfterViewInit, Component } from '@angular/core';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { buildJsonClientUserConfig } from 'monaco-languageclient-examples/json-client';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true
})
export class MonacoEditorComponent implements AfterViewInit {
    title = 'angular-client';
    initDone = false;

    async ngAfterViewInit(): Promise<void> {
        const wrapper = new MonacoEditorLanguageClientWrapper();

        const config = buildJsonClientUserConfig({
            htmlContainer: document.getElementById('monaco-editor-root')!
        });
        try {
            await wrapper.initAndStart(config);
        } catch (e) {
            console.error(e);
        }
    }
}
