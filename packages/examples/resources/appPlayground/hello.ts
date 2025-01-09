function sayHello(): string {
    // intentionally erroneous to test import resolution
    console.log(sayFoo());
    return 'Hello';
};

sayHello();
