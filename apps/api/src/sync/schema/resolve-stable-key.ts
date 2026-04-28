// Phase 5: resolve-stable-key.ts
// 不変条件 #1: stableKey 文字列リテラル直書き禁止。
// - 既存 D1 の schema_questions.question_id に対応する stable_key を「alias」として優先採用
// - mapper.ts (packages/integrations-google) が STABLE_KEY_BY_LABEL マッピングを正本管理
// - どちらでも resolve できなければ source='unknown' を返し、diff queue に積む
import type { DbCtx } from "../../repository/_shared/db";
import * as schemaQuestionsRepo from "../../repository/schemaQuestions";
import type { FlatQuestion, ResolvedStableKey } from "./types";

export interface ResolveDeps {
  readonly ctx: DbCtx;
  /**
   * label → stableKey マッピング関数（既知 known map）。
   * 既存 mapper.ts の deriveStableKey 相当（slug fallback 含む）を呼び出すためのフック。
   * 戻り値が UNKNOWN_SENTINEL（"unknown"）または slug 結果と判定されたら null 扱い。
   */
  readonly labelToKnownStableKey: (label: string) => string | null;
}

export const UNKNOWN_SENTINEL = "unknown";

/**
 * 1 件の質問について stable_key を解決する。
 * 解決順:
 *  1. D1 の schema_questions.question_id に対応する既存 stable_key（alias 永続値）
 *  2. label からの known マッピング（mapper 経由）
 *  3. どちらも不在 → source='unknown' で diff queue に積む
 */
export async function resolveStableKey(
  input: Pick<FlatQuestion, "questionId" | "title">,
  deps: ResolveDeps,
): Promise<ResolvedStableKey> {
  const aliasStableKey = await schemaQuestionsRepo.findStableKeyByQuestionId(
    deps.ctx,
    input.questionId,
  );
  if (aliasStableKey !== null) {
    return { stableKey: aliasStableKey, source: "alias" };
  }
  const known = deps.labelToKnownStableKey(input.title);
  if (known !== null && known !== UNKNOWN_SENTINEL) {
    return { stableKey: known, source: "known" };
  }
  return { stableKey: null, source: "unknown" };
}
