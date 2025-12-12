/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Logger } from 'monaco-languageclient/common';
import type { WorkerLoader } from 'monaco-languageclient/workerFactory';
import ReactDOM from 'react-dom/client';

export const createDynamicEditorComponent = async () => {
    // await import('@codingame/monaco-vscode-typescript-basics-default-extension');
    // await import('@codingame/monaco-vscode-typescript-language-features-default-extension');
    // await import('../bundle/tsserver/index.js');

    // const { workerFactory, setupLangiumClientExtended, openDocument, showDocument } =  await import('./langium-dsl/config/extendedConfig.js');
    const { workerFactory, setupLangiumClientExtended, openDocument, showDocument } =  await import('../bundle/langium-dsl/config/extendedConfig.js');

    const defineWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
        const defaultEditorWorkerService = () => new workerFactory.Worker(
            // new URL('../bundle/editorWorker/editor.worker.js', import.meta.url),
            new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
            { type: 'module' }
        );
        const defaultExtensionHostWorkerMain = () => new workerFactory.Worker(
            new URL('../bundle/extHostWorker/extensionHost.worker.js', import.meta.url),
            // new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
            { type: 'module' }
        );
        const defaultTextMateWorker = () => new workerFactory.Worker(
            new URL('../bundle/textmateWorker/worker.js', import.meta.url),
            // new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
            { type: 'module' }
        );

        return {
            editorWorkerService: defaultEditorWorkerService,
            extensionHostWorkerMain: defaultExtensionHostWorkerMain,
            TextMateWorker: defaultTextMateWorker,
        };
    };

    const configureDefaultWorkerFactory = (logger?: Logger) => {
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
    const appConfig = await setupLangiumClientExtended(languageServerWorker, configureDefaultWorkerFactory);

    return () => <appConfig.MonacoEditorReactComp
        style={{ 'height': '100%' }}
        vscodeApiConfig={appConfig.vscodeApiConfig}
        editorAppConfig={appConfig.editorAppConfig}
        languageClientConfig={appConfig.languageClientConfig}
        onVscodeApiInitDone={async () => {
            console.log('MonacoEditorReactComp editor started.');

            openDocument('/workspace/langium-types.langium');
            openDocument('/workspace/langium-grammar.langium');
            // openDocument('/workspace/hello.ts');
            showDocument('/workspace/langium-grammar.langium');
            // showDocument('/workspace/hello.ts');
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
