"use client";
import { Avatar } from "../../../../components/ui/Avatar";
import { memberHue } from "../../../../lib/admin/member-hue";

export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  /** issue-983: 有れば写真を描画。無し / 読み込み失敗時は hue placeholder へ fallback。 */
  readonly photoUrl?: string | undefined;
  readonly size?: "sm" | "md" | "lg";
}

export function MemberAvatar({ memberId, fullName, photoUrl, size = "md" }: MemberAvatarProps) {
  const hue8 = memberHue(memberId);
  // Avatar supports numeric hue (0..360 → 12 buckets).
  // Spread our 0..7 evenly across the 0..330 range.
  const hue360 = Math.round((hue8 / 8) * 360);
  return (
    <Avatar memberId={memberId} name={fullName} hue={hue360} src={photoUrl} size={size} />
  );
}
