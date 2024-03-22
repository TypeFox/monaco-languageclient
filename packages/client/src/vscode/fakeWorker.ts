/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export class FakeWorker {
    url: string | URL;
    options?: WorkerOptions;

    constructor(url: string | URL, options?: WorkerOptions) {
        this.url = url;
        this.options = options;
    }
}
