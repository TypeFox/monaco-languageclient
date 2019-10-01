/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import globToRegExp = require('glob-to-regexp');
import {
    Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider,
    SignatureHelpProvider, DefinitionProvider, ReferenceProvider, DocumentHighlightProvider,
    DocumentSymbolProvider, CodeActionProvider, CodeLensProvider, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider,
    OnTypeFormattingEditProvider, RenameProvider,
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
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerCompletionItemProvider(language, completionProvider))
        };
        return providers;
    }

    protected createCompletionProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
        return {
            triggerCharacters,
            provideCompletionItems: async (model, position, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const wordUntil = model.getWordUntilPosition(position);
                const defaultRange = new monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
                const params = this.m2p.asCompletionParams(model, position, context);
                const result = await provider.provideCompletionItems(params, token);
                return result && this.p2m.asCompletionResult(result, defaultRange);
            },
            resolveCompletionItem: provider.resolveCompletionItem ? async (model, position, item, token) => {
                const protocolItem = this.m2p.asCompletionItem(item);
                const resolvedItem = await provider.resolveCompletionItem!(protocolItem, token);
                if (resolvedItem) {
                    const resolvedCompletionItem = this.p2m.asCompletionItem(resolvedItem, item.range);
                    Object.assign(item, resolvedCompletionItem);
                }
                return item;
            } : undefined
        };
    }

    registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable {
        const hoverProvider = this.createHoverProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerHoverProvider(language, hoverProvider));
        }
        return providers;
    }

    protected createHoverProvider(selector: DocumentSelector, provider: HoverProvider): monaco.languages.HoverProvider {
        return {
            provideHover: async (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const hover = await provider.provideHover(params, token);
                return hover && this.p2m.asHover(hover);
            }
        }
    }

    registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable {
        const signatureHelpProvider = this.createSignatureHelpProvider(selector, provider, ...triggerCharacters);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerSignatureHelpProvider(language, signatureHelpProvider));
        }
        return providers;
    }

    protected createSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): monaco.languages.SignatureHelpProvider {
        const signatureHelpTriggerCharacters = [...(provider.triggerCharacters || triggerCharacters || [])];
        return {
            signatureHelpTriggerCharacters,
            signatureHelpRetriggerCharacters: provider.retriggerCharacters,
            provideSignatureHelp: async (model, position, token, context) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const signatureHelp = await provider.provideSignatureHelp(params, token, this.m2p.asSignatureHelpContext(context))
                return signatureHelp && this.p2m.asSignatureHelpResult(signatureHelp);
            }
        }
    }

    registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable {
        const definitionProvider = this.createDefinitionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerDefinitionProvider(language, definitionProvider));
        }
        return providers;
    }

    protected createDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): monaco.languages.DefinitionProvider {
        return {
            provideDefinition: async (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): Disposable {
        const referenceProvider = this.createReferenceProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerReferenceProvider(language, referenceProvider));
        }
        return providers;
    }

    protected createReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): monaco.languages.ReferenceProvider {
        return {
            provideReferences: async (model, position, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asReferenceParams(model, position, context);
                const result = await provider.provideReferences(params, token);
                return result && this.p2m.asReferences(result);
            }
        }
    }

    registerDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): Disposable {
        const documentHighlightProvider = this.createDocumentHighlightProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerDocumentHighlightProvider(language, documentHighlightProvider));
        }
        return providers;
    }

    protected createDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): monaco.languages.DocumentHighlightProvider {
        return {
            provideDocumentHighlights: async (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDocumentHighlights(params, token);
                return result && this.p2m.asDocumentHighlights(result);
            }
        }
    }

    registerDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): Disposable {
        const documentSymbolProvider = this.createDocumentSymbolProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerDocumentSymbolProvider(language, documentSymbolProvider));
        }
        return providers;
    }

    protected createDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): monaco.languages.DocumentSymbolProvider {
        return {
            provideDocumentSymbols: async (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asDocumentSymbolParams(model);
                const result = await provider.provideDocumentSymbols(params, token);
                return result && this.p2m.asDocumentSymbols(result);
            }
        }
    }

    registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider): Disposable {
        const codeActionProvider = this.createCodeActionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerCodeActionProvider(language, codeActionProvider));
        }
        return providers;
    }

    protected createCodeActionProvider(selector: DocumentSelector, provider: CodeActionProvider): monaco.languages.CodeActionProvider {
        return {
            provideCodeActions: async (model, range, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    // FIXME: get rid of `!` when https://github.com/microsoft/monaco-editor/issues/1560 is resolved
                    return undefined!;
                }
                const params = this.m2p.asCodeActionParams(model, range, context);
                const result = await provider.provideCodeActions(params, token);
                // FIXME: get rid of `|| undefined!` when https://github.com/microsoft/monaco-editor/issues/1560 is resolved
                return result && this.p2m.asCodeActionList(result) || undefined!;
            }
        }
    }

    registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): Disposable {
        const codeLensProvider = this.createCodeLensProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerCodeLensProvider(language, codeLensProvider));
        }
        return providers;
    }

    protected createCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): monaco.languages.CodeLensProvider {
        return {
            provideCodeLenses: async (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asCodeLensParams(model);
                const result = await provider.provideCodeLenses(params, token);
                return result && this.p2m.asCodeLensList(result);
            },
            resolveCodeLens: provider.resolveCodeLens ? async (model, codeLens, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return codeLens;
                }
                const protocolCodeLens = this.m2p.asCodeLens(codeLens);
                const result = await provider.resolveCodeLens!(protocolCodeLens, token);
                if (result) {
                    const resolvedCodeLens = this.p2m.asCodeLens(result);
                    Object.assign(codeLens, resolvedCodeLens);
                }
                return codeLens;
            } : ((_, codeLens) => codeLens)
        }
    }

    registerDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): Disposable {
        const documentFormattingEditProvider = this.createDocumentFormattingEditProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerDocumentFormattingEditProvider(language, documentFormattingEditProvider));
        }
        return providers;
    }

    protected createDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): monaco.languages.DocumentFormattingEditProvider {
        return {
            provideDocumentFormattingEdits: async (model, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asDocumentFormattingParams(model, options);
                const result = await provider.provideDocumentFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): Disposable {
        const documentRangeFormattingEditProvider = this.createDocumentRangeFormattingEditProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerDocumentRangeFormattingEditProvider(language, documentRangeFormattingEditProvider));
        }
        return providers;
    }

    createDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): monaco.languages.DocumentRangeFormattingEditProvider {
        return {
            provideDocumentRangeFormattingEdits: async (model, range, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asDocumentRangeFormattingParams(model, range, options);
                const result = await provider.provideDocumentRangeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable {
        const onTypeFormattingEditProvider = this.createOnTypeFormattingEditProvider(selector, provider, firstTriggerCharacter, ...moreTriggerCharacter);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerOnTypeFormattingEditProvider(language, onTypeFormattingEditProvider));
        }
        return providers;
    }

    protected createOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): monaco.languages.OnTypeFormattingEditProvider {
        const autoFormatTriggerCharacters = [firstTriggerCharacter].concat(moreTriggerCharacter)
        return {
            autoFormatTriggerCharacters,
            provideOnTypeFormattingEdits: async (model, position, ch, options, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asDocumentOnTypeFormattingParams(model, position, ch, options);
                const result = await provider.provideOnTypeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerRenameProvider(selector: DocumentSelector, provider: RenameProvider): Disposable {
        const renameProvider = this.createRenameProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerRenameProvider(language, renameProvider));
        }
        return providers;
    }

    protected createRenameProvider(selector: DocumentSelector, provider: RenameProvider): monaco.languages.RenameProvider {
        return {
            provideRenameEdits: async (model, position, newName, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asRenameParams(model, position, newName);
                const result = await provider.provideRenameEdits(params, token);
                return result && this.p2m.asWorkspaceEdit(result);
            }
        }
    }

    registerDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): Disposable {
        const linkProvider = this.createDocumentLinkProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerLinkProvider(language, linkProvider));
        }
        return providers;
    }

    protected createDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): monaco.languages.LinkProvider {
        return {
            provideLinks: async (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asDocumentLinkParams(model);
                const result = await provider.provideDocumentLinks(params, token);
                return result && this.p2m.asDocumentLinks(result);
            },
            resolveLink: async (link: monaco.languages.ILink, token) => {
                // resolve the link if the provider supports it
                // and the link doesn't have a url set
                if (provider.resolveDocumentLink && (link.url === null || link.url === undefined)) {
                    const documentLink = this.m2p.asDocumentLink(link);
                    const result = await provider.resolveDocumentLink(documentLink, token);
                    if (result) {
                        const resolvedLink = this.p2m.asDocumentLink(result);
                        Object.assign(link, resolvedLink);
                    }
                }
                return link;
            }
        }
    }

    registerImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): Disposable {
        const implementationProvider = this.createImplementationProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerImplementationProvider(language, implementationProvider));
        }
        return providers;
    }

    protected createImplementationProvider(selector: DocumentSelector, provider: ImplementationProvider): monaco.languages.ImplementationProvider {
        return {
            provideImplementation: async (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideImplementation(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): Disposable {
        const typeDefinitionProvider = this.createTypeDefinitionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerTypeDefinitionProvider(language, typeDefinitionProvider));
        }
        return providers;
    }

    protected createTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): monaco.languages.TypeDefinitionProvider {
        return {
            provideTypeDefinition: async (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideTypeDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): Disposable {
        const documentColorProvider = this.createDocumentColorProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerColorProvider(language, documentColorProvider));
        }
        return providers;
    }

    protected createDocumentColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): monaco.languages.DocumentColorProvider {
        return {
            provideDocumentColors: async (model, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentColors({ textDocument }, token);
                return result && this.p2m.asColorInformations(result);
            },
            provideColorPresentations: async (model, info, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const range = this.m2p.asRange(info.range);
                const result = await provider.provideColorPresentations({
                    textDocument,
                    color: info.color,
                    range
                }, token);
                return result && this.p2m.asColorPresentations(result);
            }
        }
    }

    registerFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): Disposable {
        const foldingRangeProvider = this.createFoldingRangeProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of this.matchLanguage(selector)) {
            providers.push(monaco.languages.registerFoldingRangeProvider(language, foldingRangeProvider));
        }
        return providers;
    }

    protected createFoldingRangeProvider(selector: DocumentSelector, provider: FoldingRangeProvider): monaco.languages.FoldingRangeProvider {
        return {
            provideFoldingRanges: async (model, context, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return undefined;
                }
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideFoldingRanges({
                    textDocument
                }, token);
                return result && this.p2m.asFoldingRanges(result);
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

    protected matchLanguage(selector: string | DocumentFilter | DocumentSelector): Set<string> {
        const languages = new Set<string>();
        if (Array.isArray(selector)) {
            for (const filter of selector) {
                languages.add(this.matchLanguageByFilter(filter));
            }
        } else {
            languages.add(this.matchLanguageByFilter(selector));
        }
        return languages;
    }

    protected matchLanguageByFilter(selector: string | DocumentFilter): string {
        if (DocumentFilter.is(selector)) {
            if (!selector.language) {
                return '*';
            }
            return selector.language;
        }
        return selector;
    }

}
