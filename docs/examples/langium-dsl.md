# Langium DSL Example

This example demonstrates how to use `monaco-languageclient` to create a web-based editor for a custom Domain-Specific Language (DSL) built with [Langium](https://langium.org/).

## Overview

The example creates a web-based editor for Langium's own grammar definition files (`.langium` files). It provides features like syntax highlighting, code completion, and validation for the Langium grammar language.

## How to Run the Example

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/TypeFox/monaco-languageclient.git
    cd monaco-languageclient
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

4.  **Open the example in your browser:**

    Navigate to `http://localhost:20001` and click on the "Langium Grammar DSL" link.

## Grammar

The grammar for the Langium language is defined in the `packages/examples/resources/langium/langium-dsl/langium-grammar.langium` file. This file defines the structure of the Langium grammar language, including keywords, rules, and types.

## Language Server

The language server for the Langium DSL example is located in the `packages/examples/src/langium/langium-dsl/worker/langium-server.ts` file. This file uses the `langium` package to create a language server that runs in a Web Worker. The language server provides features like code completion, validation, and go-to-definition for the Langium grammar language.

## Client-Side Integration

The client-side integration is handled in the `packages/examples/src/langium/langium-dsl/main.ts` file. This file does the following:

1.  **Creates a Web Worker** for the language server.
2.  **Creates a `MonacoLanguageClient`** to connect to the language server.
3.  **Initializes the Monaco editor** in Extended Mode.
4.  **Opens the Langium grammar files** in the editor.
