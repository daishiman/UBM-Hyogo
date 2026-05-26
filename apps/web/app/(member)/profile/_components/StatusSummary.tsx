// workflow: mypage-prototype-alignment / Phase 5 / ST-2
// 役割: 公開状態 + 認証 gate + 同意状況を Banner ベースで集約表示する Server Component。
// 不変条件 #2: consent キーは publicConsent / rulesConsent に統一。
// 不変条件 #3: HEX 直書き禁止。色は Banner primitive の data-tone（tokens.css 経由）のみ。
// 不変条件 #4: 編集要素は配置しない（表示のみ）。

import type {
  MeAuthGateState,
  MeProfileStatusSummary,
} from "@/lib/api/me-types";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { Banner } from "@/components/ui/Banner";
import { Icon } from "@/components/ui/Icon";

type BannerTone = "success" | "info" | "warning" | "danger";

const labelOfConsent = (
  c: MeProfileStatusSummary[typeof STABLE_KEY.publicConsent],
): string =>
  c === "consented" ? "同意済" : c === "declined" ? "未同意" : "未確認";

const labelOfGate = (g: MeAuthGateState): string =>
  g === "active"
    ? "アクティブ"
    : g === "rules_declined"
      ? "規約未同意"
      : "削除済";

interface BannerView {
  readonly tone: BannerTone;
  readonly title: string;
  readonly description: string;
}

function deriveStatusBannerView(
  publishState: MeProfileStatusSummary["publishState"],
  authGateState: MeAuthGateState,
): BannerView {
  if (authGateState === "deleted") {
    return {
      tone: "danger",
      title: "アカウントは削除待ちです",
      description: "管理者の処理が完了するまで再ログインできません。",
    };
  }
  if (authGateState === "rules_declined") {
    return {
      tone: "warning",
      title: "規約の再同意が必要です",
      description: "最新の利用規約に同意するまで一部機能が制限されます。",
    };
  }
  switch (publishState) {
    case "public":
      return {
        tone: "success",
        title: "プロフィールは公開されています",
        description: "会員一覧に表示されます。",
      };
    case "member_only":
      return {
        tone: "info",
        title: "会員限定で公開しています",
        description: "ログインした会員にのみ表示されます。",
      };
    case "hidden":
      return {
        tone: "warning",
        title: "現在は非公開です",
        description: "会員一覧には表示されません。",
      };
  }
}

export interface StatusBannerProps {
  readonly statusSummary: MeProfileStatusSummary;
  readonly authGateState: MeAuthGateState;
}

export function StatusBanner({
  statusSummary,
  authGateState,
}: StatusBannerProps) {
  const v = deriveStatusBannerView(statusSummary.publishState, authGateState);
  return (
    <section aria-label="アカウント状態" data-region="status-banner">
      <Banner
        tone={v.tone}
        title={v.title}
        icon={<Icon name="check" />}
      >
        <span>
          {v.description} 公開許可: {labelOfConsent(statusSummary.publicConsent)} / 規約同意:{" "}
          {labelOfConsent(statusSummary.rulesConsent)} / 認証:{" "}
          {labelOfGate(authGateState)}
        </span>
      </Banner>
    </section>
  );
}

// 後方互換: 旧 KVList 版を参照していた箇所のための alias（live 参照は page.tsx で StatusBanner に統一）。
export const StatusSummary = StatusBanner;
export type StatusSummaryProps = StatusBannerProps;
