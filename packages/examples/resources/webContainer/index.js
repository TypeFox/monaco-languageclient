/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'path';
import { fileURLToPath } from 'node:url';
import { createHelpers } from 'yeoman-test';
import { mkdir } from 'node:fs';

/**
 * Instruct the yeoman generator to create a new Langium project by using yeoman-test
 */
console.log(`Generating Langium project: ${this.config.extensionName}`);

const answers = [
    'hello-world', // extensionName
    'Hello World', // rawLanguageName
    'hello', // fileExtension
    'Model', // entryRule
    'Y', // includeVSCode
    'Y', // includeCLI
    'Y', // includeExampleProject
    'N' // includeTest
];

const myDir = fileURLToPath('/home/langium');
const moduleRoot = path.join(myDir, 'node_modules', 'generator-langium', 'app');
const targetRoot = path.join(myDir, 'hello-world');

const context = createHelpers({}).run(moduleRoot);
context.targetDirectory = path.resolve(targetRoot);

context
    .withOptions({
        destinationRoot: targetRoot
    })
    .onTargetDirectory((workingDir) => {
        console.log(`Generating into directory: ${workingDir}`);
    })
    .withAnswers(answers)
    .then(() => {
        console.log('Generation complete');
    });
