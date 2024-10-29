/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Parts, onPartVisibilityChange, isPartVisibile, attachPart, getSideBarPosition, Position, onDidChangeSideBarPosition } from '@codingame/monaco-vscode-views-service-override';

export const defaultViewsInit = () => {
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
        <div style="display: flex; flex: none; border: 1px solid var(--vscode-editorWidget-border)">
            <div id="activityBar"></div>
            <div id="sidebar" style="width: 400px"></div>
            <div id="auxiliaryBar-left" style="max-width: 300px"></div>
        </div>
        <div style="flex: 1; min-width: 0">
            <div id="editors"></div>
        </div>
        <div style="display: flex; flex: none; border: 1px solid var(--vscode-editorWidget-border);">
            <div id="sidebar-right" style="max-width: 500px"></div>
            <div id="activityBar-right"></div>
            <div id="auxiliaryBar" style="max-width: 300px"></div>
        </div>
    </div>
    <div id="panel"></div>
    <div id="statusBar"></div>
</div>`;
