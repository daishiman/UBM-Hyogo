import { describe, it, expect } from "vitest";
import { WriteQueue } from "./write-queue";

describe("WriteQueue", () => {
  it("タスクを直列に実行する", async () => {
    const queue = new WriteQueue();
    const order: number[] = [];
    const tasks = [10, 5, 1].map((delay, i) => () =>
      new Promise<void>((resolve) =>
        setTimeout(() => {
          order.push(i);
          resolve();
        }, delay),
      ),
    );
    await Promise.all(tasks.map((t) => queue.enqueue(t)));
    expect(order).toEqual([0, 1, 2]);
  });

  it("失敗しても次タスクを継続する", async () => {
    const queue = new WriteQueue();
    const order: string[] = [];
    const t1 = queue.enqueue(async () => {
      throw new Error("first failed");
    });
    const t2 = queue.enqueue(async () => {
      order.push("t2");
    });
    await expect(t1).rejects.toThrow("first failed");
    await t2;
    expect(order).toEqual(["t2"]);
  });
});
