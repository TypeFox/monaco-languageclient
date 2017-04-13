import globToRegExp from "glob-to-regexp";
import { Languages, DiagnosticCollection, CompletionItemProvider, DocumentIdentifier, HoverProvider } from "vscode-languageclient/lib/services";
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
                const params = this.m2p.asTextDocumentPositionParams(model, position)
                return provider.provideHover(params, token).then(hover => this.p2m.asHover(hover))
            }
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
