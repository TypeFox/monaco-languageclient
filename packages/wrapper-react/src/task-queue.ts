/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

type Task<T = unknown> = () => Promise<T> | T;
type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject<T> = (reason?: T) => void;
type TaskQueueItem<T = unknown> = {
    task: Task<T>;
    resolve: Resolve<T>;
    reject: Reject<T>;
};

export class TaskQueue {
    private queue: Array<TaskQueueItem<unknown>>;
    private readonly concurrency: number;
    private running: number;
    constructor(concurrency: number = 1) {
        this.queue = [];
        this.concurrency = concurrency;
        this.running = 0;
    }

    push<T>(task: Task<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            void (this.running < this.concurrency
                ? this.runTask(task, resolve, reject)
                : this.enqueueTask(task, resolve, reject));
        });
    }

    private increment() {
        this.running++;
    }
    private decrement() {
        this.running--;
    }

    private async runTask<T>(
        task: Task<T>,
        resolve: Resolve<T>,
        reject: Reject<T>
    ) {
        this.increment();
        try {
            const result = await task();
            resolve(result);
        } catch (e: unknown) {
            reject(e as T);
        } finally {
            this.decrement();
            if (this.queue.length > 0) {
                const nextTask = this.queue.shift();
                if (nextTask) {
                    await this.runTask(
                        nextTask.task,
                        nextTask.resolve,
                        nextTask.reject
                    );
                }
            }
        }
    }

    private enqueueTask<T>(
        task: Task<T>,
        resolve: Resolve<T>,
        reject: Reject<T>
    ) {
        this.queue.push({ task, resolve, reject } as never);
    }
}
