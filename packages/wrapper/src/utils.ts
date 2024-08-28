/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { WebSocketConfigOptions, WebSocketConfigOptionsUrl, WorkerConfigDirect, WorkerConfigOptions } from './commonTypes.js';
import { CodePlusFileExt, CodePlusUri, CodeResources } from './editorAppBase.js';
import { EditorAppClassic } from './editorAppClassic.js';
import { UserConfig } from './userConfig.js';
import { EditorAppExtended } from './editorAppExtended.js';

export const createUrl = (config: WebSocketConfigOptions | WebSocketConfigOptionsUrl) => {
    let buildUrl = '';
    if ((config as WebSocketConfigOptionsUrl).url) {
        const options = config as WebSocketConfigOptionsUrl;
        if (!options.url.startsWith('ws://') && !options.url.startsWith('wss://')) {
            throw new Error(`This is not a proper websocket url: ${options.url}`);
        }
        buildUrl = options.url;
    } else {
        const options = config as WebSocketConfigOptions;
        const protocol = options.secured ? 'wss' : 'ws';
        buildUrl = `${protocol}://${options.host}`;
        if (options.port !== undefined) {
            if (options.port !== 80) {
                buildUrl += `:${options.port}`;
            }
        }
        if (options.path !== undefined) {
            buildUrl += `/${options.path}`;
        }
        if (options.extraParams) {
            const url = new URL(buildUrl);

            for (const [key, value] of Object.entries(options.extraParams)) {
                url.searchParams.set(key, value instanceof Array ? value.join(',') : value.toString());
            }

            buildUrl = url.toString();
        }
    }
    return buildUrl;
};

export const verifyUrlOrCreateDataUrl = (input: string | URL) => {
    return (input instanceof URL) ? input.href : new URL(`data:text/plain;base64,${btoa(input)}`).href;
};

export const getEditorUri = (id: string, original: boolean, code: CodePlusUri | CodePlusFileExt, basePath?: string) => {
    if (Object.hasOwn(code, 'uri')) {
        return vscode.Uri.parse((code as CodePlusUri).uri);
    } else {
        return vscode.Uri.parse(`${basePath ?? '/workspace'}/model${original ? 'Original' : ''}${id}.${(code as CodePlusFileExt).fileExt}`);
    }
};

export enum ModelUpdateType {
    NONE,
    CODE,
    MODEL,
    CODE_AND_MODEL
}

export const isCodeUpdateRequired = (codeResourcesPrevious?: CodeResources, codeResources?: CodeResources) => {
    const a = evaluateCodeUpdate(codeResourcesPrevious?.main);
    const b = evaluateCodeUpdate(codeResources?.main);
    const c = evaluateCodeUpdate(codeResourcesPrevious?.original);
    const d = evaluateCodeUpdate(codeResources?.original);
    return a !== b || c !== d ? ModelUpdateType.CODE : ModelUpdateType.NONE;
};

export const evaluateCodeUpdate = (code?: CodePlusUri | CodePlusFileExt) => {
    return code && Object.hasOwn(code, 'text') ? code.text : undefined;
};

export const isModelUpdateRequired = (codeResourcesPrevious?: CodeResources, codeResources?: CodeResources): ModelUpdateType => {
    const codeUpdateType = isCodeUpdateRequired(codeResourcesPrevious, codeResources);
    const codeChanged = codeUpdateType === ModelUpdateType.CODE;

    const a = evaluateCodeModel(codeResourcesPrevious?.main);
    const b = evaluateCodeModel(codeResources?.main);
    const c = evaluateCodeModel(codeResourcesPrevious?.original);
    const d = evaluateCodeModel(codeResources?.original);
    const modelChanged = a !== b || c !== d;

    return (modelChanged && codeChanged) ? ModelUpdateType.CODE_AND_MODEL : (modelChanged ? ModelUpdateType.MODEL : (codeChanged ? ModelUpdateType.CODE : ModelUpdateType.NONE));
};

export const evaluateCodeModel = (code?: CodePlusUri | CodePlusFileExt) => {
    if (code) {
        return Object.hasOwn(code, 'uri') ? (code as CodePlusUri).uri : (Object.hasOwn(code, 'fileExt') ? (code as CodePlusFileExt).fileExt : undefined);
    } else {
        return undefined;
    }
};

/**
 * The check for equality relies on JSON.stringify for instances of type Object.
 * Everything else is directly compared.
 * In this context, the check for equality is sufficient.
 */
export const isEqual = (obj1: unknown, obj2: unknown) => {
    if (obj1 instanceof Object && obj2 instanceof Object) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    } else {
        return obj1 === obj2;
    }
};

/**
 * Checks if the app needs to be re-init
 * @param editorApp
 * @param userConfig
 * @param previousUserConfig
 * @returns
 */
export const isReInitRequired = (editorApp: EditorAppClassic | EditorAppExtended, userConfig: UserConfig, previousUserConfig: UserConfig): boolean => {
    let mustReInit = false;
    const config = userConfig.wrapperConfig.editorAppConfig;
    const prevConfig = previousUserConfig.wrapperConfig.editorAppConfig;
    const prevWorkerOptions = previousUserConfig.languageClientConfig?.options;
    const currentWorkerOptions = userConfig.languageClientConfig?.options;
    const prevIsWorker = (prevWorkerOptions?.$type === 'WorkerDirect');
    const currentIsWorker = (currentWorkerOptions?.$type === 'WorkerDirect');
    const prevIsWorkerConfig = (prevWorkerOptions?.$type === 'WorkerConfig');
    const currentIsWorkerConfig = (currentWorkerOptions?.$type === 'WorkerConfig');

    // check if both are configs and the workers are both undefined
    if (prevIsWorkerConfig && !prevIsWorker && currentIsWorkerConfig && !currentIsWorker) {
        mustReInit = (prevWorkerOptions as WorkerConfigOptions).url !== (currentWorkerOptions as WorkerConfigOptions).url;
        // check if both are workers and configs are both undefined
    } else if (!prevIsWorkerConfig && prevIsWorker && !currentIsWorkerConfig && currentIsWorker) {
        mustReInit = (prevWorkerOptions as WorkerConfigDirect).worker !== (currentWorkerOptions as WorkerConfigDirect).worker;
        // previous was worker and current config is not or the other way around
    } else if (prevIsWorker && currentIsWorkerConfig || prevIsWorkerConfig && currentIsWorker) {
        mustReInit = true;
    }

    if (prevConfig.$type !== config.$type) {
        mustReInit = true;
    } else if (prevConfig.$type === 'classic' && config.$type === 'classic') {
        mustReInit = (editorApp as EditorAppClassic).isAppConfigDifferent(prevConfig, config, false) === true;
    } else if (prevConfig.$type === 'extended' && config.$type === 'extended') {
        mustReInit = (editorApp as EditorAppExtended).isAppConfigDifferent(prevConfig, config, false) === true;
    }

    return mustReInit;
};
