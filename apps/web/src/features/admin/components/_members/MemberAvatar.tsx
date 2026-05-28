"use client";
import { Avatar } from "../../../../components/ui/Avatar";
import { memberHue } from "../../../../lib/admin/member-hue";

export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  readonly size?: "sm" | "md" | "lg";
}

export function MemberAvatar({ memberId, fullName, size = "md" }: MemberAvatarProps) {
  const hue8 = memberHue(memberId);
  // Avatar supports numeric hue (0..360 → 12 buckets).
  // Spread our 0..7 evenly across the 0..330 range.
  const hue360 = Math.round((hue8 / 8) * 360);
  return <Avatar memberId={memberId} name={fullName} hue={hue360} size={size} />;
}
