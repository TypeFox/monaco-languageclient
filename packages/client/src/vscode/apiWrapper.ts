/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initialize, LogLevel } from '@codingame/monaco-vscode-api';
import { ExtensionHostKind, getBuiltinExtensions, registerExtension, type IExtensionManifest, type RegisterExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { DisposableStore, setUnexpectedErrorHandler } from '@codingame/monaco-vscode-api/monaco';
import getConfigurationServiceOverride, { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import * as monaco from '@codingame/monaco-vscode-editor-api';
import getLogServiceOverride, { ConsoleLogger, type ILogger } from '@codingame/monaco-vscode-log-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import { encodeStringOrUrlToDataUrl } from 'monaco-languageclient/common';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import 'vscode/localExtensionHost';
import type { ExtensionConfig, MonacoVscodeApiConfig, ViewsConfig } from './config.js';
import { getEnhancedMonacoEnvironment, mergeServices, reportServiceLoading, useOpenEditorStub } from './utils.js';

export interface MonacoVscodeApiConfigRuntime extends MonacoVscodeApiConfig {
    serviceOverrides: monaco.editor.IEditorOverrideServices;
    logLevel: LogLevel | number;
    viewsConfig: ViewsConfig;
}

export interface StartInstructions {
    caller?: string;
    performServiceConsistencyChecks?: boolean;
}

export class MonacoVscodeApiWrapper {

    private logger: ILogger = new ConsoleLogger();
    private extensionRegisterResults: Map<string, | RegisterExtensionResult> = new Map();
    private disposableStore: DisposableStore = new DisposableStore();
    private apiConfig: MonacoVscodeApiConfigRuntime;

    constructor(apiConfig: MonacoVscodeApiConfig) {
        this.apiConfig = {
            ...apiConfig,
            serviceOverrides: apiConfig.serviceOverrides ?? {},
            logLevel: apiConfig.logLevel ?? LogLevel.Off,
        };
        this.logger.setLevel(this.apiConfig.logLevel);
    }

    getExtensionRegisterResult(extensionName: string) {
        return this.extensionRegisterResults.get(extensionName);
    }

    getMonacoVscodeApiConfig(): MonacoVscodeApiConfig {
        return this.apiConfig;
    }

    protected configureMonacoWorkers() {
        if (typeof this.apiConfig.monacoWorkerFactory === 'function') {
            this.apiConfig.monacoWorkerFactory(this.logger);
        } else {
            useWorkerFactory({
                logger: this.logger
            });
        }
    }

    private performErrorHandling = (message: string) => {
        getEnhancedMonacoEnvironment().vscodeApiInitialising = false;
        throw new Error(message);
    };

    protected async configureHighlightingServices() {
        if (this.apiConfig.$type === 'extended') {
            const getTextmateServiceOverride = (await import('@codingame/monaco-vscode-textmate-service-override')).default;
            const getThemeServiceOverride = (await import('@codingame/monaco-vscode-theme-service-override')).default;
            const getLanguagesServiceOverride = (await import('@codingame/monaco-vscode-languages-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getLanguagesServiceOverride(),
                ...getTextmateServiceOverride(),
                ...getThemeServiceOverride()
            });
        } else {
            const getMonarchServiceOverride = (await import('@codingame/monaco-vscode-monarch-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getMonarchServiceOverride()
            });
        }
    }

    protected async configureViewsServices() {
        const viewsConfigType = this.apiConfig.viewsConfig.$type;
        if (viewsConfigType === 'ViewsService' || viewsConfigType === 'WorkbenchService') {
            if (this.apiConfig.$type === 'classic') {
                this.performErrorHandling(`View Service Type "${viewsConfigType}" cannot be used with classic configuration.`);
            }
            if (this.apiConfig.viewsConfig.htmlContainer === undefined) {
                this.performErrorHandling(`View Service Type "${viewsConfigType}" requires a HTMLElement.`);
            }
        }

        const envEnhanced = getEnhancedMonacoEnvironment();
        if (viewsConfigType === 'ViewsService') {
            const getViewsServiceOverride = (await import('@codingame/monaco-vscode-views-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getViewsServiceOverride(this.apiConfig.viewsConfig.openEditorFunc ?? useOpenEditorStub)
            });
            envEnhanced.viewServiceType = 'ViewsService';
        } else if (viewsConfigType === 'WorkbenchService') {
            const getWorkbenchServiceOverride = (await import('@codingame/monaco-vscode-workbench-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getWorkbenchServiceOverride()
            });
            envEnhanced.viewServiceType = 'WorkbenchService';
        } else {
            const getEditorServiceOverride = (await import('@codingame/monaco-vscode-editor-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getEditorServiceOverride(this.apiConfig.viewsConfig.openEditorFunc ?? useOpenEditorStub)
            });
            envEnhanced.viewServiceType = 'EditorService';
        }
    }

    protected async applyViewsPostConfig() {
        const viewsConfigType = this.apiConfig.viewsConfig.$type;
        if (viewsConfigType === 'ViewsService' || viewsConfigType === 'WorkbenchService') {
            this.apiConfig.viewsConfig.htmlAugmentationInstructions?.(this.apiConfig.viewsConfig.htmlContainer);
            await this.apiConfig.viewsConfig.viewsInitFunc?.();
        }
    }

    /**
     * Adding the default workspace config if not provided
     */
    protected configureWorkspaceConfig() {
        if (this.apiConfig.workspaceConfig === undefined) {
            this.apiConfig.workspaceConfig = {
                workspaceProvider: {
                    trusted: true,
                    workspace: {
                        workspaceUri: vscode.Uri.file('/workspace.code-workspace')
                    },
                    async open() {
                        window.open(window.location.href);
                        return true;
                    }
                },
            };
        }
    }

    /**
     * Set the log-level via the development settings.
     * VSCode developmentOptions are read-only. There are no functions exposed to set options directly.
     * Therefore the Object properties need to be manipulated directly via Object.assign.
     */
    protected configureDevLogLevel() {
        const devLogLevel = this.apiConfig.workspaceConfig?.developmentOptions?.logLevel;
        if (devLogLevel === undefined) {
            const devOptions: Record<string, unknown> = {
                ...this.apiConfig.workspaceConfig!.developmentOptions
            };
            devOptions.logLevel = this.apiConfig.logLevel;
            (this.apiConfig.workspaceConfig!.developmentOptions as Record<string, unknown>) = Object.assign({}, devOptions);
        } else if (devLogLevel !== this.apiConfig.logLevel) {
            this.performErrorHandling(`You have configured mismatching logLevels: ${this.apiConfig.logLevel} (wrapperConfig) ${devLogLevel} (workspaceConfig.developmentOptions)`);
        } else {
            this.logger.debug('Development log level and api log level are in aligned.');
        }
    }

    /**
     * enable semantic highlighting in the default configuration
     */
    protected configureSemanticHighlighting() {
        if (this.apiConfig.advanced?.enforceSemanticHighlighting === true) {
            const configDefaults: Record<string, unknown> = {
                ...this.apiConfig.workspaceConfig!.configurationDefaults ?? {}
            };
            configDefaults['editor.semanticHighlighting.enabled'] = true;
            (this.apiConfig.workspaceConfig!.configurationDefaults as Record<string, unknown>) = Object.assign({}, configDefaults);
        }
    }

    protected async initUserConfiguration() {
        if (this.apiConfig.userConfiguration?.json !== undefined) {
            await initUserConfiguration(this.apiConfig.userConfiguration.json);
        }
    }

    protected async supplyRequiredServices() {
        return {
            ...getConfigurationServiceOverride(),
            ...getLogServiceOverride(),
            ...getModelServiceOverride()
        };
    }

    protected checkServiceConsistency() {
        const userServices = this.apiConfig.serviceOverrides;
        const haveThemeService = Object.keys(userServices).includes('themeService');
        const haveTextmateService = Object.keys(userServices).includes('textMateTokenizationFeature');
        const haveMarkersService = Object.keys(userServices).includes('markersService');
        const haveViewsService = Object.keys(userServices).includes('viewsService');

        // theme requires textmate
        if (haveThemeService && !haveTextmateService) {
            this.performErrorHandling('"theme" service requires "textmate" service. Please add it to the "userServices".');
        }

        // markers service requires views service
        if (haveMarkersService && !haveViewsService) {
            this.performErrorHandling('"markers" service requires "views" service. Please add it to the "userServices".');
        }
    }

    /**
     * monaco-vscode-api automatically loads the following services:
     *  - layout
     *  - environment
     *  - extension
     *  - files
     *  - quickAccess
     * monaco-languageclient always adds the following services:
     *   - languages
     *   - log
     *   - model
     *   - configuration services
     */
    protected async initAllServices(performServiceConsistencyChecks?: boolean) {
        const services = await this.supplyRequiredServices();

        mergeServices(services, this.apiConfig.serviceOverrides);
        if (this.apiConfig.advanced?.loadExtensionServices === undefined ? true : this.apiConfig.advanced.loadExtensionServices === true) {
            const { default: getExtensionServiceOverride } = await import('@codingame/monaco-vscode-extensions-service-override');
            mergeServices(services, {
                ...getExtensionServiceOverride({
                    enableWorkerExtensionHost: this.apiConfig.advanced?.enableExtHostWorker === true
                })
            });
        }

        reportServiceLoading(services, this.logger);

        if (performServiceConsistencyChecks ?? true) {
            this.checkServiceConsistency();
        }

        if (this.apiConfig.viewsConfig.$type === 'ViewsService' || this.apiConfig.viewsConfig.$type === 'WorkbenchService') {
            await initialize(services, this.apiConfig.viewsConfig.htmlContainer, this.apiConfig.workspaceConfig, this.apiConfig.envOptions);
        } else {
            await initialize(services, undefined, this.apiConfig.workspaceConfig, this.apiConfig.envOptions);
        }

        setUnexpectedErrorHandler((e) => {
            const message = 'Unexpected error';
            if (this.logger.getLevel() !== LogLevel.Off) {
                this.logger.error(message, e);
            }
        });
    }

    async initExtensions(): Promise<void> {
        if (this.apiConfig.$type === 'extended' && (this.apiConfig.advanced?.loadThemes === undefined ? true : this.apiConfig.advanced.loadThemes === true)) {
            await import('@codingame/monaco-vscode-theme-defaults-default-extension');
        }

        const extensions = this.apiConfig.extensions;
        if (this.apiConfig.extensions) {
            const allPromises: Array<Promise<void>> = [];
            const extensionIds: string[] = [];
            getBuiltinExtensions().forEach((ext) => {
                extensionIds.push(ext.identifier.id);
            });
            for (const extensionConfig of extensions ?? []) {
                if (!extensionIds.includes(`${extensionConfig.config.publisher}.${extensionConfig.config.name}`)) {
                    allPromises.push(this.initExtension(extensionConfig, extensionIds));
                }
            }
            await Promise.all(allPromises);
        }
    }

    protected initExtension(extensionConfig: ExtensionConfig, extensionIds: string[]): Promise<void> {
        if (!extensionIds.includes(`${extensionConfig.config.publisher}.${extensionConfig.config.name}`)) {
            const manifest = extensionConfig.config as IExtensionManifest;
            const extRegResult = registerExtension(manifest, ExtensionHostKind.LocalProcess);
            this.extensionRegisterResults.set(manifest.name, extRegResult);
            if (extensionConfig.filesOrContents && Object.hasOwn(extRegResult, 'registerFileUrl')) {
                for (const entry of extensionConfig.filesOrContents) {
                    this.disposableStore.add(extRegResult.registerFileUrl(entry[0], encodeStringOrUrlToDataUrl(entry[1])));
                }
            }
            return extRegResult.whenReady();
        } else {
            return Promise.resolve();
        }
    }

    protected markGlobalInit() {
        this.logger.debug('markGlobalInit');

        const envEnhanced = getEnhancedMonacoEnvironment();
        envEnhanced.vscodeApiGlobalInitAwait = new Promise<void>((resolve) => {
            envEnhanced.vscodeApiGlobalInitResolve = resolve;
        });
    }

    protected markGlobalInitDone() {
        const envEnhanced = getEnhancedMonacoEnvironment();
        envEnhanced.vscodeApiGlobalInitResolve?.();

        envEnhanced.vscodeApiInitialised = true;
        envEnhanced.vscodeApiGlobalInitAwait = undefined;
        envEnhanced.vscodeApiGlobalInitResolve = undefined;
        this.logger.debug('markGlobalInitDone');
    }

    async start(startInstructions?: StartInstructions): Promise<void> {
        const envEnhanced = getEnhancedMonacoEnvironment();
        if (envEnhanced.vscodeApiInitialised === true) {
            this.logger.warn('Initialization of monaco-vscode api can only performed once!');
        } else {
            if (!(envEnhanced.vscodeApiInitialising === true)) {

                envEnhanced.vscodeApiInitialising = true;
                this.markGlobalInit();

                // ensures "vscodeApiConfig.workspaceConfig" is available
                this.configureWorkspaceConfig();

                // ensure logging and development logging options are in-line
                this.configureDevLogLevel();
                this.logger.info(`Initializing monaco-vscode api. Caller: ${startInstructions?.caller ?? 'unknown'}`);

                await this.configureMonacoWorkers();

                // ensure either classic (monarch) or textmate (extended) highlighting is used
                await this.configureHighlightingServices();

                // ensure one of the three potential view services are configured
                await this.configureViewsServices();

                // enforce semantic highlighting if configured
                this.configureSemanticHighlighting();

                await this.initUserConfiguration();

                await this.initAllServices(startInstructions?.performServiceConsistencyChecks);

                await this.applyViewsPostConfig();

                await this.initExtensions();

                this.markGlobalInitDone();
                this.logger.debug('Initialization of monaco-vscode api completed successfully.');
            } else {
                this.logger.debug('Initialization of monaco-vscode api is already ongoing.');
            }
        }
    }

    dispose() {
        this.extensionRegisterResults.forEach((k) => k.dispose());
        this.disposableStore.dispose();

        // re-create disposable stores
        this.disposableStore = new DisposableStore();
    }
}
