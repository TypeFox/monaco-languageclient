# Examples

This page points to the canonical example implementations in [packages/examples](../../packages/examples). Prefer those files over copied snippets: they are compiled, tested and updated with API changes.

For the basic setup flow, start with the [Getting Started](./getting-started.md) guide. For configuration details such as Extended Mode, Classic Mode, WebSocket connections and worker connections, see the [Configuration](./configuration.md) guide.

## JSON examples

- [Extended JSON client](../../packages/examples/src/json/client/extended.ts)
- [Classic JSON client](../../packages/examples/src/json/client/classic.ts)
- [Shared JSON client configuration](../../packages/examples/src/json/client/config.ts)
- [JSON language server](../../packages/examples/src/json/server/main.ts)

Run the JSON server before opening JSON WebSocket examples:

```shell
npm run start:example:server:json
```

## Browser-only and worker examples

- [Browser-only JSON language service](../../packages/examples/src/browser/main.ts)
- [Clangd worker/WASM example](../../packages/examples/src/clangd/client/main.ts)
- [Langium grammar DSL worker example](../../packages/examples/src/langium/langium-dsl/main.ts)
- [MiniLogo worker example](../../packages/examples/src/langium/langium-dsl/minilogo/main.ts)
- [Statemachine worker example](../../packages/examples/src/langium/statemachine/main.ts)
- [React Statemachine example](../../packages/examples/src/langium/statemachine/main-react.tsx)

## Server-backed examples

- [Python/Pyright client](../../packages/examples/src/python/client/main.ts)
- [React Python/Pyright client](../../packages/examples/src/python/client/reactPython.tsx)
- [Python/Pyright server](../../packages/examples/src/python/server/main.ts)
- [Groovy client](../../packages/examples/src/groovy/client/main.ts)
- [Groovy server](../../packages/examples/src/groovy/server/main.ts)
- [Java/Eclipse JDT LS client](../../packages/examples/src/eclipse.jdt.ls/client/main.ts)
- [Java/Eclipse JDT LS server](../../packages/examples/src/eclipse.jdt.ls/server/main.ts)

Run the Python server before opening Python WebSocket examples:

```shell
npm run start:example:server:python
```

Groovy, Java/Eclipse JDT LS and debugger resources are started with Docker Compose files under [packages/examples/resources](../../packages/examples/resources).

## Application and Monaco-focused examples

- [Application playground](../../packages/examples/src/appPlayground/main.ts)
- [React application playground](../../packages/examples/src/appPlayground/reactMain.tsx)
- [TypeScript extension host worker](../../packages/examples/src/ts/clientTs.ts)

## Running examples

From the repository root:

```shell
npm install
npm run init:examples
npm run dev
```

Then open <http://localhost:20001>. Examples that do not require a backend are also available on [GitHub Pages](https://typefox.github.io/monaco-languageclient).

## Key takeaways

- Use `MonacoVscodeApiWrapper` to initialize the VS Code API layer before starting clients or editors.
- Use `LanguageClientWrapper` with `LcWebSocket` for external language servers.
- Use `LanguageClientWrapper` with `LcWorker` for browser worker language servers.
- Use `EditorApp` to create and manage editor content.
- Prefer examples in [packages/examples](../../packages/examples) as the source of truth for complete code.

## Next steps

- Read [Configuration](./configuration.md) for option details.
- Read [Langium Integration Guides](./langium/index.md) for Langium-specific worker and request/notification patterns.
- Read [Troubleshooting](./troubleshooting.md) if you encounter setup or bundling issues.
