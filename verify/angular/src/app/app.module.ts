/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2023 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
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
