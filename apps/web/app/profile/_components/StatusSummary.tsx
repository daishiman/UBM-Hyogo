// 06b: 公開状態 / 同意状況 / 削除フラグを KVList で集約表示する Server Component。
// 不変条件 #2: consent キーは publicConsent / rulesConsent に統一。
// 不変条件 #4: 編集要素は配置しない（表示のみ）。

import type { MeProfileStatusSummary } from "../../../src/lib/api/me-types";
import type { MeAuthGateState } from "../../../src/lib/api/me-types";
import { KVList } from "../../../src/components/ui/KVList";

const labelOfPublishState = (s: MeProfileStatusSummary["publishState"]): string =>
  s === "public" ? "公開" : s === "member_only" ? "会員限定" : "非公開";

const labelOfConsent = (
  c: MeProfileStatusSummary["publicConsent"],
): string =>
  c === "consented" ? "同意済" : c === "declined" ? "未同意" : "未確認";

const labelOfGate = (g: MeAuthGateState): string =>
  g === "active"
    ? "アクティブ"
    : g === "rules_declined"
      ? "規約未同意"
      : "削除済";

export interface StatusSummaryProps {
  readonly statusSummary: MeProfileStatusSummary;
  readonly authGateState: MeAuthGateState;
}

export function StatusSummary({
  statusSummary,
  authGateState,
}: StatusSummaryProps) {
  return (
    <section aria-label="アカウント状態">
      <h2>アカウント状態</h2>
      <KVList
        items={[
          { key: "公開状態", value: labelOfPublishState(statusSummary.publishState) },
          { key: "公開許可", value: labelOfConsent(statusSummary.publicConsent) },
          { key: "規約同意", value: labelOfConsent(statusSummary.rulesConsent) },
          { key: "削除フラグ", value: statusSummary.isDeleted ? "あり" : "なし" },
          { key: "認証状態", value: labelOfGate(authGateState) },
        ]}
      />
    </section>
  );
}
