// task-11: ul ベース grid layout。density=comfy / dense をサポート。
// Server Component。

import {
  MemberCard,
  type Density,
  type PublicMemberListItem,
} from "./MemberCard";

export interface MemberGridProps {
  items: PublicMemberListItem[];
  density: Density;
}

export function MemberGrid({ items, density }: MemberGridProps) {
  return (
    <ul data-component="member-grid" data-density={density}>
      {density === "list" ? (
        <li data-role="list-head" aria-hidden="true">
          <span />
          <span>氏名 / 職業</span>
          <span>区画 / ステータス</span>
          <span>所在地</span>
          <span />
        </li>
      ) : null}
      {items.map((m) => (
        <li key={m.memberId}>
          <MemberCard member={m} density={density} />
        </li>
      ))}
    </ul>
  );
}
