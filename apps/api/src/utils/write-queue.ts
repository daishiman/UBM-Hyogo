// UT-09: D1 への書き込みを直列化する FIFO キュー。
// 並列書き込みによる SQLITE_BUSY を抑制するため、Promise chain で逐次実行する。

export class WriteQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.tail.then(task, task);
    // 次のタスクは前タスクの成否に関わらず開始するため、catch を吸収して chain を継続
    this.tail = next.catch(() => undefined);
    return next;
  }

  async drain(): Promise<void> {
    await this.tail.catch(() => undefined);
  }
}
