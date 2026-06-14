// Lane B: SectionCard(tone=accent) でラップ（メッセージグループ）。
import { STABLE_KEY } from "@ubm-hyogo/shared";

import { SectionCard } from "../ui/layout/SectionCard";

export interface MessageCardProps {
  message: string;
}

export function MessageCard({ message }: MessageCardProps) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  return (
    <SectionCard
      as="section"
      data-component="member-message"
      className="stack-sm accent-soft"
      tone="accent"
      title="メッセージ"
    >
      <p className="eyebrow">MESSAGE</p>
      <blockquote
        className="serif"
        data-stable-key={STABLE_KEY.selfIntroduction}
      >
        <p>{trimmed}</p>
      </blockquote>
    </SectionCard>
  );
}
