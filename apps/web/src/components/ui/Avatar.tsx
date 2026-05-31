"use client";
import { useState } from "react";

function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export interface AvatarProps {
  memberId?: string;
  name: string;
  hue?: number;
  /** issue-983: 有れば <img> を描画。読み込み失敗（onError）時は hue placeholder へ fallback。 */
  src?: string | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ memberId, name, hue, src, size = "md", className }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedHue = hue ?? hashStringToHue(memberId ?? name);
  const hueBucket = Math.round((((resolvedHue % 360) + 360) % 360) / 30) % 12;
  const initial = name.trim().charAt(0) || "?";
  // Invariants #6 and #8: hue is derived from memberId, never persisted.

  // issue-983: 写真有 かつ 読み込み成功時は <img> を描画する。
  if (src && !imgFailed) {
    return (
      <div
        role="img"
        aria-label={name}
        data-size={size}
        data-hue={hueBucket}
        className={["ui-avatar", "ui-avatar--photo", className].filter(Boolean).join(" ")}
      >
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className="ui-avatar__photo"
        />
      </div>
    );
  }

  // src なし / onError 後 → 従来の initial+hue div（AC-4: 現行 DOM と同一 → pixel diff ゼロ）。
  return (
    <div
      role="img"
      aria-label={name}
      data-size={size}
      data-hue={hueBucket}
      className={["ui-avatar", className].filter(Boolean).join(" ")}
    >
      {initial}
    </div>
  );
}
