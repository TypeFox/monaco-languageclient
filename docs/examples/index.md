# Examples

This section provides comprehensive, working examples of Monaco Language Client integrations. Each example includes complete source code, setup instructions, and explanations of key concepts.

## Example Categories

### Language Server Integrations
Examples showing how to integrate with specific language servers:

- **[JSON Language Server](json-language-server.md)** - Complete JSON editing with schema validation
- **[Python Pyright](python-pyright.md)** - Python development with type checking and IntelliSense
- **[Langium DSL](langium-dsl.md)** - Custom domain-specific language examples

### Communication Patterns
- **WebSocket Examples**: External language servers via WebSocket connections
- **Web Worker Examples**: In-browser language servers using Web Workers
- **Hybrid Examples**: Combining multiple communication patterns

### Integration Approaches
- **Extended Mode Examples**: Rich VS Code-like functionality
- **Classic Mode Examples**: Lightweight Monaco Editor integration
- **React Examples**: Framework-specific integrations
- **Multi-Language Examples**: Supporting multiple languages simultaneously

## Quick Start

The fastest way to explore examples is through the live demo:

```bash
# Clone the repository
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open http://localhost:20001 to access the interactive examples.

## Example Structure

Each example includes:
- **Complete source code** with detailed comments
- **Setup instructions** for running the example
- **Language server configuration** when external servers are used
- **Key concepts explanation** highlighting important patterns
- **Troubleshooting tips** for common issues

## Repository Examples

The examples in this documentation correspond to working implementations in the repository:

- **JSON Example**: `/packages/examples/src/json/`
- **Python Example**: `/packages/examples/src/python/`
- **Langium Examples**: `/packages/examples/src/langium/`
- **React Examples**: `/packages/examples/src/*/main-react.tsx`

## Choose Your Example

- **New to Monaco Language Client?** → Start with [JSON Language Server](json-language-server.md)
- **Need Python support?** → See [Python Pyright](python-pyright.md)
- **Building a custom DSL?** → Check out the [Langium DSL](langium-dsl.md) example
- **Using React?** → Look for React variants in each example

## Running Examples Locally

Most examples require language servers to be running. Use these commands:

```bash
# JSON Language Server
npm run start:example:server:json

# Python Language Server
npm run start:example:server:python

# For other examples, see individual example pages
```

Each example page provides specific setup instructions and requirements.
