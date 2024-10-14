/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class SaveCodeService {
    private http = inject(HttpClient);
    saveCode(codeText: string) {
        return this.http.post('http://localhost:3003/save-code', { code: codeText });
    }
}
