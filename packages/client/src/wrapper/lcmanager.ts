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

    async setConfigs(languageClientConfigs: LanguageClientConfigs): Promise<void> {
        this.languageClientConfigs = languageClientConfigs;

        const lccEntries = Object.entries(this.languageClientConfigs.configs);
        if (lccEntries.length > 0) {
            for (const [languageId, lcc] of lccEntries) {
                const current = this.languageClientWrappers.get(languageId);
                const lcw = new LanguageClientWrapper(lcc, this.logger);

                if (current !== undefined) {
                    if (languageClientConfigs.overwriteExisting === true) {
                        if (languageClientConfigs.enforceDispose === true) {
                            await current.dispose();
                        }
                    } else {
                        throw new Error(`A languageclient config with id "${languageId}" already exists and you confiured to not override.`);
                    }
                }
                this.languageClientWrappers.set(languageId, lcw);
            }
        }
    }

    async start(): Promise<void | void[]> {
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (!lcw.isStarted()) {
                allPromises.push(lcw.start());
            }
        }
        return Promise.all(allPromises);
    }

    isStarted(): boolean {
        for (const lcw of this.languageClientWrappers.values()) {
            // as soon as one is not started return
            if (!lcw.isStarted()) {
                return false;
            }
        }
        return true;
    }

    async dispose(): Promise<void | void[]> {
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
