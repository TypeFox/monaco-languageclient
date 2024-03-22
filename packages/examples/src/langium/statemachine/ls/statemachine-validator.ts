/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { State, Statemachine, StatemachineAstType, Event } from './generated/ast.js';
import type { StatemachineServices } from './statemachine-module.js';
import { MultiMap } from 'langium';

export function registerValidationChecks(services: StatemachineServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.StatemachineValidator;
    const checks: ValidationChecks<StatemachineAstType> = {
        State: validator.checkStateNameStartsWithCapital,
        Statemachine: validator.checkUniqueStatesAndEvents
    };
    registry.register(checks, validator);
}

export class StatemachineValidator {
    /**
     * Checks if the state name starts with a capital letter.
     * @param state the state to check
     * @param accept the acceptor to report errors
     */
    checkStateNameStartsWithCapital(state: State, accept: ValidationAcceptor): void {
        if (state.name) {
            const firstChar = state.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'State name should start with a capital letter.', { node: state, property: 'name' });
            }
        }
    }

    /**
     * Checks if there are duplicate state and event names.
     * @param statemachine the statemachine to check
     * @param accept the acceptor to report errors
     */
    checkUniqueStatesAndEvents(statemachine: Statemachine, accept: ValidationAcceptor): void {
        // check for duplicate state and event names and add them to the map
        const names = new MultiMap<string, State | Event>();
        const allSymbols = [...statemachine.states, ...statemachine.events];
        for (const symbol of allSymbols) {
            names.add(symbol.name, symbol);
        }
        for (const [name, symbols] of names.entriesGroupedByKey()) {
            if (symbols.length > 1) {
                for (const symbol of symbols) {
                    accept('error', `Duplicate identifier name: ${name}`, { node: symbol, property: 'name' });
                }
            }
        }
    }
}
