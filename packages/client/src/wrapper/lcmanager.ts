/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Logger } from 'monaco-languageclient/common';
import type { LanguageClientConfig, LanguageClientConfigs } from './lcconfig.js';
import { LanguageClientWrapper } from './lcwrapper.js';

export class LanguageClientManager {

    private logger?: Logger;
    private languageClientConfigs?: LanguageClientConfigs;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();

    setLogger(logger?: Logger) {
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

    async setConfig(languageClientConfig?: LanguageClientConfig): Promise<void> {
        if (languageClientConfig === undefined) return;

        const languageId = languageClientConfig.languageId;
        let lcw = this.languageClientWrappers.get(languageId);

        if (lcw === undefined) {
            lcw = new LanguageClientWrapper(languageClientConfig, this.logger);
            this.languageClientWrappers.set(languageId, lcw);
        }
    }

    async setConfigs(languageClientConfigs: LanguageClientConfigs): Promise<void> {
        this.languageClientConfigs = languageClientConfigs;

        const lccs = Object.values(this.languageClientConfigs.configs);
        if (lccs.length > 0) {
            for (const lcc of lccs) {
                await this.setConfig(lcc);
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
    }
}
