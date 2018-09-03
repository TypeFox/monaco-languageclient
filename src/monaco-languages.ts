/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import globToRegExp = require('glob-to-regexp');
import {
    Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider,
    SignatureHelpProvider, DefinitionProvider, ReferenceProvider, DocumentHighlightProvider,
    DocumentSymbolProvider, CodeActionProvider, CodeLensProvider, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider, OnTypeFormattingEditProvider, RenameProvider,
    DocumentFilter, DocumentSelector, DocumentLinkProvider, ImplementationProvider, TypeDefinitionProvider, DocumentColorProvider,
    FoldingRangeProvider
} from "./services";
import { MonacoDiagnosticCollection } from './monaco-diagnostic-collection';
import { ProtocolToMonacoConverter, MonacoToProtocolConverter } from './monaco-converter';
import { DisposableCollection, Disposable } from './disposable';

export interface MonacoModelIdentifier {
    uri: monaco.Uri;
    languageId: string;
}

export namespace MonacoModelIdentifier {
    export function fromDocument(document: DocumentIdentifier): MonacoModelIdentifier {
        return {
            uri: monaco.Uri.parse(document.uri),
            languageId: document.languageId
        }
    }
    export function fromModel(model: monaco.editor.IReadOnlyModel): MonacoModelIdentifier {
        return {
            uri: model.uri,
            languageId: model.getModeId()
        }
    }
}

export function testGlob(pattern: string, value: string): boolean {
    const regExp = globToRegExp(pattern, {
        extended: true,
        globstar: true
    });
    return regExp.test(value);
}

export function getLanguages(): string[] {
    const languages = [];
    for (const language of monaco.languages.getLanguages().map(l => l.id)) {
        if (languages.indexOf(language) === -1) {
            languages.push(language);
        }
    }
    return languages;
}

export class MonacoLanguages implements Languages {

    constructor(
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter
    ) { }

    match(selector: DocumentSelector, document: DocumentIdentifier): boolean {
        return this.matchModel(selector, MonacoModelIdentifier.fromDocument(document));
    }

    createDiagnosticCollection(name?: string): DiagnosticCollection {
        return new MonacoDiagnosticCollection(name || 'default', this.p2m);
    }

    registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable {
        const completionProvider = this.createCompletionProvider(selector, provider, ...triggerCharacters);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerCompletionItemProvider(language, completionProvider))
            }
        };
        return providers;
    }

    protected createCompletionProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
        return {
            triggerCharacters,
            provideCompletionItems: (model, position, token, context) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asCompletionParams(model, position, context);
                return provider.provideCompletionItems(params, token).then(result => this.p2m.asCompletionResult(result));
            },
            resolveCompletionItem: provider.resolveCompletionItem ? (item, token) => {
                const protocolItem = this.m2p.asCompletionItem(item);
                return provider.resolveCompletionItem!(protocolItem, token).then(resolvedItem => {
                    const resolvedCompletionItem = this.p2m.asCompletionItem(resolvedItem);
                    Object.assign(item, resolvedCompletionItem);
                    return item;
                });
            } : undefined
        };
    }

    registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable {
        const hoverProvider = this.createHoverProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerHoverProvider(language, hoverProvider));
            }
        }
        return providers;
    }

    protected createHoverProvider(selector: DocumentSelector, provider: HoverProvider): monaco.languages.HoverProvider {
        return {
            provideHover: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideHover(params, token).then(hover => this.p2m.asHover(hover));
            }
        }
    }

    registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable {
        const signatureHelpProvider = this.createSignatureHelpProvider(selector, provider, ...triggerCharacters);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerSignatureHelpProvider(language, signatureHelpProvider));
            }
        }
        return providers;
    }

    protected createSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): monaco.languages.SignatureHelpProvider {
        const signatureHelpTriggerCharacters = triggerCharacters;
        return {
            signatureHelpTriggerCharacters,
            provideSignatureHelp: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideSignatureHelp(params, token).then(signatureHelp => this.p2m.asSignatureHelp(signatureHelp));
            }
        }
    }

    registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable {
        const definitionProvider = this.createDefinitionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerDefinitionProvider(language, definitionProvider));
            }
        }
        return providers;
    }

    protected createDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): monaco.languages.DefinitionProvider {
        return {
            provideDefinition: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideDefinition(params, token).then(result => this.p2m.asDefinitionResult(result));
            }
        }
    }

    registerReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): Disposable {
        const referenceProvider = this.createReferenceProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerReferenceProvider(language, referenceProvider));
            }
        }
        return providers;
    }

    protected createReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): monaco.languages.ReferenceProvider {
        return {
            provideReferences: (model, position, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asReferenceParams(model, position, context);
                return provider.provideReferences(params, token).then(result => this.p2m.asReferences(result));
            }
        }
    }

    registerDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): Disposable {
        const documentHighlightProvider = this.createDocumentHighlightProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerDocumentHighlightProvider(language, documentHighlightProvider));
            }
        }
        return providers;
    }

    protected createDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): monaco.languages.DocumentHighlightProvider {
        return {
            provideDocumentHighlights: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideDocumentHighlights(params, token).then(result => this.p2m.asDocumentHighlights(result));
            }
        }
    }

    registerDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): Disposable {
        const documentSymbolProvider = this.createDocumentSymbolProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerDocumentSymbolProvider(language, documentSymbolProvider));
            }
        }
        return providers;
    }

    protected createDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): monaco.languages.DocumentSymbolProvider {
        return {
            provideDocumentSymbols: (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asDocumentSymbolParams(model);
                return provider.provideDocumentSymbols(params, token).then(result => this.p2m.asDocumentSymbols(result))
            }
        }
    }

    registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider): Disposable {
        const codeActionProvider = this.createCodeActionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerCodeActionProvider(language, codeActionProvider));
            }
        }
        return providers;
    }

    protected createCodeActionProvider(selector: DocumentSelector, provider: CodeActionProvider): monaco.languages.CodeActionProvider {
        return {
            provideCodeActions: (model, range, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asCodeActionParams(model, range, context);
                return provider.provideCodeActions(params, token).then(result => this.p2m.asCodeActions(result));
            }
        }
    }

    registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): Disposable {
        const codeLensProvider = this.createCodeLensProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerCodeLensProvider(language, codeLensProvider));
            }
        }
        return providers;
    }

    protected createCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): monaco.languages.CodeLensProvider {
        return {
            provideCodeLenses: (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asCodeLensParams(model);
                return provider.provideCodeLenses(params, token).then(result => this.p2m.asCodeLenses(result))
            },
            resolveCodeLens: provider.resolveCodeLens ? (model, codeLens, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return codeLens;
                }
                const protocolCodeLens = this.m2p.asCodeLens(codeLens);
                return provider.resolveCodeLens!(protocolCodeLens, token).then(result => {
                    const resolvedCodeLens = this.p2m.asCodeLens(result);
                    Object.assign(codeLens, resolvedCodeLens);
                    return codeLens;
                });
            } : ((m, codeLens, t) => codeLens)
        }
    }

    registerDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): Disposable {
        const documentFormattingEditProvider = this.createDocumentFormattingEditProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerDocumentFormattingEditProvider(language, documentFormattingEditProvider));
            }
        }
        return providers;
    }

    protected createDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): monaco.languages.DocumentFormattingEditProvider {
        return {
            provideDocumentFormattingEdits: (model, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asDocumentFormattingParams(model, options);
                return provider.provideDocumentFormattingEdits(params, token).then(result => this.p2m.asTextEdits(result))
            }
        }
    }

    registerDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): Disposable {
        const documentRangeFormattingEditProvider = this.createDocumentRangeFormattingEditProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerDocumentRangeFormattingEditProvider(language, documentRangeFormattingEditProvider));
            }
        }
        return providers;
    }

    createDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): monaco.languages.DocumentRangeFormattingEditProvider {
        return {
            provideDocumentRangeFormattingEdits: (model, range, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asDocumentRangeFormattingParams(model, range, options);
                return provider.provideDocumentRangeFormattingEdits(params, token).then(result => this.p2m.asTextEdits(result))
            }
        }
    }

    registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable {
        const onTypeFormattingEditProvider = this.createOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacter);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerOnTypeFormattingEditProvider(language, onTypeFormattingEditProvider));
            }
        }
        return providers;
    }

    protected createOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): monaco.languages.OnTypeFormattingEditProvider {
        const autoFormatTriggerCharacters = [firstTriggerCharacter].concat(moreTriggerCharacter)
        return {
            autoFormatTriggerCharacters,
            provideOnTypeFormattingEdits: (model, position, ch, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asDocumentOnTypeFormattingParams(model, position, ch, options);
                return provider.provideOnTypeFormattingEdits(params, token).then(result => this.p2m.asTextEdits(result))
            }
        }
    }

    registerRenameProvider(selector: DocumentSelector, provider: RenameProvider): Disposable {
        const renameProvider = this.createRenameProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerRenameProvider(language, renameProvider));
            }
        }
        return providers;
    }

    protected createRenameProvider(selector: DocumentSelector, provider: RenameProvider): monaco.languages.RenameProvider {
        return {
            provideRenameEdits: (model, position, newName, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asRenameParams(model, position, newName);
                return provider.provideRenameEdits(params, token).then(result => this.p2m.asWorkspaceEdit(result))
            }
        }
    }

    registerDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): Disposable {
        const linkProvider = this.createDocumentLinkProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerLinkProvider(language, linkProvider));
            }
        }
        return providers;
    }

    protected createDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): monaco.languages.LinkProvider {
        return {
            provideLinks: (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asDocumentLinkParams(model);
                return provider.provideDocumentLinks(params, token).then(result => this.p2m.asDocumentLinks(result));
            },

            resolveLink: (link: monaco.languages.ILink, token) => {
                // resolve the link if the provider supports it
                // and the link doesn't have a url set
                if (provider.resolveDocumentLink && (link.url === null || link.url === undefined)) {
                    const documentLink = this.m2p.asDocumentLink(link);
                    return provider.resolveDocumentLink(documentLink, token).then(result => {
                        const resolvedLink = this.p2m.asDocumentLink(result);
                        Object.assign(link, resolvedLink);
                        return link;
                    });
                }
                return link;
            }
        }
    }

    registerImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): Disposable {
        const implementationProvider = this.createImplementationProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerImplementationProvider(language, implementationProvider));
            }
        }
        return providers;
    }

    protected createImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): monaco.languages.ImplementationProvider {
        return {
            provideImplementation: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideImplementation(params, token).then(result => this.p2m.asDefinitionResult(result));
            }
        }
    }

    registerTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): Disposable {
        const typeDefinitionProvider = this.createTypeDefinitionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerTypeDefinitionProvider(language, typeDefinitionProvider));
            }
        }
        return providers;
    }

    protected createTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): monaco.languages.TypeDefinitionProvider {
        return {
            provideTypeDefinition: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined!;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                return provider.provideTypeDefinition(params, token).then(result => this.p2m.asDefinitionResult(result));
            }
        }
    }

    registerColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): Disposable {
        const documentColorProvider = this.createDocumentColorProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerColorProvider(language, documentColorProvider));
            }
        }
        return providers;
    }

    protected createDocumentColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): monaco.languages.DocumentColorProvider {
        return {
            provideDocumentColors: (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                return provider.provideDocumentColors({ textDocument }, token).then(result => this.p2m.asColorInformations(result));
            },
            provideColorPresentations: (model, info, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const range = this.m2p.asRange(info.range);
                return provider.provideColorPresentations({
                    textDocument,
                    color: info.color,
                    range
                }, token).then(result => this.p2m.asColorPresentations(result))
            }
        }
    }

    registerFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): Disposable {
        const foldingRangeProvider = this.createFoldingRangeProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of getLanguages()) {
            if (this.matchLanguage(selector, language)) {
                providers.push(monaco.languages.registerFoldingRangeProvider(language, foldingRangeProvider));
            }
        }
        return providers;
    }

    protected createFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): monaco.languages.FoldingRangeProvider {
        return {
            provideFoldingRanges: (model, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                return provider.provideFoldingRanges({
                    textDocument
                }, token).then(result => this.p2m.asFoldingRanges(result));
            }
        }
    }

    protected matchModel(selector: string | DocumentFilter | DocumentSelector, model: MonacoModelIdentifier): boolean {
        if (Array.isArray(selector)) {
            return selector.some(filter => this.matchModel(filter, model));
        }
        if (DocumentFilter.is(selector)) {
            if (!!selector.language && selector.language !== model.languageId) {
                return false;
            }
            if (!!selector.scheme && selector.scheme !== model.uri.scheme) {
                return false;
            }
            if (!!selector.pattern && !testGlob(selector.pattern, model.uri.path)) {
                return false;
            }
            return true;
        }
        return selector === model.languageId;
    }

    protected matchLanguage(selector: string | DocumentFilter | DocumentSelector, languageId: string): boolean {
        if (Array.isArray(selector)) {
            return selector.some(filter => this.matchLanguage(filter, languageId));
        }

        if (DocumentFilter.is(selector)) {
            return !selector.language || selector.language === languageId;
        }

        return selector === languageId;
    }

}
