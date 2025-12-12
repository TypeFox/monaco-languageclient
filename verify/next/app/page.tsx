/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import dynamic from 'next/dynamic';
import '../bundle/langium-dsl/extendedConfig.css';
import './views.editorOnly.css';

export default function Page() {

    const DynamicMonacoEditorReact = dynamic(async () => {
        // const { setupLangiumClientExtended, openDocument, showDocument } = await import('./langium-dsl/config/extendedConfig');
        const { setupLangiumClientExtended, openDocument, showDocument } = await import('../bundle/langium-dsl/extendedConfig.js');

        const worker = new Worker(new URL('./langium-dsl/worker/langium-server.ts', import.meta.url), {
            type: 'module',
            name: 'Langium LS',
        });
        const appConfig = await setupLangiumClientExtended(worker);

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
                showDocument('/workspace/langium-grammar.langium');
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
