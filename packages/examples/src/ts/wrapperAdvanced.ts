/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import { EditorAppConfigClassic, LanguageClientError, MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
            javascript: () => new Worker(new URL('monaco-editor-wrapper/workers/module/ts', import.meta.url), { type: 'module' }),
        }
    });
};

const wrapper42 = new MonacoEditorLanguageClientWrapper();
const wrapper43 = new MonacoEditorLanguageClientWrapper();
const wrapper44 = new MonacoEditorLanguageClientWrapper();

const wrapper42Config: UserConfig = {
    id: '42',
    wrapperConfig: {
        serviceConfig: {
            userServices: {
                ...getKeybindingsServiceOverride()
            },
            debugLogging: true
        },
        editorAppConfig: {
            $type: 'classic',
            codeResources: {
                original: {
                    text: `This line is equal.
This number is different 2002
Misspeelled!
Same again.`,
                    fileExt: 'txt'
                },
                main: {
                    text: `This line is equal.
This number is different 2022
Misspelled!
Same again.`,
                    fileExt: 'txt'
                }
            },
            useDiffEditor: true,
        }
    },
    languageClientConfig: {
        languageId: 'json',
        name: 'wrapper42 language client',
        options: {
            $type: 'WebSocket',
            host: 'localhost',
            port: 30000,
            path: 'sampleServer',
            secured: false
        }
    }
};

const wrapper43Config: UserConfig = {
    id: '43',
    wrapperConfig: {
        serviceConfig: {
            userServices: {
                ...getKeybindingsServiceOverride()
            },
            debugLogging: true
        },
        editorAppConfig: {
            $type: 'classic',
            codeResources: {
                original: {
                    text: 'This line is equal.\nThis number is different 3022.\nMisspelled!Same again.',
                    fileExt: 'txt'
                },
                main: {
                    text: 'This line is equal.\nThis number is different 3002.\nMisspelled!Same again.',
                    fileExt: 'txt'
                }
            },
            useDiffEditor: true,
            editorOptions: {
                lineNumbers: 'off'
            },
            diffEditorOptions: {
                lineNumbers: 'off'
            }
        }
    }
};

const wrapper44Config: UserConfig = {
    id: '44',
    wrapperConfig: {
        serviceConfig: {
            userServices: {
                ...getKeybindingsServiceOverride()
            },
            debugLogging: true
        },
        editorAppConfig: {
            $type: 'classic',
            codeResources: {
                main: {
                    text: `function logMe() {
    console.log('Hello monaco-editor-wrapper!');
};`,
                    fileExt: 'js'
                }
            },
            useDiffEditor: false,
            editorOptions: {
                minimap: {
                    enabled: true
                },
                theme: 'vs-dark'
            }
        }
    }
};

const startWrapper42 = async () => {
    await wrapper42.initAndStart(wrapper42Config, document.getElementById('monaco-editor-root-42'));
    console.log('wrapper42 was started.');
};

const startWrapper43 = async () => {
    await wrapper43.initAndStart(wrapper43Config, document.getElementById('monaco-editor-root-43'));
    console.log('wrapper43 was started.');
};
const startWrapper44 = async () => {
    await wrapper44.initAndStart(wrapper44Config, document.getElementById('monaco-editor-root-44'));
    console.log('wrapper44 was started.');
};

const sleepOne = (milliseconds: number) => {
    setTimeout(async () => {
        alert(`Updating editors after ${milliseconds}ms`);

        await wrapper42.dispose();
        wrapper42Config.languageClientConfig = undefined;
        const appConfig42 = wrapper42Config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        appConfig42.codeResources = {
            main: {
                text: `function logMe() {
    console.log('Hello swap editors!');
};`,
                fileExt: 'js'
            }
        };
        appConfig42.useDiffEditor = false;
        const w42Start = wrapper42.initAndStart(wrapper42Config, document.getElementById('monaco-editor-root-42'));

        const w43Start = await wrapper43.updateCodeResources({
            main: {
                text: 'text 5678',
                fileExt: 'txt'
            },
            original: {
                text: 'text 1234',
                fileExt: 'txt'
            }
        });

        await wrapper44.dispose();
        const appConfig44 = wrapper44Config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        appConfig44.useDiffEditor = true;
        appConfig44.codeResources = {
            original: {
                text: 'oh la la la!',
                fileExt: 'txt'
            },
            main: {
                text: 'oh lo lo lo!',
                fileExt: 'txt'
            }
        };
        // This affects all editors globally and is only effective
        // if it is not in contrast to one configured later
        appConfig44.editorOptions = {
            theme: 'vs-light'
        };
        const w44Start = wrapper44.initAndStart(wrapper44Config, document.getElementById('monaco-editor-root-44'));

        await w42Start;
        console.log('Restarted wrapper42.');
        await w43Start;
        console.log('Updated diffmodel of wrapper43.');
        await w44Start;
        console.log('Restarted wrapper44.');
    }, milliseconds);
};

const sleepTwo = (milliseconds: number) => {
    setTimeout(async () => {
        alert(`Updating last editor after ${milliseconds}ms`);

        await wrapper44.dispose();
        const appConfig44 = wrapper44Config.wrapperConfig.editorAppConfig as EditorAppConfigClassic;
        appConfig44.useDiffEditor = false;
        appConfig44.editorOptions = {
            theme: 'vs-dark'
        };
        await wrapper44.initAndStart(wrapper44Config, document.getElementById('monaco-editor-root-44'));
        console.log('Restarted wrapper44.');
    }, milliseconds);
};

export const runAdvancedExample = async () => {
    try {
        await startWrapper43();
        await startWrapper44();
        try {
            await startWrapper42();
        } catch (e) {
            console.log(`Catched expected connection error: ${(e as LanguageClientError).message}`);
        }

        // change the editors config, content or swap normal and diff editors after five seconds
        sleepOne(5000);

        // change last editor to regular mode
        sleepTwo(10000);
    } catch (e) {
        console.error(e);
    }
};
