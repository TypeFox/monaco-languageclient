# Langium Guides

The following guides are for integrating Langium into a `monaco-languageclient` application in the web. Specifically, these guides focus on getting the language server hooked up to provide support in the editor, as well as walking through how to setup notification & request dispatch/handling logic. If you're interested in setting up a Langium-based DSL in the web, then these are the guides for you!

These guides assume you have already read the [Getting Started](../getting-started.md) guide here, as well as the [Langium Getting Started Guides](https://langium.org/docs/introduction/) (or equivalent understanding), starting from the introduction and into the tutorials a bit, and that you already have a working Langium language.

For a concrete, runnable example of all the concepts covered in these guides, see the [MiniLogo example](../../../packages/examples/src/langium/langium-dsl/minilogo/) in this repository. It demonstrates a complete Langium DSL running in the browser with Monaco, using the [`langium-minilogo`](https://github.com/TypeFox/langium-minilogo) package.

- [Running a Langium DSL in the Browser](/docs/guides/langium/running-langium-ls-in-browser.md) goes over how to get a Langium-based DSL working in the web with the monaco-languageclient. Effectively this goes over how to prepare & bundle a Langium-based DSL's language server, so it can be run in a web worker & connected to.
- [Custom Notifications and Requests with Langium Language Servers](./custom-notifications-requests.md) goes over how to interface with your language server to handle and send custom notifications & requests. This is useful for doing things like generation in the web.
