// 07a: candidate 自動投入 hook（03b sync 成功時に呼ぶ）
//
// AC-8: current_response_id 更新時に member_tags が空かつ queue に未解決行が無ければ
//        candidate 行を 1 件作成する。
//
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる
//
// 既存 02b の `enqueue` 関数は suggestedTagsJson を必須にしているため、本 hook は
// raw SQL で suggested_tags_json='[]' を投入する（admin が UI で確定する）。
import type { DbCtx } from "../repository/_shared/db";

export interface EnqueueTagCandidateInput {
  memberId: string;
  responseId: string;
}

export interface EnqueueTagCandidateResult {
  enqueued: boolean;
  reason?: "has_tags" | "has_pending_candidate";
  queueId?: string;
}

export async function enqueueTagCandidate(
  c: DbCtx,
  input: EnqueueTagCandidateInput,
): Promise<EnqueueTagCandidateResult> {
  // 1. member_tags が既に存在する場合は skip
  const tagRow = await c.db
    .prepare("SELECT 1 AS found FROM member_tags WHERE member_id = ? LIMIT 1")
    .bind(input.memberId)
    .first<{ found: number }>();
  if (tagRow) {
    return { enqueued: false, reason: "has_tags" };
  }

  // 2. 未解決 queue（queued / reviewing）が既にある場合は skip
  const pending = await c.db
    .prepare(
      "SELECT queue_id FROM tag_assignment_queue WHERE member_id = ? AND status IN ('queued','reviewing') LIMIT 1",
    )
    .bind(input.memberId)
    .first<{ queue_id: string }>();
  if (pending) {
    return { enqueued: false, reason: "has_pending_candidate" };
  }

  // 3. candidate 投入
  const queueId = crypto.randomUUID();
  await c.db
    .prepare(
      "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id, status, suggested_tags_json) VALUES (?, ?, ?, 'queued', '[]')",
    )
    .bind(queueId, input.memberId, input.responseId)
    .run();
  return { enqueued: true, queueId };
}
