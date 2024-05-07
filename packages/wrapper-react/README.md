# React component for Monaco-Editor and Monaco Languageclient

This packages provides a React component that it based on the [monaco-editor-wrapper](https://www.npmjs.com/package/monaco-editor-wrapper). It behaves nearly the same way as the monaco editor, with the primary difference being that you interact with it through a React component.

The [monaco-languageclient](https://github.com/TypeFox/monaco-languageclient) can be activated to connect to a language server either via jsonrpc over a websocket to an exernal server process, or via the Language Server Protocol for the browser where the language server runs in a web worker.

## CHANGELOG

All changes are noted in the [CHANGELOG](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/CHANGELOG.md).

## Getting Started

This is npm package is part of the <https://github.com/TypeFox/monaco-languageclient> mono repo. Please follow the main repositories [instructions]](<https://github.com/TypeFox/monaco-languageclient#getting-started>) to get started with local development.

## Usage

You can import the monaco react component for easy use in an existing React project. Below you can see a quick example of a fully functional implementation in TypeScript. The react component uses the same `UserConfig` approach which is then applied to `monaco-editor-wrapper`.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@codingame/monaco-vscode-python-default-extension';
import { UserConfig } from 'monaco-editor-wrapper';
import { MonacoEditorReactComp } from '@typefox/monaco-editor-react';

const userConfig: UserConfig = {
  wrapperConfig: {
    editorAppConfig: {
      $type: 'extendend',
      languageId: 'python',
      code: 'print("Hello, World!")'
    }
  }
};

const htmlElement = document.getElementById('monaco-editor-root') as HTMLElement;
const comp = <MonacoEditorReactComp
    userConfig={userConfig}
    style={{
        'paddingTop': '5px',
        'height': '80vh'
    }}
/>;
ReactDOM.createRoot(htmlElement!).render(comp);

```

### Invoking Custom Commands

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

## Examples

For a detailed list of examples please look at [this section](<https://github.com/TypeFox/monaco-languageclient#examples-overview>) in the main repository.

## License

[MIT](https://github.com/TypeFox/monaco-languageclient/blob/main/packages/wrapper-react/LICENSE)
