# React component for Monaco-Editor and Monaco Languageclient

This packages provides a React component that it based on the [monaco-editor-wrapper](../monaco-editor-wrapper/). It behaves in nearly the same way as the monaco editor, with the primary difference being that you interact with it through a React component.

The [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) can be activated to connect to a language server either via jsonrpc over a websocket to an exernal server process, or via the Language Server Protocol for the browser where the language server runs in a web worker.

## Getting Started

We recommend using [Volta](https://volta.sh/) to ensure your node & npm are on known good versions.

If you have node.js LTS available, then from the root of the project run:

```bash
npm i
npm run build
```

This will clean, compile and build a bundle of the monaco-editor-react component, which you can reference in your own projects.

## Usage

You can import the monaco react component for easy use in an existing React project. Below you can see a quick example of a fully functional implementation in TypeScript. The react component uses the same `UserConfig` approach which is then applied to `monaco-editor-wrapper`.

```typescript
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';
import { UserConfig } from 'monaco-editor-wrapper';

import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';

const userConfig: UserConfig = {
  htmlElement: document.getElementById('monaco-editor-root') as HTMLElement,
  wrapperConfig: {
    editorAppConfig: {
      $type: 'classic',
      languageId: 'typescript',
      code: `function sayHello(): string {
    return "Hello";
};`,
      useDiffEditor: false,
      theme: 'vs-dark'
    }
  }
};

const comp = <MonacoEditorReactComp
    userConfig={userConfig}
    style={{
        'paddingTop': '5px',
        'height': '80vh'
    }}
/>;
```

### Bundled Usage

For special cases you might want the component to be processed in advance. For these cases we provide a pre-bundled version that you can reference instead, built using `npm run build:bundle`. This can be helpful if you're working within some other framework besides React (Hugo for example).

```ts
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react/bundle';
```

## Examples

These are the examples specifically for `@typefox/monaco-editor-react` that you can find in the repository:

- TypeScript editor worker using classic configuration [see](../examples/react_ts.html)
- Langium statemachine language client and web worker based language server using the exact same user configuration as [wrapper statemachine](../examples/wrapper_statemachine.html), [see](../examples/react_statemachine.html)
- Langium grammar language client and web worker based language server using vscode-api configuration [see](../examples/react_langium.html)

## Invoking Custom Commands

*An experimental feature.*

If you have hooked up this component to talk with a language server, then you also may want to invoke custom LSP commands. This can be helpful when you want to perform specific actions on the internal representation of your language, or when you want to expose some details about your language for use in your React application. This could include generator functionality, such that other parts of your application can interact with your language without knowledge of the language server's internals.

Custom commands can be invoked by getting a reference to your Monaco component. This *breaks* the standard encapsulation that React is built on, so no guarantees this won't cause other issues with your React app.

```ts
// based on the official React example for refs:
// https://reactjs.org/docs/refs-and-the-dom.html#creating-refs

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    return <MonacoEditorReactComp ref={this.myRef} .../>;
  }
}
```

You can then access the `current` property of the ref to get a reference to your component. This can then be used to invoke the `executeCommands` function present in the component.

```ts
this.myRef.current.executeCommand('myCustomCommand', args...);
```

This will return an instance of `Thenable`, which should contain the returned data of executing your custom command. As you can imagine, this is incredibly helpful for getting internal access for specific language handling, but without needing details about the internals of your language server to do it.
