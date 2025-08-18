/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { initialize, LogLevel } from '@codingame/monaco-vscode-api';
import { ExtensionHostKind, getExtensionManifests, registerExtension, type IExtensionManifest, type RegisterExtensionResult } from '@codingame/monaco-vscode-api/extensions';
import { DisposableStore, setUnexpectedErrorHandler } from '@codingame/monaco-vscode-api/monaco';
import getConfigurationServiceOverride, { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import { ConsoleLogger, encodeStringOrUrlToDataUrl, type Logger } from 'monaco-languageclient/common';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import 'vscode/localExtensionHost';
import type { ExtensionConfig, MonacoVscodeApiConfig } from './config.js';
import { configureExtHostWorker, getEnhancedMonacoEnvironment, mergeServices, reportServiceLoading, useOpenEditorStub } from './utils.js';

export interface InitServicesInstructions {
    caller?: string;
    performServiceConsistencyChecks?: boolean;
    htmlContainer?: HTMLElement | null;
}

export class MonacoVscodeApiWrapper {

    private logger: Logger = new ConsoleLogger();
    private extensionRegisterResults: Map<string, | RegisterExtensionResult> = new Map();
    private disposableStore: DisposableStore = new DisposableStore();
    private apiConfig: MonacoVscodeApiConfig;

    constructor(apiConfig: MonacoVscodeApiConfig) {
        this.apiConfig = apiConfig;
        this.apiConfig.logLevel = this.apiConfig.logLevel ?? LogLevel.Off;
        this.logger.setLevel(this.apiConfig.logLevel);
    }

    getLogger(): Logger {
        return this.logger;
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

    protected async configureHighlightingServices() {
        if (this.apiConfig.$type === 'extended') {
            const getTextmateServiceOverride = (await import('@codingame/monaco-vscode-textmate-service-override')).default;
            const getThemeServiceOverride = (await import('@codingame/monaco-vscode-theme-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
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
        const viewServiceType = this.apiConfig.viewsConfig?.viewServiceType ?? 'EditorService';
        if (this.apiConfig.$type === 'classic' && (viewServiceType === 'ViewsService' || viewServiceType === 'WorkspaceService')) {
            throw new Error(`View Service Type "${viewServiceType}" cannot be used with classic configuration.`);
        }

        const envEnhanced = getEnhancedMonacoEnvironment();
        if (this.apiConfig.viewsConfig?.viewServiceType === 'ViewsService') {
            const getViewsServiceOverride = (await import('@codingame/monaco-vscode-views-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getViewsServiceOverride(this.apiConfig.viewsConfig.openEditorFunc ?? useOpenEditorStub)
            });
            envEnhanced.viewServiceType = 'ViewsService';
        } else if (this.apiConfig.viewsConfig?.viewServiceType === 'WorkspaceService') {
            const getWorkbenchServiceOverride = (await import('@codingame/monaco-vscode-workbench-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getWorkbenchServiceOverride()
            });
            envEnhanced.viewServiceType = 'WorkspaceService';
        } else {
            const getEditorServiceOverride = (await import('@codingame/monaco-vscode-editor-service-override')).default;
            mergeServices(this.apiConfig.serviceOverrides, {
                ...getEditorServiceOverride(this.apiConfig.viewsConfig?.openEditorFunc ?? useOpenEditorStub)
            });
            envEnhanced.viewServiceType = 'EditorService';
        }
    }

    protected async applyViewsPostConfig() {
        this.apiConfig.viewsConfig?.htmlAugmentationInstructions?.(this.apiConfig.htmlContainer);
        await this.apiConfig.viewsConfig?.viewsInitFunc?.();
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
            throw new Error(`You have configured mismatching logLevels: ${this.apiConfig.logLevel} (wrapperConfig) ${devLogLevel} (workspaceConfig.developmentOptions)`);
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
            ...getLanguagesServiceOverride(),
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
            throw new Error('"theme" service requires "textmate" service. Please add it to the "userServices".');
        }

        // markers service requires views service
        if (haveMarkersService && !haveViewsService) {
            throw new Error('"markers" service requires "views" service. Please add it to the "userServices".');
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
     */
    protected async importAllServices(instructions?: InitServicesInstructions) {
        const services = await this.supplyRequiredServices();

        mergeServices(services, this.apiConfig.serviceOverrides);
        await configureExtHostWorker(this.apiConfig.advanced?.enableExtHostWorker === true, services);

        reportServiceLoading(services, this.logger);

        if (instructions?.performServiceConsistencyChecks === true) {
            this.checkServiceConsistency();
        }

        if (this.apiConfig.viewsConfig?.viewServiceType === 'ViewsService' || this.apiConfig.viewsConfig?.viewServiceType === 'WorkspaceService') {
            await initialize(services, this.apiConfig.htmlContainer, this.apiConfig.workspaceConfig, this.apiConfig.envOptions);
        } else {
            await initialize(services, undefined, this.apiConfig.workspaceConfig, this.apiConfig.envOptions);
        }

        setUnexpectedErrorHandler((e) => {
            this.logger.createErrorAndLog('Unexpected error', e);
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
            getExtensionManifests().forEach((ext) => {
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
        if (typeof envEnhanced.vscodeApiGlobalInitResolve === 'function') {
            envEnhanced.vscodeApiGlobalInitResolve();
        }
        envEnhanced.vscodeApiInitialised = true;
        envEnhanced.vscodeApiGlobalInitAwait = undefined;
        envEnhanced.vscodeApiGlobalInitResolve = undefined;
        this.logger.debug('markGlobalInitDone');
    }

    async init(instructions?: InitServicesInstructions): Promise<void> {
        const envEnhanced = getEnhancedMonacoEnvironment();
        if (envEnhanced.vscodeApiInitialised === true) {
            this.logger.warn('Initialization of monaco-vscode api can only performed once!');
        } else {
            if (!(envEnhanced.vscodeApiInitialising === true)) {
                envEnhanced.vscodeApiInitialising = true;
                this.markGlobalInit();
                if (instructions?.htmlContainer !== undefined && instructions.htmlContainer !== null) {
                    this.apiConfig.htmlContainer = instructions.htmlContainer;
                }

                // ensures "vscodeApiConfig.workspaceConfig" is available
                this.configureWorkspaceConfig();

                // ensure logging and development logging options are in-line
                this.configureDevLogLevel();
                this.logger.info(`Initializing monaco-vscode api. Caller: ${instructions?.caller ?? 'unknown'}`);

                await this.configureMonacoWorkers();

                // ensure either classic (monarch) or textmate (extended) highlighting is used
                await this.configureHighlightingServices();

                // ensure one of the three potential view services are configured
                await this.configureViewsServices();

                // enforce semantic highlighting if configured
                this.configureSemanticHighlighting();

                await this.initUserConfiguration();

                await this.importAllServices(instructions);

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
