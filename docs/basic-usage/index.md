# Basic Usage

This section covers the fundamental concepts and basic usage patterns for Monaco Language Client. These guides are designed to get you up and running quickly with common use cases.

## Section Contents

- **[Getting Started](getting-started.md)** - Your first Monaco Language Client integration with a minimal working example
- **[Configuration](configuration.md)** - Understanding basic configuration options and how to customize your setup  
- **[Examples](examples.md)** - Simple, practical examples demonstrating common integration patterns

## Quick Overview

Monaco Language Client provides two main integration approaches:

### Extended Mode (Recommended)
Uses VS Code services for richer functionality:
```typescript
import { EditorApp } from 'monaco-languageclient/editorApp';

const config = {
  $type: 'extended',
  htmlContainer: document.getElementById('editor')!,
  // ... configuration
};
```

### Classic Mode
Lighter-weight integration with standalone Monaco Editor:
```typescript
import { MonacoLanguageClient } from 'monaco-languageclient';
import * as monaco from 'monaco-editor';

// Direct Monaco editor + language client setup
```

## Choose Your Path

- **New to Monaco Language Client?** Start with [Getting Started](getting-started.md)
- **Need specific configuration help?** Check [Configuration](configuration.md)  
- **Want to see it in action?** Browse [Examples](examples.md)

For more advanced use cases, continue to [Advanced Usage](../advanced-usage/index.md) after completing this section.
