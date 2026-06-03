"use client";
import { Avatar } from "../../../../components/ui/Avatar";
import { memberHue } from "../../../../lib/admin/member-hue";

export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  /** issue-983: 有れば写真を描画。無し / 読み込み失敗時は hue placeholder へ fallback。 */
  readonly photoUrl?: string | undefined;
  /** issue-1030: thumb variant。sm/md では display より優先して帯域を節約する。 */
  readonly photoThumbUrl?: string | undefined;
  readonly size?: "sm" | "md" | "lg";
}

export function MemberAvatar({
  memberId,
  fullName,
  photoUrl,
  photoThumbUrl,
  size = "md",
}: MemberAvatarProps) {
  const hue8 = memberHue(memberId);
  // Avatar supports numeric hue (0..360 → 12 buckets).
  // Spread our 0..7 evenly across the 0..330 range.
  const hue360 = Math.round((hue8 / 8) * 360);
  // issue-1030: 小サイズ（sm/md）は thumb を優先し、無ければ display へ fallback。
  // lg は原寸を見せるため display(photoUrl) を使う。
  const src = size === "lg" ? photoUrl : (photoThumbUrl ?? photoUrl);
  return (
    <Avatar memberId={memberId} name={fullName} hue={hue360} src={src} size={size} />
  );
}
