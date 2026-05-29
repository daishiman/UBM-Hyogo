// members-not-displaying-form-sync-investigation Task B:
// public_consent 反映時の publish_state 自動切替 policy。
// 不変条件:
//   - flagEnabled=false の場合は何もしない（現状維持）
//   - admin override（hidden / system: 以外の updated_by）は尊重し上書きしない
//   - public への昇格は member_only からのみ。public は public のまま維持
//   - hidden は consent に関わらず hidden を維持
//   - canonical 値は `public` / `member_only` / `hidden`。legacy `published` / `private`
//     は policy 入力前に正規化（published -> public、private -> hidden）

export type PublishState = "public" | "member_only" | "hidden";
export type ConsentValue = "consented" | "declined" | "unknown";

export interface AutoPublishInput {
  readonly currentPublishState: PublishState;
  readonly publicConsent: ConsentValue;
  readonly hasAdminExplicitOverride: boolean;
  readonly flagEnabled: boolean;
}

export function decidePublishState(input: AutoPublishInput): PublishState {
  if (!input.flagEnabled) return input.currentPublishState;
  if (input.hasAdminExplicitOverride) return input.currentPublishState;
  if (input.currentPublishState === "public") return "public";
  if (input.currentPublishState === "hidden") return "hidden";
  // currentPublishState === "member_only"
  return input.publicConsent === "consented" ? "public" : "member_only";
}

/**
 * admin override 判定。
 * - publish_state='hidden' は admin による明示的な非公開とみなす
 * - updated_by が NULL でなく `system:` で始まらない場合は admin/user が直接触った扱い
 */
export function isAdminOverrideStatus(input: {
  readonly currentPublishState: PublishState;
  readonly updatedBy: string | null;
}): boolean {
  if (input.currentPublishState === "hidden") return true;
  const ub = input.updatedBy;
  if (ub != null && ub.length > 0 && !ub.startsWith("system:")) return true;
  return false;
}

/**
 * legacy DB 値 `published` / `private` を canonical へ正規化する。
 * 不明値（null / unknown）は `member_only` 既定値にする。
 */
export function normalizePublishState(raw: string | null | undefined): PublishState {
  if (raw === "public" || raw === "published") return "public";
  if (raw === "hidden" || raw === "private") return "hidden";
  return "member_only";
}

export function normalizeConsentValue(raw: string | null | undefined): ConsentValue {
  if (raw === "consented") return "consented";
  if (raw === "declined") return "declined";
  return "unknown";
}
