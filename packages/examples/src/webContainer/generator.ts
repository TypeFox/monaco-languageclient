/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'path';
import type * as Generator from 'yeoman-generator';
import { createHelpers } from 'yeoman-test';
import type { Answers, PostAnwers } from 'generator-langium';

const answers: Answers & PostAnwers = {
    extensionName: 'hello-world',
    rawLanguageName: 'Hello World',
    fileExtensions: '.hello',
    includeVSCode: false,
    includeCLI: false,
    includeExampleProject: true,
    includeTest: false,
    openWith: false,
    entryName: 'Model'
};

console.log('Generating Langium project: ' + answers.extensionName);

const root = './';
// const root = '../..';
const moduleRoot = path.resolve(path.join(root, 'node_modules', 'generator-langium', 'app'));
const targetRoot = path.resolve(path.join('generator'));
const targetDirectory = path.resolve(path.join('generator', answers.extensionName));

console.log('ModuleRoot: ' + moduleRoot);
console.log('TargetRoot: ' + targetRoot);
console.log('TargetDirectory: ' + targetDirectory);

const context = createHelpers({}).run(moduleRoot);
context.targetDirectory = targetDirectory;

let result;
let exitCode = 0;
try {
    await context
        .withOptions({
            // we need to explicitly tell the generator it's destinationRoot
            destinationRoot: targetRoot
        } as Generator.BaseOptions)
        .withAnswers(answers)
        // speed up tests by skipping install
        .withArguments('skip-install')
        // speed up tests by skipping build
        .withArguments('skip-build');
    result = 'Generation completed successfully';

} catch (error) {
    result = 'Error during generation:' + error;
    exitCode = 1;
}

console.log(result);
process.exit(exitCode);
