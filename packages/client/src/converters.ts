import * as p2c from 'vscode-languageclient/lib/common/protocolConverter';
import * as c2p from 'vscode-languageclient/lib/common/codeConverter';
import type { WillSaveTextDocumentParams } from 'vscode-languageserver-protocol';
import * as code from 'vscode';
import * as proto from 'vscode-languageserver-protocol';

type NotAPromise<T> = T extends object & { then(onfulfilled: infer F): any } ? F extends ((value: infer V, ...args: any) => any) ? NotAPromise<V> : never : T;

function bypassConversion<R>(param: any): NotAPromise<R> {
    return param
}

function toPromise<R>(param: any): Promise<R> {
    return Promise.resolve(param)
}

export class MonacoP2CConverter implements p2c.Converter {
    constructor(private delegate: p2c.Converter) { }

    asUri = this.delegate.asUri.bind(this.delegate)
    asDocumentSelector = bypassConversion
    asPosition = bypassConversion
    asRange = bypassConversion
    asRanges = toPromise
    asDiagnostic = bypassConversion
    asDiagnostics = toPromise
    asDiagnosticSeverity = bypassConversion
    asDiagnosticTag = bypassConversion
    asHover = bypassConversion
    asCompletionResult = bypassConversion
    asCompletionItem = bypassConversion
    asTextEdit = bypassConversion
    asTextEdits = bypassConversion
    asSignatureHelp = bypassConversion
    asSignatureInformation = toPromise
    asSignatureInformations = toPromise
    asParameterInformation = bypassConversion
    asParameterInformations = toPromise
    asLocation = bypassConversion
    asDeclarationResult = bypassConversion
    asDefinitionResult = bypassConversion
    asReferences = bypassConversion
    asDocumentHighlightKind = bypassConversion
    asDocumentHighlight = bypassConversion
    asDocumentHighlights = bypassConversion
    asSymbolKind = bypassConversion
    asSymbolTag = bypassConversion
    asSymbolTags = bypassConversion
    asSymbolInformation = bypassConversion
    asSymbolInformations = bypassConversion
    asDocumentSymbol = bypassConversion
    asDocumentSymbols = bypassConversion
    asCommand = bypassConversion
    asCommands = bypassConversion
    asCodeAction = bypassConversion
    asCodeActionKind = bypassConversion
    asCodeActionKinds = bypassConversion
    asCodeActionResult = toPromise
    asCodeLens = bypassConversion
    asCodeLenses = bypassConversion
    asWorkspaceEdit = bypassConversion
    asDocumentLink = bypassConversion
    asDocumentLinks = bypassConversion
    asColor = bypassConversion
    asColorInformation = bypassConversion
    asColorInformations = bypassConversion
    asColorPresentation = bypassConversion
    asColorPresentations = bypassConversion
    asFoldingRangeKind = bypassConversion
    asFoldingRange = bypassConversion
    asFoldingRanges = bypassConversion
    asSelectionRange = bypassConversion
    asSelectionRanges = bypassConversion
    asInlineValue = bypassConversion
    asInlineValues = bypassConversion
    asInlayHint = toPromise
    asInlayHints = bypassConversion
    asSemanticTokensLegend = bypassConversion
    asSemanticTokens = bypassConversion
    asSemanticTokensEdit = bypassConversion
    asSemanticTokensEdits = bypassConversion
    asCallHierarchyItem = bypassConversion
    asCallHierarchyItems = bypassConversion
    asCallHierarchyIncomingCall = toPromise
    asCallHierarchyIncomingCalls = bypassConversion
    asCallHierarchyOutgoingCall = toPromise
    asCallHierarchyOutgoingCalls = bypassConversion
    asLinkedEditingRanges = bypassConversion
    asTypeHierarchyItem = bypassConversion
    asTypeHierarchyItems = bypassConversion
    asGlobPattern = bypassConversion
}

export class MonacoC2PConverter implements c2p.Converter {
    constructor(private delegate: c2p.Converter) { }

    asUri = this.delegate.asUri.bind(this.delegate)
    asTextDocumentItem = bypassConversion
    asTextDocumentIdentifier = bypassConversion
    asVersionedTextDocumentIdentifier = bypassConversion
    asOpenTextDocumentParams = this.delegate.asOpenTextDocumentParams.bind(this.delegate)
    asChangeTextDocumentParams = this.delegate.asChangeTextDocumentParams.bind(this.delegate)
    asCloseTextDocumentParams = this.delegate.asCloseTextDocumentParams.bind(this.delegate)
    asSaveTextDocumentParams = this.delegate.asSaveTextDocumentParams.bind(this.delegate)
    asWillSaveTextDocumentParams = (event: code.TextDocumentWillSaveEvent): WillSaveTextDocumentParams => {
        return {
            textDocument: this.delegate.asTextDocumentIdentifier(event.document),
            reason: event.reason
        }
    }
    asDidCreateFilesParams = this.delegate.asDidCreateFilesParams.bind(this.delegate)
    asDidRenameFilesParams = this.delegate.asDidRenameFilesParams.bind(this.delegate)
    asDidDeleteFilesParams = this.delegate.asDidDeleteFilesParams.bind(this.delegate)
    asWillCreateFilesParams = this.delegate.asWillCreateFilesParams.bind(this.delegate)
    asWillRenameFilesParams = this.delegate.asWillRenameFilesParams.bind(this.delegate)
    asWillDeleteFilesParams = this.delegate.asWillDeleteFilesParams.bind(this.delegate)
    asTextDocumentPositionParams = this.delegate.asTextDocumentPositionParams.bind(this.delegate)
    asCompletionParams = (textDocument: code.TextDocument, position: code.Position, context: code.CompletionContext): proto.CompletionParams => {
        return {
            textDocument: this.delegate.asTextDocumentIdentifier(textDocument),
            position,
            context
        } as proto.CompletionParams
    }
    asSignatureHelpParams = this.delegate.asSignatureHelpParams.bind(this.delegate)
    asWorkerPosition = bypassConversion
    asPosition = bypassConversion
    asPositions = toPromise
    asRange = bypassConversion
    asLocation = bypassConversion
    asDiagnosticSeverity = bypassConversion
    asDiagnosticTag = bypassConversion
    asDiagnostic = bypassConversion
    asDiagnostics = toPromise
    asCompletionItem = bypassConversion
    asSymbolKind = bypassConversion
    asSymbolTag = bypassConversion
    asSymbolTags = bypassConversion
    asTextEdit = bypassConversion
    asReferenceParams = this.delegate.asReferenceParams.bind(this.delegate)
    asCodeAction = toPromise
    asCodeActionContext = toPromise
    asInlineValueContext = bypassConversion
    asCommand = bypassConversion
    asCodeLens = bypassConversion
    asFormattingOptions = bypassConversion
    asDocumentSymbolParams = this.delegate.asDocumentSymbolParams.bind(this.delegate)
    asCodeLensParams = this.delegate.asCodeLensParams.bind(this.delegate)
    asDocumentLink = bypassConversion
    asDocumentLinkParams = this.delegate.asDocumentLinkParams.bind(this.delegate)
    asCallHierarchyItem = bypassConversion
    asTypeHierarchyItem = bypassConversion
    asWorkspaceSymbol = bypassConversion
    asInlayHint = bypassConversion
}
