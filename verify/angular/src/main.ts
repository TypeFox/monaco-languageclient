/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2023 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
    providers: [
        provideExperimentalZonelessChangeDetection(),
        provideHttpClient()
    ]
});
