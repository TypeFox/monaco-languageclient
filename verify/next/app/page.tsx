/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import './views.editorOnly.css';

const DynamicMonacoEditorReact = dynamic(async () => {
    const comp = await import('@typefox/monaco-editor-react');
    const { window, workspace, Uri } = (await import('vscode'));
    const { setupLangiumClientExtended } = await import('./langium-dsl/config/extendedConfig');
    const appConfig = await setupLangiumClientExtended();

    return () => <comp.MonacoEditorReactComp
        style={{ 'height': '100%' }}
        vscodeApiConfig={appConfig.vscodeApiConfig}
        editorAppConfig={appConfig.editorAppConfig}
        languageClientConfig={appConfig.languageClientConfig}
        onVscodeApiInitDone={async () => {
            console.log('MonacoEditorReactComp editor started.');

            await workspace.openTextDocument('/workspace/langium-types.langium');
            await workspace.openTextDocument('/workspace/langium-grammar.langium');
            await window.showTextDocument(Uri.file('/workspace/langium-grammar.langium'));
        }} />
}, {
    ssr: false
});

export default function Page() {
    return (
        <div style={{ 'height': '80vh', padding: '5px' }} >
            <DynamicMonacoEditorReact />
        </div>
    );
}
