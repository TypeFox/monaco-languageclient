# Python-Pyright Example

This example demonstrates how to use `monaco-languageclient` to create a web-based editor for Python with type checking and IntelliSense provided by the [Pyright](https://github.com/microsoft/pyright) language server.

## Overview

The example creates a web-based editor for Python. It provides features like syntax highlighting, code completion, and type checking for Python code.

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

4.  **Start the Python language server:**

    ```bash
    npm run start:example:server:python
    ```

5.  **Open the example in your browser:**

    Navigate to `http://localhost:20001` and click on the "Python Language Client & Pyright Language Server (Web Socket)" link.

## Language Server

The language server for the Python-Pyright example is located in the `packages/examples/src/python/server/main.ts` file. This file starts a Node.js Express app that serves the Pyright language server over a WebSocket.

## Client-Side Integration

The client-side integration is handled in the `packages/examples/src/python/client/main.ts` file. This file does the following:

1.  **Creates a `MonacoLanguageClient`** to connect to the language server.
2.  **Initializes the Monaco editor** in Extended Mode.
3.  **Opens a Python file** in the editor.

## React Version

There is also a React version of the Python-Pyright example, which is located in the `packages/examples/src/python/client/reactPython.tsx` file. This version uses the `@typefox/monaco-editor-react` component to render the Monaco editor.
