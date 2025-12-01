/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { AfterViewInit, Component } from '@angular/core';

import { runExtendedClient } from '../../production/mlc-bundle.js';

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
        await runExtendedClient();
    }
}
