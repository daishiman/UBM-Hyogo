// workflow: mypage-prototype-alignment / Phase 5 / ST-1
// 役割: page-head（eyebrow / h1 / muted）+ btn-row（公開ページ / 情報を更新する CTA）。
// 不変条件 #2/#3: HEX 直書き禁止。色は tokens.css のクラス経由のみ。
// 不変条件 #7: memberId は session 由来を props で受け取り、path に直接埋めない。

import type { MeProfileStatusSummary } from "@/lib/api/me-types";
import { Icon } from "@/components/ui/Icon";
import { EditCta } from "./EditCta";

export interface ProfileHeaderProps {
  readonly memberId: string;
  readonly publishState: MeProfileStatusSummary["publishState"];
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
}

export function ProfileHeader({
  memberId,
  publishState,
  editResponseUrl,
  fallbackResponderUrl,
}: ProfileHeaderProps) {
  const isPublic = publishState === "public";
  const disabledTitle =
    publishState === "member_only"
      ? "会員限定公開のため、公開ページは表示されません。"
      : "現在は非公開のため、公開ページは表示されません。";

  return (
    <div className="page-head" data-region="profile-header">
      <div className="eyebrow">MY PROFILE</div>
      <h1 className="h-page">マイページ</h1>
      <p className="muted">
        公開情報と会員限定情報を確認・編集できます。
      </p>
      <div className="btn-row">
        {isPublic ? (
          <a
            href={`/members/${memberId}`}
            className="ui-button ui-button-ghost ui-button-md"
            data-cta="view-public-profile"
          >
            <span aria-hidden="true">
              <Icon name="external-link" />
            </span>
            公開ページを見る
          </a>
        ) : (
          <span
            aria-disabled="true"
            title={disabledTitle}
            className="ui-button ui-button-ghost ui-button-md"
            data-cta="view-public-profile-disabled"
          >
            <span aria-hidden="true">
              <Icon name="external-link" />
            </span>
            公開ページを見る
          </span>
        )}
        <EditCta
          editResponseUrl={editResponseUrl}
          fallbackResponderUrl={fallbackResponderUrl}
          variant="header"
        />
      </div>
    </div>
  );
}
