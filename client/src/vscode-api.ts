/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import { URI } from "vscode-uri"
import { Disposable } from "./disposable";
import {
    Services, Event, DiagnosticCollection, WorkspaceEdit, isDocumentSelector,
    MessageType, OutputChannel, CompletionTriggerKind, DocumentIdentifier,
    SignatureHelpTriggerKind
} from "./services";
import * as ServicesModule from "./services"
import { DiagnosticSeverity } from "vscode-languageserver-protocol";

export function createVSCodeApi(servicesProvider: Services.Provider): typeof vscode {
    const unsupported = () => { throw new Error('unsupported') };
    const Uri: typeof vscode.Uri = URI;
    class CompletionItem implements vscode.CompletionItem {
        constructor(public label: string, public kind?: vscode.CompletionItemKind) { }
    }
    class CodeLens implements vscode.CodeLens {
        constructor(
            public range: vscode.Range,
            public command?: vscode.Command
        ) { }

        get isResolved(): boolean {
            return !!this.command;
        }
    }
    class DocumentLink implements vscode.DocumentLink {
        constructor(public range: vscode.Range, public target?: vscode.Uri) { }
    }
    class CodeActionKind implements vscode.CodeActionKind {
        private static readonly sep = '.';

        static Empty = new CodeActionKind('');
        static QuickFix = new CodeActionKind('quickfix');
        static Refactor = new CodeActionKind('refactor');
        static RefactorExtract = CodeActionKind.Refactor.append('extract');
        static RefactorInline = CodeActionKind.Refactor.append('inline');
        static RefactorRewrite = CodeActionKind.Refactor.append('rewrite');
        static Source = new CodeActionKind('source');
        static SourceOrganizeImports = CodeActionKind.Source.append('organizeImports');
        static SourceFixAll = CodeActionKind.Source.append('fixAll');
        private constructor(readonly value: string) { }
        public append(parts: string): CodeActionKind {
            return new CodeActionKind(this.value ? this.value + CodeActionKind.sep + parts : parts);
        }
        contains = unsupported
        intersects = unsupported
    }

    class EmptyFileSystem implements vscode.FileSystem {
        stat(uri: vscode.Uri): Thenable<vscode.FileStat> {
            throw new Error("Method not implemented.");
        }
        readDirectory(uri: vscode.Uri): Thenable<[string, vscode.FileType][]> {
            return Promise.resolve([]);
        }
        createDirectory(uri: vscode.Uri): Thenable<void> {
            return Promise.resolve();
        }
        readFile(uri: vscode.Uri): Thenable<Uint8Array> {
            return Promise.resolve(new Uint8Array(0));
        }
        writeFile(uri: vscode.Uri, content: Uint8Array): Thenable<void> {
            return Promise.resolve();
        }
        delete(uri: vscode.Uri,
            options?: { recursive?: boolean | undefined; useTrash?: boolean | undefined; } | undefined): Thenable<void> {
            return Promise.resolve();
        }
        rename(source: vscode.Uri,
            target: vscode.Uri,
            options?: { overwrite?: boolean | undefined; } | undefined): Thenable<void> {
            return Promise.resolve();
        }

        copy(source: vscode.Uri,
            target: vscode.Uri,
            options?: { overwrite?: boolean | undefined; } | undefined): Thenable<void> {
            return Promise.resolve();
        }
    }

    const workspace: typeof vscode.workspace = {
        fs: new EmptyFileSystem(),
        workspaceFile: undefined,
        createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents): vscode.FileSystemWatcher {
            const services = servicesProvider();
            if (typeof globPattern !== 'string') {
                throw new Error('unsupported');
            }
            if (services.workspace.createFileSystemWatcher) {
                const watcher = services.workspace.createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents);
                return Object.assign(watcher, {
                    ignoreCreateEvents: !!ignoreCreateEvents,
                    ignoreChangeEvents: !!ignoreChangeEvents,
                    ignoreDeleteEvents: !!ignoreDeleteEvents,
                });
            }
            return {
                ignoreCreateEvents: !!ignoreCreateEvents,
                ignoreChangeEvents: !!ignoreChangeEvents,
                ignoreDeleteEvents: !!ignoreDeleteEvents,
                onDidCreate: Event.None,
                onDidChange: Event.None,
                onDidDelete: Event.None,
                dispose: () => { }
            }
        },
        applyEdit: async (edit) => {
            const services = servicesProvider();
            if (WorkspaceEdit.is(edit)) {
                return services.workspace.applyEdit(edit);
            }
            throw new Error('unsupported');
        },
        getConfiguration(section, resource): vscode.WorkspaceConfiguration {
            const { workspace } = servicesProvider();
            const configuration = workspace.configurations ?
                workspace.configurations.getConfiguration(section, resource ? resource.toString() : undefined) :
                undefined;
            const result: vscode.WorkspaceConfiguration = {
                get: (section: string, defaultValue?: any) => {
                    return configuration ? configuration.get(section, defaultValue) : defaultValue;
                },
                has: (section: string) => {
                    return configuration ? configuration.has(section) : false;
                },
                inspect: unsupported,
                update: unsupported
            };
            return Object.assign(result, {
                toJSON: () => configuration ? configuration.toJSON() : undefined
            });
        },
        get onDidChangeConfiguration(): typeof vscode.workspace.onDidChangeConfiguration {
            const services = servicesProvider();
            if (services.workspace.configurations) {
                return services.workspace.configurations.onDidChangeConfiguration;
            }
            return Event.None;
        },
        get workspaceFolders(): typeof vscode.workspace.workspaceFolders {
            const services = servicesProvider();
            if ('workspaceFolders' in services.workspace) {
                return services.workspace.workspaceFolders;
            }
            const rootUri = services.workspace.rootUri;
            if (!rootUri) {
                return undefined;
            }
            const uri = Uri.parse(rootUri);
            return [{
                uri,
                index: 0,
                name: uri.toString()
            }];
        },
        get onDidChangeWorkspaceFolders(): typeof vscode.workspace.onDidChangeWorkspaceFolders {
            const services = servicesProvider();
            return services.workspace.onDidChangeWorkspaceFolders || Event.None;
        },
        get textDocuments(): typeof vscode.workspace.textDocuments {
            const services = servicesProvider();
            return services.workspace.textDocuments as any;
        },
        get onDidOpenTextDocument(): typeof vscode.workspace.onDidOpenTextDocument {
            const services = servicesProvider();
            return services.workspace.onDidOpenTextDocument as any;
        },
        get onDidCloseTextDocument(): typeof vscode.workspace.onDidCloseTextDocument {
            const services = servicesProvider();
            return services.workspace.onDidCloseTextDocument as any;
        },
        get onDidChangeTextDocument(): typeof vscode.workspace.onDidChangeTextDocument {
            const services = servicesProvider();
            return (listener: (e: vscode.TextDocumentChangeEvent) => any, thisArgs?: any, disposables?: Disposable[]): Disposable => {
                return services.workspace.onDidChangeTextDocument(({ textDocument, contentChanges }) => {
                    const l: (e: vscode.TextDocumentChangeEvent) => any = listener.bind(thisArgs);
                    l({
                        document: <any>textDocument,
                        contentChanges: <any>contentChanges
                    });
                }, undefined, disposables);
            }
        },
        get onWillSaveTextDocument(): typeof vscode.workspace.onWillSaveTextDocument {
            const services = servicesProvider();
            const onWillSaveTextDocument = services.workspace.onWillSaveTextDocument;
            if (!onWillSaveTextDocument) {
                return Event.None;
            }
            return (listener: (e: vscode.TextDocumentWillSaveEvent) => any, thisArgs?: any, disposables?: Disposable[]): Disposable => {
                return onWillSaveTextDocument(({ textDocument, reason, waitUntil }) => {
                    const l: (e: vscode.TextDocumentWillSaveEvent) => any = listener.bind(thisArgs);
                    l({
                        document: <any>textDocument,
                        reason: reason,
                        waitUntil: (edits: PromiseLike<vscode.TextEdit[]>) => {
                            if (waitUntil) {
                                waitUntil(edits);
                            }
                        }
                    });
                }, undefined, disposables);
            }
        },
        get onDidSaveTextDocument(): typeof vscode.workspace.onDidSaveTextDocument {
            const services = servicesProvider();
            return (services.workspace.onDidSaveTextDocument as any) || Event.None;
        },

        get onWillCreateFiles(): vscode.Event<vscode.FileWillCreateEvent> {
            return Event.None;
        },

        get onDidCreateFiles(): vscode.Event<vscode.FileCreateEvent> {
            return Event.None;
        },

        get onWillDeleteFiles(): vscode.Event<vscode.FileWillDeleteEvent> {
            return Event.None;
        },

        get onDidDeleteFiles(): vscode.Event<vscode.FileDeleteEvent> {
            return Event.None;
        },

        get onWillRenameFiles(): vscode.Event<vscode.FileWillRenameEvent> {
            return Event.None;
        },

        get onDidRenameFiles(): vscode.Event<vscode.FileRenameEvent> {
            return Event.None
        },

        getWorkspaceFolder: unsupported,
        asRelativePath: unsupported,
        updateWorkspaceFolders: unsupported,
        findFiles: unsupported,
        saveAll: unsupported,
        openTextDocument: unsupported,
        registerTextDocumentContentProvider: unsupported,
        registerTaskProvider: unsupported,
        registerFileSystemProvider: unsupported,
        rootPath: undefined,
        name: undefined
    };

    function isVsCodeUri(v: vscode.Uri | ReadonlyArray<[vscode.Uri, ReadonlyArray<vscode.Diagnostic> | undefined]>): v is vscode.Uri {
        return (v instanceof URI) !== undefined;
    }

    class ApiDiagnosticCollection implements vscode.DiagnosticCollection {
        readonly name: string;
        private readonly services: Services;
        private readonly collection: DiagnosticCollection | undefined;

        constructor(name?: string) {
            this.name = name || 'default',
                this.services = servicesProvider();
            this.collection = this.services.languages.createDiagnosticCollection
                ? this.services.languages.createDiagnosticCollection(name)
                : undefined;
        }

        entries() {
        }

        set(entries: ReadonlyArray<[vscode.Uri, ReadonlyArray<vscode.Diagnostic> | undefined]>): void;
        set(uri: vscode.Uri, arg1: ReadonlyArray<vscode.Diagnostic> | undefined): void;
        set(arg0: vscode.Uri | ReadonlyArray<[vscode.Uri, ReadonlyArray<vscode.Diagnostic> | undefined]>,
            arg1?: ReadonlyArray<vscode.Diagnostic>): void {

            function toInternalSeverity(severity: vscode.DiagnosticSeverity): DiagnosticSeverity {
                // there is a typing mismatch, trying to use the proper switch
                // mixes error with warnings etc...
                // just cast for now, this as the correct behaviour
                return severity as DiagnosticSeverity;
                // we don't want to rely on the runtime vscode module here, so we use our version
                // of the enum
                /*
                switch ((severity as unknown) as VsCodeDiagnosticSeverity)
                {
                    case VsCodeDiagnosticSeverity.Warning:
                        return DiagnosticSeverity.Warning;
                    case VsCodeDiagnosticSeverity.Information:
                        return DiagnosticSeverity.Information;
                    case VsCodeDiagnosticSeverity.Hint:
                        return DiagnosticSeverity.Hint;
                    case VsCodeDiagnosticSeverity.Error:
                        return DiagnosticSeverity.Error;
                }
                return DiagnosticSeverity.Error;
                // */
            }

            if (isVsCodeUri(arg0)) {
                if (this.collection) {
                    if (arg1) {
                        this.collection.set(arg0.toString(), arg1.map(diag => {
                            return {
                                range: diag.range,
                                code: diag.code,
                                source: diag.source,
                                message: diag.message,
                                tags: diag.tags,
                                relatedInformation: undefined,
                                severity: toInternalSeverity(diag.severity)
                            };
                        }));
                    } else {
                        this.collection.set(arg0.toString(), []);
                    }
                }
            } else {
                arg0.forEach(element => {
                    this.set(element[0], element[1]);
                });
            }
        }

        dispose(): void {
            if (this.collection) {
                this.collection.dispose();
            }
        }

        delete(uri: vscode.Uri) { }
        clear() { }
        forEach(callback: any, thisArg?: any) { }
        get(uri: vscode.Uri) { return undefined; }
        has(uri: vscode.Uri) { return false; }
    }

    const languages: typeof vscode.languages = {
        match(selector, document): number {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            if (!DocumentIdentifier.is(document)) {
                throw new Error('unexpected document: ' + JSON.stringify(document));
            }
            const services = servicesProvider();
            const result = services.languages.match(selector, document);
            return result ? 1 : 0;
        },
        registerCallHierarchyProvider(
            selector: vscode.DocumentSelector,
            provider: vscode.CallHierarchyProvider): vscode.Disposable {

            /* empty stub for now */
            return {
                dispose(): void {
                }
            }
        },
        createDiagnosticCollection(name?: string): vscode.DiagnosticCollection {
            return new ApiDiagnosticCollection(name);
        },
        registerCompletionItemProvider(selector, provider, ...triggerCharacters) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerCompletionItemProvider) {
                return Disposable.create(() => { });
            }
            const resolveCompletionItem = provider.resolveCompletionItem;
            return languages.registerCompletionItemProvider(selector, {
                provideCompletionItems({ textDocument, position, context }, token) {
                    return provider.provideCompletionItems(<any>textDocument, <any>position, token, context || {
                        triggerKind: CompletionTriggerKind.Invoked
                    }) as any;
                },
                resolveCompletionItem: resolveCompletionItem ? (item, token) => {
                    return resolveCompletionItem(item as any, token) as any;
                } : undefined
            }, ...triggerCharacters);
        },
        registerCodeActionsProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerCodeActionsProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerCodeActionsProvider(selector, {
                provideCodeActions({ textDocument, range, context }, token) {
                    return provider.provideCodeActions(<any>textDocument, <any>range, <any>context, token) as any;
                }
            });
        },
        registerCodeLensProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerCodeLensProvider) {
                return Disposable.create(() => { });
            }
            const resolveCodeLens = provider.resolveCodeLens;
            return languages.registerCodeLensProvider(selector, {
                provideCodeLenses({ textDocument }, token) {
                    return provider.provideCodeLenses(<any>textDocument, token) as any;
                },
                resolveCodeLens: resolveCodeLens ? (codeLens, token) => {
                    return resolveCodeLens(<any>codeLens, token) as any;
                } : undefined
            });
        },
        registerDefinitionProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDefinitionProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDefinitionProvider(selector, {
                provideDefinition({ textDocument, position }, token) {
                    return provider.provideDefinition(<any>textDocument, <any>position, token) as any;
                }
            });
        },
        registerImplementationProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerImplementationProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerImplementationProvider(selector, {
                provideImplementation({ textDocument, position }, token) {
                    return provider.provideImplementation(<any>textDocument, <any>position, token) as any;
                }
            });
        },
        registerTypeDefinitionProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerTypeDefinitionProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerTypeDefinitionProvider(selector, {
                provideTypeDefinition({ textDocument, position }, token) {
                    return provider.provideTypeDefinition(<any>textDocument, <any>position, token) as any;
                }
            });
        },
        registerDeclarationProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDeclarationProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDeclarationProvider(selector, {
                provideDeclaration({ textDocument, position }, token) {
                    return provider.provideDeclaration(<any>textDocument, <any>position, token) as any;
                }
            })
        },
        registerHoverProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (languages.registerHoverProvider) {
                return languages.registerHoverProvider(selector, {
                    provideHover({ textDocument, position }, token) {
                        return provider.provideHover(<any>textDocument, <any>position, token) as any;
                    }
                });
            }
            return Disposable.create(() => { });
        },
        registerDocumentHighlightProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDocumentHighlightProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDocumentHighlightProvider(selector, {
                provideDocumentHighlights({ textDocument, position }, token) {
                    return provider.provideDocumentHighlights(<any>textDocument, <any>position, token) as any;
                }
            });
        },
        registerDocumentSymbolProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDocumentSymbolProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDocumentSymbolProvider(selector, {
                provideDocumentSymbols({ textDocument }, token) {
                    return provider.provideDocumentSymbols(<any>textDocument, token) as any;
                }
            });
        },
        registerWorkspaceSymbolProvider(provider) {
            const { languages } = servicesProvider();
            if (!languages.registerWorkspaceSymbolProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerWorkspaceSymbolProvider({
                provideWorkspaceSymbols({ query }, token) {
                    return provider.provideWorkspaceSymbols(query, token) as any;
                }
            });
        },
        registerReferenceProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerReferenceProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerReferenceProvider(selector, {
                provideReferences({ textDocument, position, context }, token) {
                    return provider.provideReferences(<any>textDocument, <any>position, context, token) as any
                }
            });
        },
        registerRenameProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerRenameProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerRenameProvider(selector, {
                provideRenameEdits({ textDocument, position, newName }, token) {
                    return provider.provideRenameEdits(<any>textDocument, <any>position, newName, token) as any
                }
            });
        },
        registerDocumentFormattingEditProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDocumentFormattingEditProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDocumentFormattingEditProvider(selector, {
                provideDocumentFormattingEdits({ textDocument, options }, token) {
                    return provider.provideDocumentFormattingEdits(<any>textDocument, <any>options, token) as any
                }
            });
        },
        registerDocumentRangeFormattingEditProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDocumentRangeFormattingEditProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerDocumentRangeFormattingEditProvider(selector, {
                provideDocumentRangeFormattingEdits({ textDocument, range, options }, token) {
                    return provider.provideDocumentRangeFormattingEdits(<any>textDocument, <any>range, <any>options, token) as any
                }
            });
        },
        registerOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacter) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerOnTypeFormattingEditProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerOnTypeFormattingEditProvider(selector, {
                provideOnTypeFormattingEdits({ textDocument, position, ch, options }, token) {
                    return provider.provideOnTypeFormattingEdits(<any>textDocument, <any>position, ch, <any>options, token) as any
                }
            }, firstTriggerCharacter, ...moreTriggerCharacter);
        },
        registerSignatureHelpProvider(selector: vscode.DocumentSelector, provider: vscode.SignatureHelpProvider, firstItem?: string | vscode.SignatureHelpProviderMetadata, ...remaining: string[]) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerSignatureHelpProvider) {
                return Disposable.create(() => { });
            }
            let triggerCharacters;
            let retriggerCharacters;
            if (typeof firstItem === 'string') {
                triggerCharacters = [firstItem, ...remaining];
            } else if (firstItem) {
                triggerCharacters = firstItem.triggerCharacters;
                retriggerCharacters = firstItem.retriggerCharacters;
            }
            return languages.registerSignatureHelpProvider(selector, {
                triggerCharacters,
                retriggerCharacters,
                provideSignatureHelp({ textDocument, position }, token, context) {
                    return provider.provideSignatureHelp(<any>textDocument, <any>position, token, <any>context) as any
                }
            });
        },
        registerDocumentLinkProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerDocumentLinkProvider) {
                return Disposable.create(() => { });
            }
            const resolveDocumentLink = provider.resolveDocumentLink;
            return languages.registerDocumentLinkProvider(selector, {
                provideDocumentLinks({ textDocument }, token) {
                    return provider.provideDocumentLinks(<any>textDocument, token) as any
                },
                resolveDocumentLink: resolveDocumentLink ? (link, token) => {
                    return resolveDocumentLink(<any>link, token) as any
                } : undefined
            });
        },
        registerColorProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerColorProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerColorProvider(selector, {
                provideDocumentColors({ textDocument }, token) {
                    return provider.provideDocumentColors(<any>textDocument, token) as any
                },
                provideColorPresentations({ textDocument, color, range }, token) {
                    return provider.provideColorPresentations(color, {
                        document: <any>textDocument,
                        range: <any>range
                    }, token) as any
                }
            });
        },
        registerFoldingRangeProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerFoldingRangeProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerFoldingRangeProvider(selector, {
                provideFoldingRanges({ textDocument }, token) {
                    return provider.provideFoldingRanges(<any>textDocument, {}, token) as any;
                }
            });
        },
        registerSelectionRangeProvider(selector, provider) {
            if (!isDocumentSelector(selector)) {
                throw new Error('unexpected selector: ' + JSON.stringify(selector));
            }
            const { languages } = servicesProvider();
            if (!languages.registerSelectionRangeProvider) {
                return Disposable.create(() => { });
            }
            return languages.registerSelectionRangeProvider(selector, {
                provideSelectionRanges({ textDocument, positions }, token) {
                    return provider.provideSelectionRanges(<any>textDocument, <any>positions, token) as any;
                }
            });
        },
        getLanguages: unsupported,
        setTextDocumentLanguage: unsupported,
        getDiagnostics: unsupported,
        setLanguageConfiguration: unsupported,
        onDidChangeDiagnostics: unsupported
    };
    function showMessage(type: MessageType, arg0: any, ...arg1: any[]): Thenable<any> {
        if (typeof arg0 !== "string") {
            throw new Error('unexpected message: ' + JSON.stringify(arg0));
        }
        const message: string = arg0;
        if (arg1 !== undefined && !Array.isArray(arg1)) {
            throw new Error('unexpected actions: ' + JSON.stringify(arg1));
        }
        const actions: vscode.MessageItem[] = arg1 || [];
        const { window } = servicesProvider();
        if (!window) {
            return Promise.resolve(undefined);
        }
        return window.showMessage(type, message, ...actions);
    }
    const window: typeof vscode.window = {
        showInformationMessage: showMessage.bind(undefined, MessageType.Info),
        showWarningMessage: showMessage.bind(undefined, MessageType.Warning),
        showErrorMessage: showMessage.bind(undefined, MessageType.Error),
        createOutputChannel(name: string): vscode.OutputChannel {
            const { window } = servicesProvider();
            const createOutputChannel = window ? window.createOutputChannel : undefined;
            const channel: OutputChannel | undefined = createOutputChannel ? createOutputChannel.bind(window)(name) : undefined;
            return {
                name,
                append: channel ? channel.append.bind(channel) : () => { },
                appendLine: channel ? channel.appendLine.bind(channel) : () => { },
                clear: unsupported,
                show: (arg: any) => {
                    if (arg !== undefined && typeof arg !== 'boolean') {
                        throw new Error('unexpected preserveFocus argument: ' + JSON.stringify(arg, undefined, 4));
                    }
                    return channel ? channel.show(arg) : () => { }
                },
                hide: unsupported,
                dispose: channel ? channel.dispose.bind(channel) : () => { }
            };
        },
        withProgress: (options, task) => {
            const { window } = servicesProvider();
            if (window && window.withProgress) {
                return window.withProgress(options, task);
            }
            return task({ report: () => { } }, new vscode.CancellationTokenSource().token);
        },
        showTextDocument: unsupported,
        createTextEditorDecorationType: unsupported,
        showQuickPick: unsupported,
        showWorkspaceFolderPick: unsupported,
        showOpenDialog: unsupported,
        showSaveDialog: unsupported,
        showInputBox: unsupported,
        createWebviewPanel: unsupported,
        setStatusBarMessage: unsupported,
        withScmProgress: unsupported,
        createStatusBarItem: unsupported,
        createTerminal: unsupported,
        registerTreeDataProvider: unsupported,
        createTreeView: unsupported,
        registerWebviewPanelSerializer: unsupported,
        get activeTextEditor() {
            return unsupported();
        },
        get visibleTextEditors() {
            return unsupported();
        },
        onDidChangeActiveTextEditor: unsupported,
        onDidChangeVisibleTextEditors: unsupported,
        onDidChangeTextEditorSelection: unsupported,
        onDidChangeTextEditorVisibleRanges: unsupported,
        onDidChangeTextEditorOptions: unsupported,
        onDidChangeTextEditorViewColumn: unsupported,
        get terminals() {
            return unsupported();
        },
        get activeTerminal() {
            return unsupported();
        },
        onDidChangeActiveTerminal: unsupported,
        onDidOpenTerminal: unsupported,
        onDidCloseTerminal: unsupported,
        get state() {
            return unsupported();
        },
        onDidChangeWindowState: unsupported,
        createQuickPick: unsupported,
        createInputBox: unsupported,
        registerUriHandler: unsupported
    };
    const commands: typeof vscode.commands = {
        registerCommand(command, callback, thisArg): Disposable {
            const { commands } = servicesProvider();
            if (!commands) {
                return Disposable.create(() => { });
            }
            return commands.registerCommand(command, callback, thisArg);
        },
        registerTextEditorCommand: unsupported,
        executeCommand: unsupported,
        getCommands: unsupported
    };
    class CodeDisposable implements vscode.Disposable {
        constructor(public callOnDispose: Function) { }
        dispose() {
            this.callOnDispose();
        }
    }
    return {
        workspace,
        languages,
        window,
        commands,
        Uri,
        CompletionItem,
        CodeLens,
        DocumentLink,
        CodeActionKind,
        Disposable: CodeDisposable,
        SignatureHelpTriggerKind: SignatureHelpTriggerKind,
        DiagnosticSeverity: ServicesModule.DiagnosticSeverity
    } as any;
}
