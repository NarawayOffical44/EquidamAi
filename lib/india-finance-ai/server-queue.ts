type QueueTask<T> = () => Promise<T>;

type QueueItem<T> = {
  task: QueueTask<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

export type QueueRunMeta = {
  queuedBehind: number;
  waitMs: number;
};

const DEFAULT_MAX_QUEUE_SIZE = 50;

class SerialQueue {
  private active = false;
  private queue: QueueItem<unknown>[] = [];

  get pendingCount() {
    return this.queue.length + (this.active ? 1 : 0);
  }

  enqueue<T>(task: QueueTask<T>): Promise<{ result: T; meta: QueueRunMeta }> {
    const queuedBehind = this.pendingCount;
    const maxQueueSize = Number(process.env.INDIA_FINANCE_AI_MAX_QUEUE_SIZE || DEFAULT_MAX_QUEUE_SIZE);

    if (this.queue.length >= maxQueueSize) {
      throw new Error("Evaldam Startup AI is busy. Please try again in a moment.");
    }

    const enqueuedAt = Date.now();

    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve: (result) =>
          resolve({
            result: result as T,
            meta: {
              queuedBehind,
              waitMs: Date.now() - enqueuedAt,
            },
          }),
        reject,
      });

      this.processNext();
    });
  }

  private processNext() {
    if (this.active) return;

    const item = this.queue.shift();
    if (!item) return;

    this.active = true;

    item
      .task()
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        this.active = false;
        this.processNext();
      });
  }
}

const globalForIndiaFinanceAi = globalThis as typeof globalThis & {
  __indiaFinanceAiQueue?: SerialQueue;
};

export const indiaFinanceAiQueue =
  globalForIndiaFinanceAi.__indiaFinanceAiQueue || new SerialQueue();

globalForIndiaFinanceAi.__indiaFinanceAiQueue = indiaFinanceAiQueue;
