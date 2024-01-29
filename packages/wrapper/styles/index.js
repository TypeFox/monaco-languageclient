import { getMonacoCss } from './css.js';

export const addMonacoStyles = (idOfStyleElement) => {
    const style = document.createElement('style');
    style.id = idOfStyleElement;
    style.innerHTML = getMonacoCss();
    document.head.appendChild(style);
};
