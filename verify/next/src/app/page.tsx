/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import dynamic from 'next/dynamic';
import { buildJsonClientUserConfig } from 'monaco-languageclient-examples/json-client';

const DynamicMonacoEditorReact = dynamic(() => import('@typefox/monaco-editor-react').then(mod => mod.MonacoEditorReactComp), {
    ssr: false,
});

export default function Page() {
    // const wrapperConfig = buildWrapperConfig();
    const wrapperConfig = buildJsonClientUserConfig();
    return (
        <div style={{ 'height': '80vh', padding: '5px' }} >
            <DynamicMonacoEditorReact
                style={{ 'height': '100%' }}
                wrapperConfig={wrapperConfig} />
        </div>
    );
}
