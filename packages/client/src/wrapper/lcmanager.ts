/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Logger } from 'monaco-languageclient/common';
import type { LanguageClientConfigs } from './lcconfig.js';
import { LanguageClientWrapper } from './lcwrapper.js';

export class LanguageClientsManager {

    private logger?: Logger;
    private languageClientConfigs?: LanguageClientConfigs;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();

    constructor(logger?: Logger) {
        this.logger = logger;
    }

    haveLanguageClients(): boolean {
        return this.languageClientWrappers.size > 0;
    }

    getLanguageClientWrapper(languageId: string): LanguageClientWrapper | undefined {
        return this.languageClientWrappers.get(languageId);
    }

    getLanguageClient(languageId: string) {
        return this.languageClientWrappers.get(languageId)?.getLanguageClient();
    }

    getWorker(languageId: string): Worker | undefined {
        return this.languageClientWrappers.get(languageId)?.getWorker();
    }

    initLanguageClients(languageClientConfigs?: LanguageClientConfigs) {
        this.languageClientConfigs = languageClientConfigs;

        const lccEntries = Object.entries(this.languageClientConfigs?.configs ?? {});
        if (lccEntries.length > 0) {
            for (const [languageId, lcc] of lccEntries) {
                const lcw = new LanguageClientWrapper(lcc, this.logger);
                this.languageClientWrappers.set(languageId, lcw);
            }
        }
    }

    async startLanguageClients(): Promise<void | void[]> {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            allPromises.push(lcw.start());
        }
        return Promise.all(allPromises);
    }

    isStarted(): boolean {
        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                // as soon as one is not started return
                if (!lcw.isStarted()) {
                    return false;
                }
            }
        }
        return true;
    }

    async disposeLanguageClients(): Promise<void | void[]> {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                allPromises.push(lcw.dispose());
            }
        }
        await Promise.all(allPromises);
        this.languageClientWrappers.clear();
    }
}
