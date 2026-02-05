/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { WorkerLoader } from 'monaco-languageclient/workerFactory';
import ReactDOM from 'react-dom/client';

export const createDynamicEditorComponent = async () => {
    await import('@codingame/monaco-vscode-typescript-basics-default-extension');
    await import('@codingame/monaco-vscode-typescript-language-features-default-extension');

    const { workerFactory, setupLangiumClientExtended, openDocument, showDocument } =  await import('./langium-dsl/config/extendedConfig.js');

    const defineWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
        const defaultEditorWorkerService = () => new workerFactory.Worker(
            new URL('../bundle/editorWorker/editor.worker.js', import.meta.url),
            { type: 'module' }
        );
        const defaultExtensionHostWorkerMain = () => new workerFactory.Worker(
            new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
            { type: 'module' }
        );
        const defaultTextMateWorker = () => new workerFactory.Worker(
            new URL('../bundle/textmateWorker/worker.js', import.meta.url),
            { type: 'module' }
        );

        return {
            editorWorkerService: defaultEditorWorkerService,
            extensionHostWorkerMain: defaultExtensionHostWorkerMain,
            TextMateWorker: defaultTextMateWorker,
        };
    };

    const configureDefaultWorkerFactory = (logger?: ILogger) => {
        workerFactory.useWorkerFactory({
            workerLoaders: defineWorkerLoaders(),
            logger
        });
    };

    const workerUrl = new URL('./langium-dsl/worker/langium-server.ts', import.meta.url);
    console.log('Worker URL:', workerUrl);
    const languageServerWorker = new Worker(workerUrl, {
        type: 'module',
        name: 'Langium LS',
    });
    const appConfig = await setupLangiumClientExtended(languageServerWorker, true, configureDefaultWorkerFactory);

    return () => <appConfig.MonacoEditorReactComp
        style={{ 'height': '100%' }}
        vscodeApiConfig={appConfig.vscodeApiConfig}
        editorAppConfig={appConfig.editorAppConfig}
        languageClientConfig={appConfig.languageClientConfig}
        onVscodeApiInitDone={async () => {
            console.log('MonacoEditorReactComp editor started.');

            await openDocument('/workspace/langium-types.langium');
            await openDocument('/workspace/langium-grammar.langium');
            await openDocument('/workspace/hello.ts');
            await showDocument('/workspace/hello.ts');
            await showDocument('/workspace/langium-grammar.langium');
        }} />
};

export const runDirectly = async () => {
    const root = ReactDOM.createRoot(document.getElementById('monaco-editor-root')!);
    const comp = await createDynamicEditorComponent();
    const App = () => {

        return (
            <div>
                { comp() }
            </div>
        );
    };
    root.render(<App />);
};
