/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Disposable } from 'vscode-jsonrpc/lib/events';

export {
    Disposable
}

export class DisposableCollection implements Disposable {
    protected readonly disposables: Disposable[] = [];

    dispose(): void {
        while (this.disposables.length !== 0) {
            this.disposables.pop()!.dispose();
        }
    }

    push(disposable: Disposable): Disposable {
        const disposables = this.disposables;
        disposables.push(disposable);
        return {
            dispose(): void {
                const index = disposables.indexOf(disposable);
                if (index !== -1) {
                    disposables.splice(index, 1);
                }
            }
        }
    }

}