/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export const defaultViewsInit = async () => {
    const { Parts, Position, onPartVisibilityChange, isPartVisibile, attachPart, getSideBarPosition, onDidChangeSideBarPosition } = await import('@codingame/monaco-vscode-views-service-override');

    for (const config of [
        { part: Parts.TITLEBAR_PART, element: '#titleBar' },
        { part: Parts.BANNER_PART, element: '#banner' },
        {
            part: Parts.SIDEBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#sidebar' : '#sidebar-right';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        {
            part: Parts.ACTIVITYBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#activityBar' : '#activityBar-right';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        {
            part: Parts.AUXILIARYBAR_PART, get element() {
                return getSideBarPosition() === Position.LEFT ? '#auxiliaryBar' : '#auxiliaryBar-left';
            }, onDidElementChange: onDidChangeSideBarPosition
        },
        { part: Parts.EDITOR_PART, element: '#editors' },
        { part: Parts.PANEL_PART, element: '#panel' },
        { part: Parts.STATUSBAR_PART, element: '#statusBar' }
    ]) {
        attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!);

        config.onDidElementChange?.(() => {
            attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!);
        });

        if (!isPartVisibile(config.part)) {
            document.querySelector<HTMLDivElement>(config.element)!.style.display = 'none';
        }

        onPartVisibilityChange(config.part, visible => {
            document.querySelector<HTMLDivElement>(config.element)!.style.display = visible ? 'block' : 'none';
        });
    }
};

export const defaultViewsHtml = `<div id="workbench-container">
    <div id="titleBar"></div>
    <div id="banner"></div>
    <div id="workbench-top">
        <div id="sidebarDiv">
            <div id="activityBar"></div>
            <div id="sidebar"></div>
            <div id="auxiliaryBar-left"></div>
        </div>
        <div id="editorsDiv">
            <div id="editors"></div>
        </div>
        <div id="sidebarRightDiv">
            <div id="sidebar-right"></div>
            <div id="activityBar-right"></div>
            <div id="auxiliaryBar"></div>
        </div>
    </div>
    <div id="panel"></div>
    <div id="statusBar"></div>
</div>`;

export const defaultHtmlAugmentationInstructions = (htmlElement: HTMLElement | null | undefined) => {
    const htmlContainer = document.createElement('div', { is: 'app' });
    htmlContainer.innerHTML = defaultViewsHtml;
    htmlElement?.append(htmlContainer);
};
