// 03b: extract-consent
// 不変条件 #2: consent キーは publicConsent / rulesConsent。旧 ruleConsent 等を
// `@ubm-hyogo/shared` の normalizeConsent で正規化する。

import { normalizeConsent } from "@ubm-hyogo/shared";
import type { ConsentStatus } from "@ubm-hyogo/shared";
import type { MemberResponse } from "@ubm-hyogo/shared";

export interface ExtractedConsents {
  readonly publicConsent: ConsentStatus;
  readonly rulesConsent: ConsentStatus;
}

/**
 * MemberResponse の answers から publicConsent / rulesConsent を抽出する。
 * stableKey 解決済みの answersByStableKey と、未解決の rawAnswersByQuestionId を
 * 同一 raw object として扱い、shared/utils/consent.ts の legacy alias 解決に乗せる。
 */
export function extractConsent(resp: MemberResponse): ExtractedConsents {
  const merged: Record<string, unknown> = {};
  // raw 側から先に流す（known の方が後で上書きされるため、stable な値が優先される）
  for (const [qid, payload] of Object.entries(resp.rawAnswersByQuestionId)) {
    merged[qid] = payload;
  }
  for (const [key, value] of Object.entries(resp.answersByStableKey)) {
    merged[key] = value;
  }
  return normalizeConsent(merged);
}
