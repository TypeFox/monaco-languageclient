/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import type { WorkerLoader } from 'monaco-languageclient/workerFactory';
import dynamic from 'next/dynamic';
import './views.editorOnly.css';

export default function Page() {
    const DynamicMonacoEditorReact = dynamic(
        async () => {
            await import('@codingame/monaco-vscode-typescript-basics-default-extension');
            // await import('@codingame/monaco-vscode-typescript-language-features-default-extension');
            // await import('../bundle/tsserver/index.js');

            const { setupLangiumClientExtended, openDocument, showDocument } = await import('./langium-dsl/config/extendedConfig');
            const mlcWFModule = await import('monaco-languageclient/workerFactory');

            const languageServerWorker = new Worker(new URL('./langium-dsl/worker/langium-server.ts', import.meta.url), {
                type: 'module',
                name: 'Langium LS'
            });

            const defineWorkerLoaders: () => Partial<Record<string, WorkerLoader>> = () => {
                const defaultEditorWorkerService = () =>
                    new mlcWFModule.Worker(new URL('../bundle/editorWorker/editor.worker.js', import.meta.url), { type: 'module' });
                // const defaultExtensionHostWorkerMain = () => new mlcWFModule.Worker(
                //     new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
                //     // new URL('../bundle/extHostWorker/extensionHost.worker.js', import.meta.url),
                //     { type: 'module' }
                // );
                const defaultTextMateWorker = () => new mlcWFModule.Worker(new URL('../bundle/textmateWorker/worker.js', import.meta.url), { type: 'module' });
                return {
                    editorWorkerService: defaultEditorWorkerService,
                    // extensionHostWorkerMain: defaultExtensionHostWorkerMain,
                    TextMateWorker: defaultTextMateWorker
                };
            };

            const configureWorkerFactory = (logger?: ILogger) => {
                mlcWFModule.useWorkerFactory({
                    workerLoaders: defineWorkerLoaders(),
                    logger
                });
            };
            const appConfig = await setupLangiumClientExtended(languageServerWorker, false, configureWorkerFactory);

            return () => (
                <appConfig.MonacoEditorReactComp
                    style={{ height: '100%' }}
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
                    }}
                />
            );
        },
        {
            ssr: false
        }
    );

    return (
        <div id="monaco-editor-root">
            <DynamicMonacoEditorReact />
        </div>
    );
}
