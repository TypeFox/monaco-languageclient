/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DynamicMonacoEditorReact = dynamic(async () => {
    const { buildJsonClientUserConfig } = await import('monaco-languageclient-examples/json-client');
    const comp = await import('@typefox/monaco-editor-react');
    const wrapperConfig = buildJsonClientUserConfig();
    return () => <comp.MonacoEditorReactComp
        style={{ 'height': '100%' }}
        wrapperConfig={wrapperConfig} />
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
