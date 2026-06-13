import Link from "next/link";
import { getTagTerm, TAG_MANAGEMENT_COPY } from "../../lib/admin/tagManagementGlossary";

export interface TagManagementGuideProps {
  readonly variant: "definition" | "assignment";
  readonly className?: string;
}

const term = (key: string): string => getTagTerm(key)?.label ?? key;

export function TagManagementGuide({ variant, className }: TagManagementGuideProps) {
  const isDefinition = variant === "definition";
  const title = isDefinition
    ? `${term("tag-definition")}と${term("tag-assignment")}の関係`
    : `${term("tag-assignment")}の進め方`;
  const body = isDefinition
    ? TAG_MANAGEMENT_COPY.definitionGuideBody
    : TAG_MANAGEMENT_COPY.assignmentGuideBody;
  const href = isDefinition ? "/admin/tags" : "/admin/tag-master";
  const linkLabel = isDefinition ? "タグ割当へ" : "タグ定義へ";

  return (
    <section
      aria-label="タグ管理ガイド"
      className={["ui-card card-pad-lg stack-sm", className].filter(Boolean).join(" ")}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="section-title">{title}</h2>
          <p className="muted">{body}</p>
        </div>
        <Link className="ui-button ui-button-ghost ui-button-md" href={href}>
          {linkLabel}
        </Link>
      </div>
      <dl className="tag-master-meta">
        <div>
          <dt>{term("tag-definition")}</dt>
          <dd>{getTagTerm("tag-definition")?.description}</dd>
        </div>
        <div>
          <dt>{term("tag-assignment")}</dt>
          <dd>{getTagTerm("tag-assignment")?.description}</dd>
        </div>
        <div>
          <dt>{term("tag-code")}</dt>
          <dd>{getTagTerm("tag-code")?.description}</dd>
        </div>
      </dl>
    </section>
  );
}
