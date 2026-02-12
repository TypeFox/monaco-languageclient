/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

const QUOT = 34;
const LBRACE = 123;
const RBRACE = 125;
const BACKSLASH = 92;

export class JsonStream {
    #inJson = false;
    #rawText: number[] = [];
    #unbalancedBraces = 0;
    #inString = false;
    #inEscape = 0;
    readonly #textDecoder = new TextDecoder();

    constructor() {}

    /**
     * Insert a char into current partial JSON
     * @param charCode
     * @returns Complete JSON string if the inserted char makes the JSON complete, otherwise null
     */
    insert(charCode: number): string | null {
        if (!this.#inJson && charCode === LBRACE) {
            this.#inJson = true;
            this.#rawText = [];
        }
        if (!this.#inJson) {
            return null;
        }
        this.#rawText.push(charCode);
        if (this.#inString) {
            if (this.#inEscape) {
                if (charCode === 75) {
                    // \uxxxx
                    this.#inEscape += 4;
                }
                this.#inEscape--;
            } else {
                if (charCode === BACKSLASH) {
                    this.#inEscape = 1;
                } else if (charCode === QUOT) {
                    this.#inString = false;
                }
            }
        } else {
            if (charCode === LBRACE) {
                this.#unbalancedBraces++;
            } else if (charCode === RBRACE) {
                this.#unbalancedBraces--;
                if (this.#unbalancedBraces === 0) {
                    this.#inJson = false;
                    return this.#textDecoder.decode(new Uint8Array(this.#rawText));
                }
            } else if (charCode === QUOT) {
                this.#inString = true;
            }
        }
        return null;
    }
}
