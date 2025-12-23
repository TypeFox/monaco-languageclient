/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import dynamic from 'next/dynamic';
import type { Logger } from 'monaco-languageclient/common';
import type { WorkerLoader } from 'monaco-languageclient/workerFactory';
import './views.editorOnly.css';

export default function Page() {

    const DynamicMonacoEditorReact = dynamic(async () => {
        await import('@codingame/monaco-vscode-typescript-basics-default-extension');
        // await import('@codingame/monaco-vscode-typescript-language-features-default-extension');
        // await import('../bundle/tsserver/index.js');

        const { setupLangiumClientExtended, openDocument, showDocument } = await import('./langium-dsl/config/extendedConfig');
        const mlcWFModule = await import('monaco-languageclient/workerFactory');

        const languageServerWorker = new Worker(new URL('./langium-dsl/worker/langium-server.ts', import.meta.url), {
            type: 'module',
            name: 'Langium LS',
        });

        const defineWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
            const defaultEditorWorkerService = () => new mlcWFModule.Worker(
                new URL('../bundle/editorWorker/editor.worker.js', import.meta.url),
                // new URL('@codingame/monaco-vscode-api/workers/editor.worker', import.meta.url),
                { type: 'module' }
            );
            // const defaultExtensionHostWorkerMain = () => new mlcWFModule.Worker(
            //     new URL('../bundle/extHostWorker/extensionHost.worker.js', import.meta.url),
            //     // new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
            //     { type: 'module' }
            // );
            const defaultTextMateWorker = () => new mlcWFModule.Worker(
                new URL('../bundle/textmateWorker/worker.js', import.meta.url),
                // new URL('../node_modules/@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
                // new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
                { type: 'module' }
            );
            return {
                editorWorkerService: defaultEditorWorkerService,
                // extensionHostWorkerMain: defaultExtensionHostWorkerMain,
                TextMateWorker: defaultTextMateWorker,
            };
        };

        const configureWorkerFactory = (logger?: Logger) => {
            mlcWFModule.useWorkerFactory({
                workerLoaders: defineWorkerLoaders(),
                logger
            });
        };
        const appConfig = await setupLangiumClientExtended(languageServerWorker, configureWorkerFactory);

        return () => <appConfig.MonacoEditorReactComp
            style={{ 'height': '100%' }}
            vscodeApiConfig={appConfig.vscodeApiConfig}
            editorAppConfig={appConfig.editorAppConfig}
            languageClientConfig={appConfig.languageClientConfig}
            onVscodeApiInitDone={async () => {
                console.log('MonacoEditorReactComp editor started.');

                openDocument('/workspace/langium-types.langium');
                openDocument('/workspace/langium-grammar.langium');
                openDocument('/workspace/hello.ts');
                // showDocument('/workspace/langium-grammar.langium');
                showDocument('/workspace/hello.ts');
            }} />
    }, {
        ssr: false
    });

    return (
        <div id='monaco-editor-root' >
            <DynamicMonacoEditorReact />
        </div>
    );
}
