import globToRegExp from "glob-to-regexp";
import {
    Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider,
    SignatureHelpProvider, DefinitionProvider, ReferenceProvider, DocumentHighlightProvider, DocumentSymbolProvider, CodeActionProvider, CodeLensProvider
} from "vscode-languageclient/lib/services";
import { CompletionClientCapabilities, DocumentFilter, DocumentSelector } from 'vscode-languageclient/lib/protocol';
import { MonacoDiagnosticCollection } from './diagnostic-collection';
import { ProtocolToMonacoConverter, MonacoToProtocolConverter } from './converter';
import { DisposableCollection, Disposable } from "./disposable";
import Uri = monaco.Uri;

export interface MonacoModelIdentifier {
    uri: Uri;
    languageId: string;
}

export namespace MonacoModelIdentifier {
    export function fromDocument(document: DocumentIdentifier): MonacoModelIdentifier {
        return {
            uri: Uri.parse(document.uri),
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

export class MonacoLanguages implements Languages {

    readonly completion: CompletionClientCapabilities = {
        completionItem: {
            snippetSupport: true
        }
    }

    constructor(
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter
    ) { }

    match(selector: DocumentSelector, document: DocumentIdentifier): boolean {
        return this.matchModel(selector, MonacoModelIdentifier.fromDocument(document));
    }

    createDiagnosticCollection?(name?: string): DiagnosticCollection {
        return new MonacoDiagnosticCollection(name || 'default', this.p2m);
    }

    registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable {
        const completionProvider = this.createCompletionProvider(selector, provider, ...triggerCharacters);
        const providers = new DisposableCollection();
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerCompletionItemProvider(language.id, completionProvider));
        }
        return providers;
    }

    protected createCompletionProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): monaco.languages.CompletionItemProvider {
        return {
            triggerCharacters,
            provideCompletionItems: (model, position, token) => {
                if (!this.matchModel(selector, MonacoModelIdentifier.fromModel(model))) {
                    return [];
                }
                const params = this.m2p.asTextDocumentPositionParams(model, position)
                return provider.provideCompletionItems(params, token).then(result => this.p2m.asCompletionResult(result));
            },
            resolveCompletionItem: provider.resolveCompletionItem ? (item, token) => {
                const protocolItem = this.m2p.asCompletionItem(item);
                return provider.resolveCompletionItem!(protocolItem, token).then(item => this.p2m.asCompletionItem(item));
            } : undefined
        };
    }

    registerHoverProvider(selector: DocumentSelector, provider: HoverProvider): Disposable {
        const hoverProvider = this.createHoverProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerHoverProvider(language.id, hoverProvider));
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
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerSignatureHelpProvider(language.id, signatureHelpProvider));
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
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerDefinitionProvider(language.id, definitionProvider));
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
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerReferenceProvider(language.id, referenceProvider));
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
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerDocumentHighlightProvider(language.id, documentHighlightProvider));
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
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerDocumentSymbolProvider(language.id, documentSymbolProvider));
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
                return provider.provideDocumentSymbols(params, token).then(result => this.p2m.asSymbolInformations(result))
            }
        }
    }

    registerCodeActionsProvider(selector: DocumentSelector, provider: CodeActionProvider): Disposable {
        const codeActionProvider = this.createCodeActionProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerCodeActionProvider(language.id, codeActionProvider));
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
                return provider.provideCodeActions(params, token).then(result => this.p2m.asCodeActions(result))
            }
        }
    }

    registerCodeLensProvider(selector: DocumentSelector, provider: CodeLensProvider): Disposable {
        const codeLensProvider = this.createCodeLensProvider(selector, provider);
        const providers = new DisposableCollection();
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerCodeLensProvider(language.id, codeLensProvider));
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
                return provider.resolveCodeLens!(protocolCodeLens, token).then(result => this.p2m.asCodeLens(result))
            } : undefined
        }
    }

    protected matchModel(selector: string | DocumentFilter | DocumentSelector, model: MonacoModelIdentifier): boolean {
        if (Array.isArray(selector)) {
            return selector.findIndex(filter => this.matchModel(filter, model)) !== -1;
        }
        if (DocumentFilter.is(selector)) {
            if (!!selector.language && selector.language !== model.languageId) {
                return false;
            }
            if (!!selector.scheme && selector.scheme !== model.uri.scheme) {
                return false;
            }
            if (!!selector.pattern) {
                const regExp = globToRegExp(selector.pattern, {
                    extended: true,
                    globstar: true
                });
                if (!regExp.test(model.uri.path)) {
                    return false;
                }
            }
            return true;
        }
        return selector === model.languageId;
    }

}
