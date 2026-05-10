// task-14 phase-9 #1: 公開状態 / authGate を最上段で要約する Server Component。
// 不変条件: 本文編集 UI は持たない。tokens 経由のみで描画。selector は `data-region="public-visibility-banner"`。

import type {
  MeAuthGateState,
  MeProfileStatusSummary,
} from "../../../src/lib/api/me-types";
import { Banner } from "../../../src/components/ui/Banner";

export type PublicVisibilityPublishState =
  MeProfileStatusSummary["publishState"];

export interface PublicVisibilityBannerProps {
  readonly publishState: PublicVisibilityPublishState;
  readonly authGateState: MeAuthGateState;
}

type View = {
  readonly tone: "success" | "info" | "warning" | "danger";
  readonly title: string;
  readonly description: string;
};

export function deriveBannerView(p: PublicVisibilityBannerProps): View {
  if (p.authGateState === "deleted") {
    return {
      tone: "danger",
      title: "アカウントは削除待ちです",
      description: "管理者の処理が完了するまで再ログインできません。",
    };
  }
  if (p.authGateState === "rules_declined") {
    return {
      tone: "warning",
      title: "規約の再同意が必要です",
      description: "最新の利用規約に同意するまで一部機能が制限されます。",
    };
  }
  switch (p.publishState) {
    case "public":
      return {
        tone: "success",
        title: "プロフィールは公開中です",
        description: "会員一覧に表示されます。",
      };
    case "member_only":
      return {
        tone: "info",
        title: "プロフィールは会員限定公開です",
        description: "ログインした会員にのみ表示されます。",
      };
    case "hidden":
      return {
        tone: "warning",
        title: "プロフィールは非公開です",
        description: "会員一覧には表示されません。",
      };
  }
}

export function PublicVisibilityBanner(props: PublicVisibilityBannerProps) {
  const v = deriveBannerView(props);
  return (
    <section
      data-region="public-visibility-banner"
      aria-label="公開状態の概要"
    >
      <Banner tone={v.tone} title={v.title}>
        {v.description}
      </Banner>
    </section>
  );
}
