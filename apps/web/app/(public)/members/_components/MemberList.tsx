// Server Component. density に応じた layout 切替のみ担当。
import {
  MemberCard,
  type Density,
  type PublicMemberListItem,
} from "../../../../src/components/public/MemberCard";

export interface MemberListProps {
  items: PublicMemberListItem[];
  density: Density;
}

export function MemberList({ items, density }: MemberListProps) {
  return (
    <ul data-component="member-list" data-density={density}>
      {items.map((m) => (
        <li key={m.memberId}>
          <MemberCard member={m} density={density} />
        </li>
      ))}
    </ul>
  );
}
