/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import ReactDOM from 'react-dom/client';

export const createDynamicEditorComponent = async () => {
    // const { setupLangiumClientExtended, openDocument, showDocument } =  await import('./langium-dsl/config/extendedConfig.js');
    const { setupLangiumClientExtended, openDocument, showDocument } =  await import('../bundle/langium-dsl/extendedConfig.js');

    const workerUrl = new URL('./langium-dsl/worker/langium-server.ts', import.meta.url);
    console.log('Worker URL:', workerUrl);
    const worker = new Worker(workerUrl, {
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
