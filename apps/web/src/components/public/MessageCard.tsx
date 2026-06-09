import { STABLE_KEY } from "@ubm-hyogo/shared";

export interface MessageCardProps {
  message: string;
}

export function MessageCard({ message }: MessageCardProps) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  return (
    <section
      data-component="member-message"
      className="card-flat card-pad-lg stack-sm accent-soft"
    >
      <p className="eyebrow">MESSAGE</p>
      <h2 className="h-section">メッセージ</h2>
      <blockquote
        className="serif"
        data-stable-key={STABLE_KEY.selfIntroduction}
      >
        <p>{trimmed}</p>
      </blockquote>
    </section>
  );
}
