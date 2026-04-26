function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export interface AvatarProps {
  memberId: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ memberId, name, size = "md" }: AvatarProps) {
  const hue = hashStringToHue(memberId);
  // Invariants #6 and #8: hue is derived from memberId, never persisted.
  return (
    <div
      role="img"
      aria-label={name}
      data-size={size}
      style={{ background: `hsl(${hue} 70% 60%)` }}
    />
  );
}
