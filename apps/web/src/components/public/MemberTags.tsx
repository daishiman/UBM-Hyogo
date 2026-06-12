// task-12: 公開会員詳細の tag chip 群
// Lane B: SectionCard でラップ。
import { Badge } from "../ui/Badge";
import { SectionCard } from "../ui/layout/SectionCard";

export interface MemberTagsProps {
  tags: ReadonlyArray<{ code: string; label: string; category: string }>;
}

export function MemberTags({ tags }: MemberTagsProps) {
  return (
    <SectionCard as="section" data-component="member-tags" className="tags-root" title="タグ">
      {tags.length === 0 ? (
        <p data-role="empty-tags">タグ未設定</p>
      ) : (
        <ul className="tags-list" role="list">
          {tags.map((t) => (
            <li key={t.code}>
              <Badge data-component="tag-pill" tone="default" outline>
                {t.label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
