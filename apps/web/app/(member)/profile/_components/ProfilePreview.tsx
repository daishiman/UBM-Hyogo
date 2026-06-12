// workflow: mypage-prototype-alignment / Phase 5 / ST-3
// Lane C: SectionCard(hero-split) へ移行（AC-4）。
// 不変条件: HEX 直書き禁止。aria-label / data-region は I-7 保全。

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { SectionCard } from "@/components/ui/layout";

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
    <SectionCard
      aria-label="プロフィールプレビュー"
      data-region="profile-preview"
      className="hero-split"
      padding="lg"
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
    </SectionCard>
  );
}
