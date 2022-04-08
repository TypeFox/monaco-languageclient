/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { createVSCodeApi } from "./vscode-api";
import { Services } from "./services";

const api = createVSCodeApi(Services.get);

const workspace = api.workspace;
const languages = api.languages;
const window = api.window;
const commands = api.commands;
const env = api.env;
const Uri = api.Uri;
const CompletionItem = api.CompletionItem;
const CodeLens = api.CodeLens;
const DocumentLink = api.DocumentLink;
const CodeActionKind = api.CodeActionKind;
const CodeAction = api.CodeAction;
const Diagnostic = api.Diagnostic;
const CallHierarchyItem = api.CallHierarchyItem;
const SemanticTokens = api.SemanticTokens;
const Disposable = api.Disposable;
const SignatureHelpTriggerKind = api.SignatureHelpTriggerKind;
const DiagnosticSeverity = api.DiagnosticSeverity;
const EventEmitter = api.EventEmitter;
const CancellationTokenSource = api.CancellationTokenSource;
const ProgressLocation = api.ProgressLocation;
const TextDocumentChangeReason = api.TextDocumentChangeReason;

export {
    workspace,
    languages,
    window,
    commands,
    env,
    Uri,
    CompletionItem,
    CodeLens,
    DocumentLink,
    CodeActionKind,
    CodeAction,
    Diagnostic,
    CallHierarchyItem,
    SemanticTokens,
    Disposable,
    SignatureHelpTriggerKind,
    DiagnosticSeverity,
    EventEmitter,
    CancellationTokenSource,
    ProgressLocation,
    TextDocumentChangeReason
};
