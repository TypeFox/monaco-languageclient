import { sayFoo } from './tester.js';

function sayHello(): string {
    console.log(sayFoo());
    return 'Hello';
};

sayHello();
