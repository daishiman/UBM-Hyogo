// Phase 5: diff-queue-writer.ts
// AC-2: stableKey 未割当の question を schema_diff_queue に 1 件 = 1 row で投入する薄いラッパ。
// 既存の同一 question_id の queued row があれば INSERT スキップ（重複抑止）。
import type { DbCtx } from "../../repository/_shared/db";
import * as schemaDiffQueueRepo from "../../repository/schemaDiffQueue";
import type { DiffType } from "../../repository/schemaDiffQueue";

export interface EnqueueInput {
  readonly revisionId: string;
  readonly questionId: string;
  readonly label: string;
  readonly diffKind: DiffType;
  readonly suggestedStableKey?: string | null;
}

const hasOpenForQuestion = async (
  ctx: DbCtx,
  questionId: string,
): Promise<boolean> => {
  const r = await ctx.db
    .prepare(
      "SELECT 1 AS one FROM schema_diff_queue WHERE question_id = ? AND status = 'queued' LIMIT 1",
    )
    .bind(questionId)
    .first<{ one: number }>();
  return r !== null;
};

const newId = (): string => {
  const fn = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
  if (typeof fn === "function") return fn.call(globalThis.crypto);
  // fallback（テスト時など crypto.randomUUID 不在の環境向け）
  return `diff_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
};

export const diffQueueWriter = {
  /**
   * 同一 question_id で status='queued' な行が既にあれば INSERT スキップ。
   * AC-2 / AC-3: unresolved の二重投入を抑止する。
   */
  async enqueue(ctx: DbCtx, input: EnqueueInput): Promise<{ enqueued: boolean; diffId?: string }> {
    if (await hasOpenForQuestion(ctx, input.questionId)) {
      return { enqueued: false };
    }
    const diffId = newId();
    await schemaDiffQueueRepo.enqueue(ctx, {
      diffId,
      revisionId: input.revisionId,
      type: input.diffKind,
      questionId: input.questionId,
      stableKey: null,
      label: input.label,
      suggestedStableKey: input.suggestedStableKey ?? null,
    });
    return { enqueued: true, diffId };
  },
};
