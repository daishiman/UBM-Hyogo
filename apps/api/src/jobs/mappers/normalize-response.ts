// 03b: normalize-response
// MemberResponse（01b の googleFormsClient.listResponses() の戻り値）から
// known stableKey の Map と unknown raw_question_id の Map に分離する。
//
// 不変条件:
//   #3 responseEmail は system field → known/unknown いずれにも含めない
//   #14 unknown は schema_diff_queue に集約するため別 Map で保持

import type { MemberResponse } from "@ubm-hyogo/shared";

export interface NormalizedAnswers {
  /** stable_key -> 値（string | string[] | null）の文字列化済み JSON */
  readonly known: Map<string, KnownAnswer>;
  /** raw_question_id -> raw answer JSON（schema_diff_queue 投入対象）*/
  readonly unknown: Map<string, UnknownAnswer>;
}

export interface KnownAnswer {
  readonly stableKey: string;
  readonly valueJson: string;
  readonly rawValueJson: string;
}

export interface UnknownAnswer {
  readonly questionId: string;
  readonly rawValueJson: string;
}

/** system field として扱う stable_key（response_fields に保存しない）*/
const SYSTEM_STABLE_KEYS = new Set<string>(["responseEmail"]);

export function normalizeResponse(resp: MemberResponse): NormalizedAnswers {
  const known = new Map<string, KnownAnswer>();
  const unknown = new Map<string, UnknownAnswer>();

  for (const [stableKey, value] of Object.entries(resp.answersByStableKey)) {
    if (SYSTEM_STABLE_KEYS.has(stableKey)) continue;
    const rawForStableKey =
      // mapper 上は rawAnswersByQuestionId 側に raw を持つが、stableKey 起点の正規化済み値だけを known に入れる
      undefined;
    known.set(stableKey, {
      stableKey,
      valueJson: JSON.stringify(value ?? null),
      rawValueJson: JSON.stringify(rawForStableKey ?? value ?? null),
    });
  }

  for (const qid of resp.unmappedQuestionIds) {
    const raw = resp.rawAnswersByQuestionId[qid] ?? null;
    unknown.set(qid, {
      questionId: qid,
      rawValueJson: JSON.stringify(raw),
    });
  }

  return { known, unknown };
}
