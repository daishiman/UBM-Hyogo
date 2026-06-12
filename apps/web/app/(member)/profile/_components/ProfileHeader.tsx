// workflow: mypage-prototype-alignment / Phase 5 / ST-1
// Lane C: PageHeader プリミティブへ移行。btn-row の <a> 直書きを ButtonLink へ統一（AC-3）。
// 不変条件 #2/#3: HEX 直書き禁止。色は tokens.css のクラス経由のみ。
// 不変条件 #7: memberId は session 由来を props で受け取り、path に直接埋めない。
// I-7: role / aria-label は既存テストが参照する値を維持する。

import type { MeProfileStatusSummary } from "@/lib/api/me-types";
import { Icon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { buttonVariants } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/layout";
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

  const actions = (
    <div className="btn-row">
      {isPublic ? (
        <ButtonLink
          href={`/members/${memberId}`}
          variant="ghost"
          size="md"
          leftIcon={<Icon name="external-link" />}
          data-cta="view-public-profile"
        >
          公開ページを見る
        </ButtonLink>
      ) : (
        <span
          aria-disabled="true"
          title={disabledTitle}
          className={buttonVariants({ variant: "ghost", size: "md" })}
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
  );

  return (
    <div data-region="profile-header">
      <PageHeader
        eyebrow="MY PROFILE"
        title="マイページ"
        lead="公開情報と会員限定情報を確認・編集できます。"
        actions={actions}
      />
    </div>
  );
}
