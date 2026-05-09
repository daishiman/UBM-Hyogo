// task-11: ul ベース grid layout。density=comfy / dense をサポート。
// Server Component。

import {
  MemberCard,
  type Density,
  type PublicMemberListItem,
} from "./MemberCard";

export interface MemberGridProps {
  items: PublicMemberListItem[];
  density: Exclude<Density, "list">;
}

export function MemberGrid({ items, density }: MemberGridProps) {
  return (
    <ul data-component="member-grid" data-density={density}>
      {items.map((m) => (
        <li key={m.memberId}>
          <MemberCard member={m} density={density} />
        </li>
      ))}
    </ul>
  );
}
