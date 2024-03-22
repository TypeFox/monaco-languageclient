/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
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
