function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export interface AvatarProps {
  memberId?: string;
  name: string;
  hue?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ memberId, name, hue, size = "md", className }: AvatarProps) {
  const resolvedHue = hue ?? hashStringToHue(memberId ?? name);
  const initial = name.trim().charAt(0) || "?";
  // Invariants #6 and #8: hue is derived from memberId, never persisted.
  return (
    <div
      role="img"
      aria-label={name}
      data-size={size}
      className={className}
      style={{ background: `hsl(${resolvedHue} 70% 60%)` }}
    >
      {initial}
    </div>
  );
}
