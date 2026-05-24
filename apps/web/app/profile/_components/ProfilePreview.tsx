// workflow: mypage-prototype-alignment / Phase 5 / ST-3
// 役割: Avatar hero-split + displayName / subtitle / chips を描画する Server Component。
// 不変条件: 新規 primitive ゼロ（既存 Avatar / Chip / Card の合成のみ）。HEX 直書き禁止。

import { Avatar } from "../../../src/components/ui/Avatar";
import { Chip } from "../../../src/components/ui/Chip";

export interface ProfilePreviewChip {
  readonly label: string;
  readonly tone?: "stone";
}

export interface ProfilePreviewProps {
  readonly memberId: string;
  readonly displayName: string;
  readonly subtitle?: string;
  readonly chips?: ReadonlyArray<{ label: string; tone?: "neutral" }>;
}

export function ProfilePreview({
  memberId,
  displayName,
  subtitle,
  chips,
}: ProfilePreviewProps) {
  const name = displayName.length > 0 ? displayName : "会員";
  return (
    <section
      aria-label="プロフィールプレビュー"
      data-region="profile-preview"
      className="ui-card card-pad-lg hero-split"
    >
      <Avatar memberId={memberId} name={name} size="xl" />
      <div>
        <div className="eyebrow">PREVIEW</div>
        <h2 className="h-page">{name}</h2>
        {subtitle && subtitle.length > 0 ? (
          <p className="muted">{subtitle}</p>
        ) : null}
        {chips && chips.length > 0 ? (
          <div className="chip-row">
            {chips.map((c) => (
              <Chip key={c.label} tone="stone">
                {c.label}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
