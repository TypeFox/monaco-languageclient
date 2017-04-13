window.onload = () => {
    const w = <any>window;
    w.require(['vs/editor/editor.main'], () => {
        require('./client');
    });
};