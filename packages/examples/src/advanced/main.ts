/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { ITextFileEditorModel } from 'vscode/monaco';
import { getService, IWorkbenchLayoutService, LogLevel } from 'vscode/services';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { IReference, OpenEditor, Parts, onPartVisibilityChange, isPartVisibile, attachPart, getSideBarPosition, onDidChangeSideBarPosition, Position } from '@codingame/monaco-vscode-views-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

import '../../resources/vsix/open-collaboration-tools.vsix';

import { EditorAppExtended, MonacoEditorLanguageClientWrapper, RegisterLocalProcessExtensionResult, WrapperConfig } from 'monaco-editor-wrapper';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { configureMonacoWorkers } from '../common/client/utils.js';
import helloTsCode from '../../resources/advanced/hello.ts?raw';
import testerTsCode from '../../resources/advanced/tester.ts?raw';
import viewsHtml from '../../resources/advanced/views.html?raw';

const wrapper = new MonacoEditorLanguageClientWrapper();
const openNewEditor: OpenEditor = async (modelRef) => {
    console.log('open editor');
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.top = container.style.bottom = container.style.left = container.style.right = '0';
    container.style.cursor = 'pointer';

    const editorElem = document.createElement('div');
    editorElem.style.position = 'absolute';
    editorElem.style.top = editorElem.style.bottom = editorElem.style.left = editorElem.style.right = '0';
    editorElem.style.margin = 'auto';
    editorElem.style.width = '80%';
    editorElem.style.height = '80%';

    container.appendChild(editorElem);
    try {

        wrapper.updateEditorModels({
            modelRef: modelRef as IReference<ITextFileEditorModel>
        });

        wrapper.getEditor()?.onDidBlurEditorWidget(() => {
            wrapper.dispose();
        });
        container.addEventListener('mousedown', (event) => {
            if (event.target !== container) return;
            wrapper.dispose();
        });

        return wrapper.getEditor();
    } catch (error) {
        document.body.removeChild(container);
        wrapper.dispose();
        throw error;
    }
};

const initViews = () => {
    for (const config of [
        { part: Parts.TITLEBAR_PART, element: '#titleBar' },
        { part: Parts.BANNER_PART, element: '#banner' },
        {
            part: Parts.SIDEBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#sidebar' : '#sidebar-right';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        {
            part: Parts.ACTIVITYBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#activityBar' : '#activityBar-right';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        {
            part: Parts.AUXILIARYBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#auxiliaryBar' : '#auxiliaryBar-left';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        { part: Parts.EDITOR_PART, element: '#editors' },
        // { part: Parts.PANEL_PART, element: '#panel' },
        { part: Parts.STATUSBAR_PART, element: '#statusBar' }
    ]) {
        attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!);

        config.onDidElementChange?.(() => {
            attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!);
        });

        if (!isPartVisibile(config.part)) {
            document.querySelector<HTMLDivElement>(config.element)!.style.display = 'none';
        }

        onPartVisibilityChange(config.part, visible => {
            document.querySelector<HTMLDivElement>(config.element)!.style.display = visible ? 'block' : 'none';
        });
    }
};

export const runAdvancedApplicationPlayground = async () => {
    const helloTsUri = vscode.Uri.file('/workspace/hello.ts');
    const testerTsUri = vscode.Uri.file('/workspace/tester.ts');
    const htmlContainer = document.createElement('div', { is: 'app' });

    const wrapperConfig: WrapperConfig = {
        id: 'AAP',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
                ...getBannerServiceOverride(),
                ...getStatusBarServiceOverride(),
                ...getTitleBarServiceOverride(),
                ...getExplorerServiceOverride()
            },
            enableExtHostWorker: true,
            viewsConfig: {
                viewServiceType: 'ViewsService',
                openEditorFunc: openNewEditor,
                viewsInitFunc: initViews
            },
            workspaceConfig: {
                enableWorkspaceTrust: true,
                windowIndicator: {
                    label: 'mlc-advanced-example',
                    tooltip: '',
                    command: ''
                },
                workspaceProvider: {
                    trusted: true,
                    async open() {
                        window.open(window.location.href);
                        return true;
                    },
                    workspace: {
                        workspaceUri: vscode.Uri.file('/workspace.code-workspace')
                    }
                },
                configurationDefaults: {
                    'window.title': 'mlc-advanced-example${separator}${dirty}${activeEditorShort}'
                },
                defaultLayout: {
                    editors: [{
                        uri: helloTsUri,
                        viewColumn: 1
                    }, {
                        uri: testerTsUri,
                        viewColumn: 2
                    }],
                    layout: {
                        editors: {
                            orientation: 0,
                            groups: [{ size: 1 }, { size: 1 }]
                        }
                    }
                },
                productConfiguration: {
                    nameShort: 'mlc-advanced-example',
                    nameLong: 'mlc-advanced-example',
                    extensionsGallery: {
                        serviceUrl: 'https://open-vsx.org/vscode/gallery',
                        itemUrl: 'https://open-vsx.org/vscode/item',
                        resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
                        controlUrl: '',
                        nlsBaseUrl: '',
                        publisherUrl: ''
                    }
                }
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                    'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                    'editor.guides.bracketPairsHorizontal': true,
                    'oct.serverUrl': 'https://api.open-collab.tools/',
                    'editor.experimental.asyncTokenization': false
                })
            },
        },
        editorAppConfig: {
            $type: 'extended',
            extensions: [{
                config: {
                    name: 'mlc-advanced-example',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: {
                        vscode: '*'
                    }
                }
            }],
            codeResources: {
                main: {
                    text: helloTsCode,
                    uri: '/workspace/hello.ts'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer
        }
    };

    htmlContainer.innerHTML = viewsHtml;
    document.body.append(htmlContainer);

    await wrapper.init(wrapperConfig);
    const result = (wrapper.getMonacoEditorApp() as EditorAppExtended).getExtensionRegisterResult('mlc-advanced-example') as RegisterLocalProcessExtensionResult;
    result.setAsDefaultApi();
    const vscodeApi = await result.getApi();

    await getService(IWorkbenchLayoutService);

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloTsUri, helloTsCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(testerTsUri, testerTsCode));

    registerFileSystemOverlay(1, fileSystemProvider);

    await vscodeApi.workspace.openTextDocument(helloTsUri);
    await vscodeApi.workspace.openTextDocument(testerTsUri);

};
