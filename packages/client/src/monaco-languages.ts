/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import globToRegExp from 'glob-to-regexp';
import {
    Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider,
    SignatureHelpProvider, DefinitionProvider, ReferenceProvider, DocumentHighlightProvider,
    DocumentSymbolProvider, CodeActionProvider, CodeLensProvider, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider,
    OnTypeFormattingEditProvider, RenameProvider,
    DocumentFilter, DocumentSelector, DocumentLinkProvider, ImplementationProvider, TypeDefinitionProvider, DocumentColorProvider,
    FoldingRangeProvider, SemanticTokensLegend,
    DocumentSemanticTokensProvider, DocumentRangeSemanticTokensProvider
} from "./services";

import { MonacoDiagnosticCollection } from './monaco-diagnostic-collection';
import { ProtocolToMonacoConverter, MonacoToProtocolConverter } from './monaco-converter';
import { Disposable } from './disposable';

export interface MonacoModelIdentifier {
    uri: monaco.Uri;
    languageId: string;
}

export namespace MonacoModelIdentifier {
    export function fromDocument(_monaco: typeof monaco, document: DocumentIdentifier): MonacoModelIdentifier {
        return {
            uri: _monaco.Uri.parse(document.uri),
            languageId: document.languageId
        }
    }
    export function fromModel(model: monaco.editor.IReadOnlyModel): MonacoModelIdentifier {
        return {
            uri: model.uri,
            languageId: model.getLanguageId()
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
        protected readonly _monaco: typeof monaco,
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter
    ) { }

    match(selector: DocumentSelector, document: DocumentIdentifier): boolean {
        return this.matchModel(selector, MonacoModelIdentifier.fromDocument(this._monaco, document));
    }

    createDiagnosticCollection(name?: string): DiagnosticCollection {
        return new MonacoDiagnosticCollection(this._monaco, name || 'default', this.p2m);
    }

    registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable {
        const completionProvider = this.createCompletionProvider(provider, ...triggerCharacters);
        return this._monaco.languages.registerCompletionItemProvider(selector, completionProvider);
    }

    protected createCompletionProvider(provider: CompletionItemProvider, ...triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
        return {
            triggerCharacters,
            provideCompletionItems: async (model, position, context, token) => {
                const wordUntil = model.getWordUntilPosition(position);
                const defaultRange = new this._monaco.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
                const params = this.m2p.asCompletionParams(model, position, context);
                const result = await provider.provideCompletionItems(params, token);
                return result && this.p2m.asCompletionResult(result, defaultRange);
            },
            resolveCompletionItem: provider.resolveCompletionItem ? async (item, token) => {
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
        const hoverProvider = this.createHoverProvider(provider);
        return this._monaco.languages.registerHoverProvider(selector, hoverProvider);
    }

    protected createHoverProvider(provider: HoverProvider): monaco.languages.HoverProvider {
        return {
            provideHover: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const hover = await provider.provideHover(params, token);
                return hover && this.p2m.asHover(hover);
            }
        }
    }

    registerSignatureHelpProvider(selector: DocumentSelector, provider: SignatureHelpProvider, ...triggerCharacters: string[]): Disposable {
        const signatureHelpProvider = this.createSignatureHelpProvider(provider, ...triggerCharacters);
        return this._monaco.languages.registerSignatureHelpProvider(selector, signatureHelpProvider);
    }

    protected createSignatureHelpProvider(provider: SignatureHelpProvider, ...triggerCharacters: string[]): monaco.languages.SignatureHelpProvider {
        const signatureHelpTriggerCharacters = [...(provider.triggerCharacters || triggerCharacters || [])];
        return {
            signatureHelpTriggerCharacters,
            signatureHelpRetriggerCharacters: provider.retriggerCharacters,
            provideSignatureHelp: async (model, position, token, context) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const signatureHelp = await provider.provideSignatureHelp(params, token, this.m2p.asSignatureHelpContext(context))
                return signatureHelp && this.p2m.asSignatureHelpResult(signatureHelp);
            }
        }
    }

    registerDefinitionProvider(selector: DocumentSelector, provider: DefinitionProvider): Disposable {
        const definitionProvider = this.createDefinitionProvider(provider);
        return this._monaco.languages.registerDefinitionProvider(selector, definitionProvider);
    }

    protected createDefinitionProvider(provider: DefinitionProvider): monaco.languages.DefinitionProvider {
        return {
            provideDefinition: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerReferenceProvider(selector: DocumentSelector, provider: ReferenceProvider): Disposable {
        const referenceProvider = this.createReferenceProvider(provider);
        return this._monaco.languages.registerReferenceProvider(selector, referenceProvider);
    }

    protected createReferenceProvider(provider: ReferenceProvider): monaco.languages.ReferenceProvider {
        return {
            provideReferences: async (model, position, context, token) => {
                const params = this.m2p.asReferenceParams(model, position, context);
                const result = await provider.provideReferences(params, token);
                return result && this.p2m.asReferences(result);
            }
        }
    }

    registerDocumentHighlightProvider(selector: DocumentSelector, provider: DocumentHighlightProvider): Disposable {
        const documentHighlightProvider = this.createDocumentHighlightProvider(provider);
        return this._monaco.languages.registerDocumentHighlightProvider(selector, documentHighlightProvider);
    }

    protected createDocumentHighlightProvider(provider: DocumentHighlightProvider): monaco.languages.DocumentHighlightProvider {
        return {
            provideDocumentHighlights: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideDocumentHighlights(params, token);
                return result && this.p2m.asDocumentHighlights(result);
            }
        }
    }

    registerDocumentSymbolProvider(selector: DocumentSelector, provider: DocumentSymbolProvider): Disposable {
        const documentSymbolProvider = this.createDocumentSymbolProvider(provider);
        return this._monaco.languages.registerDocumentSymbolProvider(selector, documentSymbolProvider);
    }

    protected createDocumentSymbolProvider(provider: DocumentSymbolProvider): monaco.languages.DocumentSymbolProvider {
        return {
            provideDocumentSymbols: async (model, token) => {
                const params = this.m2p.asDocumentSymbolParams(model);
                const result = await provider.provideDocumentSymbols(params, token);
                return result && this.p2m.asDocumentSymbols(result);
            }
        }
    }

    registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider): Disposable {
        const codeActionProvider = this.createCodeActionProvider(provider);
        return this._monaco.languages.registerCodeActionProvider(selector, codeActionProvider);
    }

    protected createCodeActionProvider(provider: CodeActionProvider): monaco.languages.CodeActionProvider {
        return {
            provideCodeActions: async (model, range, context, token) => {
                const params = this.m2p.asCodeActionParams(model, range, context);
                let result = await provider.provideCodeActions(params, token);
                return result && this.p2m.asCodeActionList(result);
            },
            resolveCodeAction: provider.resolveCodeAction ? async (codeAction, token) => {
                const params = this.m2p.asCodeAction(codeAction);
                const result = await provider.resolveCodeAction!(params, token);
                if (result) {
                    const resolvedCodeAction = this.p2m.asCodeAction(result);
                    Object.assign(codeAction, resolvedCodeAction);
                }
                return codeAction;
            } : undefined
        }
    }

    registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): Disposable {
        const codeLensProvider = this.createCodeLensProvider(provider);
        return this._monaco.languages.registerCodeLensProvider(selector, codeLensProvider);
    }

    protected createCodeLensProvider(provider: CodeLensProvider): monaco.languages.CodeLensProvider {
        return {
            provideCodeLenses: async (model, token) => {
                const params = this.m2p.asCodeLensParams(model);
                const result = await provider.provideCodeLenses(params, token);
                return result && this.p2m.asCodeLensList(result);
            },
            resolveCodeLens: provider.resolveCodeLens ? async (model, codeLens, token) => {
                const protocolCodeLens = this.m2p.asCodeLens(codeLens);
                const result = await provider.resolveCodeLens!(protocolCodeLens, token);
                if (result) {
                    const resolvedCodeLens = this.p2m.asCodeLens(result);
                    Object.assign(codeLens, resolvedCodeLens);
                }
                return codeLens;
            } : undefined
        }
    }

    registerDocumentFormattingEditProvider(selector: DocumentSelector, provider: DocumentFormattingEditProvider): Disposable {
        const documentFormattingEditProvider = this.createDocumentFormattingEditProvider(provider);
        return this._monaco.languages.registerDocumentFormattingEditProvider(selector, documentFormattingEditProvider);
    }

    protected createDocumentFormattingEditProvider(provider: DocumentFormattingEditProvider): monaco.languages.DocumentFormattingEditProvider {
        return {
            provideDocumentFormattingEdits: async (model, options, token) => {
                const params = this.m2p.asDocumentFormattingParams(model, options);
                const result = await provider.provideDocumentFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerDocumentRangeFormattingEditProvider(selector: DocumentSelector, provider: DocumentRangeFormattingEditProvider): Disposable {
        const documentRangeFormattingEditProvider = this.createDocumentRangeFormattingEditProvider(provider);
        return this._monaco.languages.registerDocumentRangeFormattingEditProvider(selector, documentRangeFormattingEditProvider);
    }

    createDocumentRangeFormattingEditProvider(provider: DocumentRangeFormattingEditProvider): monaco.languages.DocumentRangeFormattingEditProvider {
        return {
            provideDocumentRangeFormattingEdits: async (model, range, options, token) => {
                const params = this.m2p.asDocumentRangeFormattingParams(model, range, options);
                const result = await provider.provideDocumentRangeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerOnTypeFormattingEditProvider(selector: DocumentSelector, provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): Disposable {
        const onTypeFormattingEditProvider = this.createOnTypeFormattingEditProvider(provider, firstTriggerCharacter, ...moreTriggerCharacter);
        return this._monaco.languages.registerOnTypeFormattingEditProvider(selector, onTypeFormattingEditProvider);
    }

    protected createOnTypeFormattingEditProvider(provider: OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacter: string[]): monaco.languages.OnTypeFormattingEditProvider {
        const autoFormatTriggerCharacters = [firstTriggerCharacter].concat(moreTriggerCharacter)
        return {
            autoFormatTriggerCharacters,
            provideOnTypeFormattingEdits: async (model, position, ch, options, token) => {
                const params = this.m2p.asDocumentOnTypeFormattingParams(model, position, ch, options);
                const result = await provider.provideOnTypeFormattingEdits(params, token);
                return result && this.p2m.asTextEdits(result);
            }
        }
    }

    registerRenameProvider(selector: DocumentSelector, provider: RenameProvider): Disposable {
        const renameProvider = this.createRenameProvider(provider);
        return this._monaco.languages.registerRenameProvider(selector, renameProvider);
    }

    protected createRenameProvider(provider: RenameProvider): monaco.languages.RenameProvider {
        return {
            provideRenameEdits: async (model, position, newName, token) => {
                const params = this.m2p.asRenameParams(model, position, newName);
                const result = await provider.provideRenameEdits(params, token);
                return result && this.p2m.asWorkspaceEdit(result);
            }
        }
    }

    registerDocumentLinkProvider(selector: DocumentSelector, provider: DocumentLinkProvider): Disposable {
        const linkProvider = this.createDocumentLinkProvider(provider);
        return this._monaco.languages.registerLinkProvider(selector, linkProvider);
    }

    protected createDocumentLinkProvider(provider: DocumentLinkProvider): monaco.languages.LinkProvider {
        return {
            provideLinks: async (model, token) => {
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
        const implementationProvider = this.createImplementationProvider(provider);
        return this._monaco.languages.registerImplementationProvider(selector, implementationProvider);
    }

    protected createImplementationProvider(provider: ImplementationProvider): monaco.languages.ImplementationProvider {
        return {
            provideImplementation: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideImplementation(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerTypeDefinitionProvider(selector: DocumentSelector, provider: TypeDefinitionProvider): Disposable {
        const typeDefinitionProvider = this.createTypeDefinitionProvider(provider);
        return this._monaco.languages.registerTypeDefinitionProvider(selector, typeDefinitionProvider);
    }

    protected createTypeDefinitionProvider(provider: TypeDefinitionProvider): monaco.languages.TypeDefinitionProvider {
        return {
            provideTypeDefinition: async (model, position, token) => {
                const params = this.m2p.asTextDocumentPositionParams(model, position);
                const result = await provider.provideTypeDefinition(params, token);
                return result && this.p2m.asDefinitionResult(result);
            }
        }
    }

    registerColorProvider(selector: DocumentSelector, provider: DocumentColorProvider): Disposable {
        const documentColorProvider = this.createDocumentColorProvider(provider);
        return this._monaco.languages.registerColorProvider(selector, documentColorProvider);
    }

    protected createDocumentColorProvider(provider: DocumentColorProvider): monaco.languages.DocumentColorProvider {
        return {
            provideDocumentColors: async (model, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentColors({ textDocument }, token);
                return result && this.p2m.asColorInformations(result);
            },
            provideColorPresentations: async (model, info, token) => {
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
        const foldingRangeProvider = this.createFoldingRangeProvider(provider);
        return this._monaco.languages.registerFoldingRangeProvider(selector, foldingRangeProvider);
    }

    protected createFoldingRangeProvider(provider: FoldingRangeProvider): monaco.languages.FoldingRangeProvider {
        return {
            provideFoldingRanges: async (model, context, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideFoldingRanges({
                    textDocument
                }, token);
                return result && this.p2m.asFoldingRanges(result);
            }
        }
    }

    registerDocumentSemanticTokensProvider(selector: DocumentSelector, provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): Disposable {
        const semanticTokensProvider = this.createSemanticTokensProvider(provider, legend);
        return this._monaco.languages.registerDocumentSemanticTokensProvider(selector, semanticTokensProvider);
    }

    protected createSemanticTokensProvider(provider: DocumentSemanticTokensProvider, legend: SemanticTokensLegend): monaco.languages.DocumentSemanticTokensProvider {
        return {
            getLegend() {
                return legend;
            },
            onDidChange: provider.onDidChange,
            provideDocumentSemanticTokens: async (model, lastResultId, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentSemanticTokens({
                    textDocument
                }, token);
                return result && this.p2m.asSemanticTokens(result);
            },
            releaseDocumentSemanticTokens: (resultId) => {
            }
        }
    }

    registerDocumentRangeSemanticTokensProvider(selector: DocumentSelector, provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend): Disposable {
        const rangeSemanticTokensProvider = this.createRangeSemanticTokensProvider(provider, legend);
        return this._monaco.languages.registerDocumentRangeSemanticTokensProvider(selector, rangeSemanticTokensProvider);
    }

    protected createRangeSemanticTokensProvider(provider: DocumentRangeSemanticTokensProvider, legend: SemanticTokensLegend): monaco.languages.DocumentRangeSemanticTokensProvider {
        return {
            getLegend() {
                return legend;
            },
            provideDocumentRangeSemanticTokens: async (model, range, token) => {
                const textDocument = this.m2p.asTextDocumentIdentifier(model);
                const result = await provider.provideDocumentRangeSemanticTokens({
                    textDocument,
                    range: this.m2p.asRange(range)
                }, token);
                return result && this.p2m.asSemanticTokens(result);
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

}
