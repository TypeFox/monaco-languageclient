import globToRegExp from "glob-to-regexp";
import { Languages, DiagnosticCollection, CompletionItemProvider } from "vscode-languageclient/lib/services";
import { CompletionClientCapabilities, DocumentFilter, DocumentSelector } from 'vscode-languageclient/lib/protocol';
import { MonacoDiagnosticCollection } from './diagnostic-collection';
import { ProtocolToMonacoConverter, MonacoToProtocolConverter } from './converter';
import { DisposableCollection, Disposable } from "./disposable";
import Uri = monaco.Uri;

export class MonacoLanguages implements Languages {

    readonly completion: CompletionClientCapabilities = {
        completionItem: {
            snippetSupport: true
        }
    }

    constructor(
        protected readonly p2m: ProtocolToMonacoConverter,
        protected readonly m2p: MonacoToProtocolConverter
    ) {}

    match(selector: DocumentSelector, document: {
        uri: string;
        languageId: string;
    }): boolean {
        return this.matchModel(selector, {
            uri: Uri.parse(document.uri),
            languageId: document.languageId
        });
    }

    createDiagnosticCollection?(name?: string): DiagnosticCollection {
        return new MonacoDiagnosticCollection(name || 'default', this.p2m);
    }

    registerCompletionItemProvider(selector: DocumentSelector, provider: CompletionItemProvider, ...triggerCharacters: string[]): Disposable {
        const providers = new DisposableCollection();
        for (const language of monaco.languages.getLanguages()) {
            providers.push(monaco.languages.registerCompletionItemProvider(language.id, {
                triggerCharacters,
                provideCompletionItems: (model, position, token) => {
                    if (!this.matchModel(selector, { uri: model.uri, languageId: model.getModeId() })) {
                        return [];
                    }
                    const params = this.m2p.asTextDocumentPositionParams(model, position)
                    return provider.provideCompletionItems(params, token).then(result => this.p2m.asCompletionResult(result));
                }
            }));
        }
        return providers;
    }

    protected matchModel(selector: string | DocumentFilter | DocumentSelector, model: {
        uri: Uri;
        languageId: string;
    }): boolean {
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
