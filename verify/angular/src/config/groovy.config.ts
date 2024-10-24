import { LogLevel } from "vscode";
import { useWorkerFactory } from "monaco-editor-wrapper/workerFactory";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import { WrapperConfig } from "monaco-editor-wrapper";
export function getGroovyClientConfig(htmlContainerId: string) {
    const configureMonacoWorkers = () => {
        useWorkerFactory({
            workerOverrides: {
                ignoreMapping: true,
                workerLoaders: {
                    TextEditorWorker: () =>
                        new Worker(
                            new URL(
                                "monaco-editor/esm/vs/editor/editor.worker.js",
                                import.meta.url
                            ),
                            { type: "module" }
                        ),
                },
            },
        });
    };
    const userConfig: WrapperConfig = {
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    "workbench.colorTheme": "Default Dark Modern",
                    "editor.guides.bracketPairsHorizontal": "active",
                    "editor.wordBasedSuggestions": "off",
                    "editor.experimental.asyncTokenization": true,
                }),
            },
        },
        editorAppConfig: {
            $type: "extended",
            codeResources: {
                main: {
                    text: "",
                    fileExt: "groovy",
                },
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById(htmlContainerId)!,
        },
        languageClientConfigs: {
            groovy: {
                languageId: "groovy",
                connection: {
                    options: {
                        $type: "WebSocketUrl",
                        url: `ws://localhost:30002/groovy`,
                    },
                },
            },
        },
    };
    return userConfig;
}
