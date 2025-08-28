# React Integration

Monaco Language Client provides excellent React integration through the `@typefox/monaco-editor-react` package, making it easy to embed rich language editors in React applications.

## When to Use React Integration

Use the React wrapper when you need:
- **React component lifecycle** management for Monaco editors
- **Declarative configuration** through React props
- **State management** integration with React hooks
- **TypeScript support** with full type safety
- **Server-side rendering** compatibility (with proper configuration)

## Installation

```bash
npm install @typefox/monaco-editor-react
npm install monaco-languageclient @codingame/monaco-vscode-api
```

## Basic React Integration

Here's a complete example of a React component with Monaco Language Client:

```tsx
// JsonEditorComponent.tsx
import React, { useCallback } from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { WrapperConfig } from 'monaco-languageclient/editorApp';
import '@codingame/monaco-vscode-json-default-extension';

interface JsonEditorProps {
    initialValue?: string;
    onValueChange?: (value: string) => void;
}

export const JsonEditorComponent: React.FC<JsonEditorProps> = ({
    initialValue = '{\n  "name": "example"\n}',
    onValueChange
}) => {
    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        editorAppConfig: {
            codeResources: {
                main: {
                    text: initialValue,
                    uri: '/workspace/example.json',
                    fileExt: 'json'
                }
            }
        },
        languageClientConfig: {
            connection: {
                options: {
                    $type: 'WebSocketUrl',
                    url: 'ws://localhost:30000/sampleServer'
                }
            },
            clientOptions: {
                documentSelector: ['json']
            }
        }
    };

    const handleEditorLoad = useCallback((wrapper: any) => {
        console.log('Monaco editor loaded with language client');
        
        // Access the Monaco editor instance
        const editor = wrapper.getEditor();
        
        // Listen to content changes
        if (editor && onValueChange) {
            editor.onDidChangeModelContent(() => {
                const value = editor.getValue();
                onValueChange(value);
            });
        }
    }, [onValueChange]);

    return (
        <div style={{ height: '400px', border: '1px solid #ccc' }}>
            <MonacoEditorReactComp
                wrapperConfig={wrapperConfig}
                style={{ height: '100%' }}
                onLoad={handleEditorLoad}
            />
        </div>
    );
};
```

## Advanced React Patterns

### Custom Hook for Monaco Language Client

```tsx
// useMonacoLanguageClient.ts
import { useState, useEffect, useCallback } from 'react';
import { MonacoEditorLanguageClientWrapper } from '@typefox/monaco-editor-react';
import { WrapperConfig } from 'monaco-languageclient/editorApp';

interface UseMonacoLanguageClientOptions {
    config: WrapperConfig;
    onLoad?: (wrapper: MonacoEditorLanguageClientWrapper) => void;
}

export const useMonacoLanguageClient = ({ 
    config, 
    onLoad 
}: UseMonacoLanguageClientOptions) => {
    const [wrapper, setWrapper] = useState<MonacoEditorLanguageClientWrapper | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const handleLoad = useCallback((loadedWrapper: MonacoEditorLanguageClientWrapper) => {
        setWrapper(loadedWrapper);
        setIsReady(true);
        setError(null);
        onLoad?.(loadedWrapper);
    }, [onLoad]);

    const handleError = useCallback((err: Error) => {
        setError(err);
        setIsReady(false);
        console.error('Monaco Language Client error:', err);
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (wrapper) {
                wrapper.dispose?.();
            }
        };
    }, [wrapper]);

    return {
        wrapper,
        isReady,
        error,
        handleLoad,
        handleError
    };
};
```

### Multi-Language Editor Component

```tsx
// MultiLanguageEditor.tsx
import React, { useState, useCallback } from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { WrapperConfig } from 'monaco-languageclient/editorApp';

// Import language extensions
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import '@codingame/monaco-vscode-python-default-extension';

type Language = 'json' | 'typescript' | 'python';

interface MultiLanguageEditorProps {
    language: Language;
    initialValue: string;
    onChange?: (value: string, language: Language) => void;
}

const getLanguageConfig = (language: Language): Partial<WrapperConfig> => {
    const configs = {
        json: {
            languageClientConfig: {
                connection: { options: { $type: 'WebSocketUrl' as const, url: 'ws://localhost:3001/json' }},
                clientOptions: { documentSelector: ['json'] }
            }
        },
        typescript: {
            languageClientConfig: {
                connection: { options: { $type: 'WebSocketUrl' as const, url: 'ws://localhost:3002/typescript' }},
                clientOptions: { documentSelector: ['typescript'] }
            }
        },
        python: {
            languageClientConfig: {
                connection: { options: { $type: 'WebSocketUrl' as const, url: 'ws://localhost:3003/python' }},
                clientOptions: { documentSelector: ['python'] }
            }
        }
    };
    
    return configs[language];
};

export const MultiLanguageEditor: React.FC<MultiLanguageEditorProps> = ({
    language,
    initialValue,
    onChange
}) => {
    const [currentValue, setCurrentValue] = useState(initialValue);
    
    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        editorAppConfig: {
            codeResources: {
                main: {
                    text: currentValue,
                    uri: `/workspace/example.${language}`,
                    fileExt: language
                }
            }
        },
        ...getLanguageConfig(language)
    };

    const handleEditorLoad = useCallback((wrapper: any) => {
        const editor = wrapper.getEditor();
        
        if (editor) {
            editor.onDidChangeModelContent(() => {
                const newValue = editor.getValue();
                setCurrentValue(newValue);
                onChange?.(newValue, language);
            });
        }
    }, [language, onChange]);

    return (
        <MonacoEditorReactComp
            key={language} // Force re-render when language changes
            wrapperConfig={wrapperConfig}
            style={{ height: '400px' }}
            onLoad={handleEditorLoad}
        />
    );
};
```

### Editor with State Management

```tsx
// EditorWithRedux.tsx
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { updateEditorContent, setEditorReady } from './editorSlice';

interface EditorWithReduxProps {
    editorId: string;
}

export const EditorWithRedux: React.FC<EditorWithReduxProps> = ({ editorId }) => {
    const dispatch = useDispatch();
    const { content, isReady } = useSelector((state: any) => state.editor[editorId] || {});
    
    const wrapperConfig = {
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        editorAppConfig: {
            codeResources: {
                main: {
                    text: content || '',
                    uri: `/workspace/${editorId}.json`,
                    fileExt: 'json'
                }
            }
        },
        languageClientConfig: {
            connection: {
                options: {
                    $type: 'WebSocketUrl' as const,
                    url: 'ws://localhost:30000/sampleServer'
                }
            },
            clientOptions: {
                documentSelector: ['json']
            }
        }
    };

    const handleEditorLoad = useCallback((wrapper: any) => {
        dispatch(setEditorReady({ editorId, isReady: true }));
        
        const editor = wrapper.getEditor();
        if (editor) {
            editor.onDidChangeModelContent(() => {
                const newContent = editor.getValue();
                dispatch(updateEditorContent({ editorId, content: newContent }));
            });
        }
    }, [dispatch, editorId]);

    return (
        <div>
            {!isReady && <div>Loading editor...</div>}
            <MonacoEditorReactComp
                wrapperConfig={wrapperConfig}
                style={{ height: '400px' }}
                onLoad={handleEditorLoad}
            />
        </div>
    );
};
```

## Context and Providers

### Monaco Language Client Context

```tsx
// MonacoLanguageClientContext.tsx
import React, { createContext, useContext, useCallback, ReactNode } from 'react';

interface LanguageServer {
    name: string;
    url: string;
    documentSelector: string[];
}

interface MonacoLanguageClientContextType {
    servers: LanguageServer[];
    addServer: (server: LanguageServer) => void;
    removeServer: (name: string) => void;
    getServerForLanguage: (language: string) => LanguageServer | undefined;
}

const MonacoLanguageClientContext = createContext<MonacoLanguageClientContextType | undefined>(
    undefined
);

export const useMonacoLanguageClient = () => {
    const context = useContext(MonacoLanguageClientContext);
    if (!context) {
        throw new Error('useMonacoLanguageClient must be used within MonacoLanguageClientProvider');
    }
    return context;
};

interface MonacoLanguageClientProviderProps {
    children: ReactNode;
    defaultServers?: LanguageServer[];
}

export const MonacoLanguageClientProvider: React.FC<MonacoLanguageClientProviderProps> = ({
    children,
    defaultServers = []
}) => {
    const [servers, setServers] = React.useState<LanguageServer[]>(defaultServers);

    const addServer = useCallback((server: LanguageServer) => {
        setServers(prev => [...prev.filter(s => s.name !== server.name), server]);
    }, []);

    const removeServer = useCallback((name: string) => {
        setServers(prev => prev.filter(s => s.name !== name));
    }, []);

    const getServerForLanguage = useCallback((language: string) => {
        return servers.find(server => server.documentSelector.includes(language));
    }, [servers]);

    const value = {
        servers,
        addServer,
        removeServer,
        getServerForLanguage
    };

    return (
        <MonacoLanguageClientContext.Provider value={value}>
            {children}
        </MonacoLanguageClientContext.Provider>
    );
};
```

## Server-Side Rendering (SSR)

### Next.js Integration

```tsx
// pages/editor.tsx
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import Monaco component to avoid SSR issues
const MonacoEditor = dynamic(
    () => import('../components/MonacoEditor').then(mod => mod.MonacoEditor),
    {
        ssr: false,
        loading: () => <div>Loading editor...</div>
    }
);

const EditorPage: React.FC = () => {
    return (
        <div>
            <h1>Monaco Language Client in Next.js</h1>
            <MonacoEditor />
        </div>
    );
};

export default EditorPage;
```

### SSR-Safe Component

```tsx
// MonacoEditor.tsx
import React, { useState, useEffect } from 'react';

export const MonacoEditor: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div>Loading Monaco Editor...</div>;
    }

    // Dynamically import Monaco components only on client
    const MonacoEditorReactComp = React.lazy(
        () => import('@typefox/monaco-editor-react').then(mod => ({ 
            default: mod.MonacoEditorReactComp 
        }))
    );

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <MonacoEditorReactComp
                wrapperConfig={{
                    $type: 'extended',
                    htmlContainer: document.getElementById('monaco-editor-root')!,
                    // ... other config
                }}
                style={{ height: '400px' }}
            />
        </React.Suspense>
    );
};
```

## Performance Optimization

### Memoized Editor Component

```tsx
// OptimizedMonacoEditor.tsx
import React, { memo, useMemo } from 'react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';

interface OptimizedMonacoEditorProps {
    language: string;
    value: string;
    serverUrl: string;
    onChange?: (value: string) => void;
}

export const OptimizedMonacoEditor = memo<OptimizedMonacoEditorProps>(({
    language,
    value,
    serverUrl,
    onChange
}) => {
    const wrapperConfig = useMemo(() => ({
        $type: 'extended' as const,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        editorAppConfig: {
            codeResources: {
                main: {
                    text: value,
                    uri: `/workspace/file.${language}`,
                    fileExt: language
                }
            }
        },
        languageClientConfig: {
            connection: {
                options: {
                    $type: 'WebSocketUrl' as const,
                    url: serverUrl
                }
            },
            clientOptions: {
                documentSelector: [language]
            }
        }
    }), [language, value, serverUrl]);

    const handleLoad = useMemo(() => (wrapper: any) => {
        if (onChange) {
            const editor = wrapper.getEditor();
            editor?.onDidChangeModelContent(() => {
                onChange(editor.getValue());
            });
        }
    }, [onChange]);

    return (
        <MonacoEditorReactComp
            wrapperConfig={wrapperConfig}
            style={{ height: '100%' }}
            onLoad={handleLoad}
        />
    );
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
        prevProps.language === nextProps.language &&
        prevProps.serverUrl === nextProps.serverUrl &&
        prevProps.value === nextProps.value
    );
});
```

## Testing

### Jest Testing Setup

```tsx
// __tests__/MonacoEditor.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';

// Mock Monaco editor for testing
jest.mock('@typefox/monaco-editor-react', () => ({
    MonacoEditorReactComp: jest.fn(({ onLoad }) => {
        React.useEffect(() => {
            if (onLoad) {
                onLoad({
                    getEditor: () => ({
                        getValue: () => 'test content',
                        onDidChangeModelContent: jest.fn()
                    }),
                    dispose: jest.fn()
                });
            }
        }, [onLoad]);
        
        return <div data-testid="monaco-editor">Monaco Editor</div>;
    })
}));

describe('MonacoEditor', () => {
    it('renders without crashing', () => {
        render(
            <MonacoEditorReactComp
                wrapperConfig={{
                    $type: 'extended',
                    htmlContainer: document.createElement('div')
                }}
                style={{ height: '400px' }}
            />
        );
        
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
});
```

## Error Handling

### Error Boundary for Monaco Editor

```tsx
// MonacoErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface MonacoErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error) => void;
}

interface MonacoErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class MonacoErrorBoundary extends Component<
    MonacoErrorBoundaryProps,
    MonacoErrorBoundaryState
> {
    constructor(props: MonacoErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): MonacoErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Monaco Editor Error:', error, errorInfo);
        this.props.onError?.(error);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
                    <h3>Monaco Editor Error</h3>
                    <p>Failed to load the Monaco editor. Please try refreshing the page.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>{this.state.error?.stack}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
```

## Complete Application Example

```tsx
// App.tsx
import React, { useState } from 'react';
import { MonacoLanguageClientProvider } from './MonacoLanguageClientContext';
import { JsonEditorComponent } from './JsonEditorComponent';
import { MonacoErrorBoundary } from './MonacoErrorBoundary';

const App: React.FC = () => {
    const [editorValue, setEditorValue] = useState('{\n  "name": "my-app"\n}');
    
    const defaultServers = [
        {
            name: 'JSON',
            url: 'ws://localhost:30000/sampleServer',
            documentSelector: ['json']
        }
    ];

    return (
        <MonacoLanguageClientProvider defaultServers={defaultServers}>
            <div className="App">
                <h1>Monaco Language Client React Example</h1>
                
                <MonacoErrorBoundary>
                    <JsonEditorComponent
                        initialValue={editorValue}
                        onValueChange={setEditorValue}
                    />
                </MonacoErrorBoundary>
                
                <div style={{ marginTop: '20px' }}>
                    <h3>Current Value:</h3>
                    <pre>{editorValue}</pre>
                </div>
            </div>
        </MonacoLanguageClientProvider>
    );
};

export default App;
```

## Next Steps

- **Learn [Extended Mode](extended-mode.md)** for VS Code-like functionality  
- **Try [WebSocket Communication](websockets.md)** for external language servers
- **Check [Examples](../examples/index.md)** for complete React implementations
- **See [Performance Guide](../guides/performance.md)** for optimization techniques