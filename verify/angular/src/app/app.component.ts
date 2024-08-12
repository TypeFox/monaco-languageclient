/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AfterViewInit, Component } from '@angular/core';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { jsonClientUserConfig } from 'monaco-languageclient-examples/json-client';

useWorkerFactory({
    rootPath: window.location.href + '../..',
    basePath: '../assets',
});

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class MonacoEditorComponent implements AfterViewInit {
    title = 'angular-client';
    initDone = false;

    async ngAfterViewInit(): Promise<void> {
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const htmlElement = document.getElementById('monaco-editor-root');

        try {
            await wrapper.initAndStart(jsonClientUserConfig, htmlElement);
        } catch (e) {
            console.error(e);
        }
    }
}
