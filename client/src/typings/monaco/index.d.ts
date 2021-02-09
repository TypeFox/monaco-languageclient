/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as monaco from 'monaco-editor-core';

declare module 'monaco-editor-core' {

    module instantiation {
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
}