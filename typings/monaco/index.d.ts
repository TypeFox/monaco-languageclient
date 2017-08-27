/// <reference path='../../node_modules/monaco-editor-core/monaco.d.ts'/>

declare module monaco.editor {
    export interface IStandaloneCodeEditor {
        readonly _commandService: monaco.services.StandaloneCommandService;
    }
}

declare module monaco.commands {

    export interface ICommandEvent {
        commandId: string;
    }

    export interface ICommandService {
        onWillExecuteCommand: monaco.IEvent<ICommandEvent>;
        executeCommand<T>(commandId: string, ...args: any[]): monaco.Promise<T>;
        executeCommand(commandId: string, ...args: any[]): monaco.Promise<any>;
    }

    export interface ICommandHandler {
	    (accessor: monaco.instantiation.ServicesAccessor, ...args: any[]): void;
    }

    export interface ICommand {
        handler: ICommandHandler;
    }
}

declare module monaco.instantiation {
    export interface ServiceIdentifier<T> {
        (...args: any[]): void;
        type: T;
    }
    export interface ServicesAccessor {
        get<T>(id: ServiceIdentifier<T>, isOptional?: typeof optional): T;
    }
    export interface IInstantiationService {
    }
    export function optional<T>(serviceIdentifier: ServiceIdentifier<T>): (target: Function, key: string, index: number) => void;
}

declare module monaco.services {
    export class StandaloneCommandService implements monaco.commands.ICommandService {
        constructor(instantiationService: monaco.instantiation.IInstantiationService);
        addCommand(id: string, command: monaco.commands.ICommand): IDisposable;
        onWillExecuteCommand: monaco.IEvent<monaco.commands.ICommandEvent>;
        executeCommand<T>(commandId: string, ...args: any[]): monaco.Promise<T>;
        executeCommand(commandId: string, ...args: any[]): monaco.Promise<any>;
    }
}