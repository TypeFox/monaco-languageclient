/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2023 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MonacoEditorComponent } from './app.component';

@NgModule({
    declarations: [
        MonacoEditorComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [
        MonacoEditorComponent
    ]
})
export class AppModule {

}
