/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import { ConsoleLogger, type ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { LanguageClientConfig, LanguageClientConfigs } from './lcconfig.js';
import { LanguageClientWrapper } from './lcwrapper.js';

export class LanguageClientManager {

    private logger: ILogger = new ConsoleLogger();
    private languageClientConfigs?: LanguageClientConfigs;
    private languageClientWrappers: Map<string, LanguageClientWrapper> = new Map();

    setLogLevel(logLevel?: LogLevel | number) {
        this.logger.setLevel(logLevel ?? LogLevel.Off);
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

    setConfig(languageClientConfig?: LanguageClientConfig) {
        if (languageClientConfig === undefined) return;

        const languageId = languageClientConfig.languageId;
        let lcw = this.languageClientWrappers.get(languageId);

        if (lcw === undefined) {
            lcw = new LanguageClientWrapper(languageClientConfig);
            this.languageClientWrappers.set(languageId, lcw);
        }
    }

    setConfigs(languageClientConfigs: LanguageClientConfigs) {
        this.languageClientConfigs = languageClientConfigs;

        const lccs = Object.values(this.languageClientConfigs.configs);
        if (lccs.length > 0) {
            for (const lcc of lccs) {
                this.setConfig(lcc);
            }
        }
    }

    async start(): Promise<void | void[]> {
        this.logger.debug('Starting all LanguageClientWrappers...');
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (!lcw.isStarted()) {
                allPromises.push(lcw.start());
            }
        }
        return Promise.all(allPromises);
    }

    isStarted(): boolean {
        // fast-fail
        if (this.languageClientWrappers.size === 0) return false;
        for (const lcw of this.languageClientWrappers.values()) {
            // as soon as one is not started return
            if (!lcw.isStarted()) {
                return false;
            }
        }
        return true;
    }

    async dispose(clearClients: boolean = false): Promise<void | void[]> {
        this.logger.debug('Disposing all LanguageClientWrappers...');
        const allPromises: Array<Promise<void>> = [];
        for (const lcw of this.languageClientWrappers.values()) {
            if (lcw.haveLanguageClient()) {
                allPromises.push(lcw.dispose());
            }
        }
        await Promise.all(allPromises);

        if (clearClients) {
            this.languageClientWrappers.clear();
        }
    }
}
