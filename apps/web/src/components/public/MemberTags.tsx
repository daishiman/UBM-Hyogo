// task-12: 公開会員詳細の tag chip 群
import { Badge } from "../ui/Badge";

export interface MemberTagsProps {
  tags: ReadonlyArray<{ code: string; label: string; category: string }>;
}

export function MemberTags({ tags }: MemberTagsProps) {
  if (tags.length === 0) return null;
  return (
    <section data-component="member-tags" className="tags-root">
      <h2 className="tags-title">タグ</h2>
      <ul className="tags-list" role="list">
        {tags.map((t) => (
          <li key={t.code}>
            <Badge tone="default" outline>
              {t.label}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
