import Link from "next/link";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import {
  AdminSectionErrorClient,
  AdminStat,
} from "../../../../src/features/admin/components/_shared";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type {
  DiffType,
  SchemaDiffItem,
  SchemaDiffListView,
} from "../../../../src/components/admin/SchemaDiffPanel";
import { Chip } from "../../../../src/components/ui";

export const dynamic = "force-dynamic";

type FullDiff = SchemaDiffListView & {
  hash?: string | null;
  capturedAt?: string | null;
};

const countByType = (items: ReadonlyArray<SchemaDiffItem>, type: DiffType) =>
  items.filter((item) => item.type === type).length;

function CurrentRevisionCard({ diff }: { readonly diff: FullDiff }) {
  const revisionId = diff.items[0]?.revisionId ?? "current";
  const hash = diff.hash ?? "schema-diff-queue";
  const capturedAt = diff.capturedAt ?? diff.items[0]?.createdAt ?? "latest local data";

  return (
    <section className="ui-card card-pad-lg" aria-labelledby="schema-current-revision-h">
      <div className="row-between">
        <div>
          <div className="eyebrow">CURRENT REVISION</div>
          <div className="row">
            <h2 id="schema-current-revision-h" className="h-section mono">
              {revisionId}
            </h2>
            <span className="chip-row">
              <Chip tone="green">active</Chip>
            </span>
          </div>
          <p className="muted mono">
            hash: {hash} · 取得: {capturedAt}
          </p>
        </div>
        <div className="btn-row">
          <Link className="ui-button ui-button-ghost" href="/admin/schema/history">
            バージョン履歴を開く
          </Link>
        </div>
      </div>
    </section>
  );
}

function SchemaDiffStatsGrid({ items }: { readonly items: ReadonlyArray<SchemaDiffItem> }) {
  const unresolved = countByType(items, "unresolved");

  return (
    <section className="grid-4" aria-label="schema diff summary">
      <AdminStat
        label="Unresolved"
        value={unresolved}
        hint="stableKey 未割当"
        tone={unresolved > 0 ? "warning" : "positive"}
      />
      <AdminStat label="Added" value={countByType(items, "added")} hint="新規設問" tone="positive" />
      <AdminStat
        label="Changed"
        value={countByType(items, "changed")}
        hint="文言や型の変更"
        tone="warning"
      />
      <AdminStat label="Removed" value={countByType(items, "removed")} hint="削除された設問" tone="critical" />
    </section>
  );
}

function RevisionAndAliasHistory({ diff }: { readonly diff: FullDiff }) {
  const revisionId = diff.items[0]?.revisionId ?? "current";
  const aliases = diff.resolvedAliases ?? [];

  return (
    <div className="grid-2" data-region="schema-revision-alias-history">
      <section className="ui-card card-pad-lg" aria-labelledby="schema-revisions-h">
        <div className="eyebrow">REVISIONS</div>
        <h2 id="schema-revisions-h" className="h-section">
          バージョン履歴
        </h2>
        <div className="stack-sm">
          <div className="schema-field-card">
            <div>
              <div className="row">
                <span className="mono">{revisionId}</span>
                <span className="chip-row">
                  <Chip tone="green">active</Chip>
                </span>
              </div>
              <p className="muted mono">{diff.total} diff items</p>
            </div>
            <Link className="ui-button ui-button-ghost" href="/admin/schema/history">
              開く
            </Link>
          </div>
        </div>
      </section>

      <section className="ui-card card-pad-lg" aria-labelledby="schema-alias-history-h">
        <div className="eyebrow">ALIAS HISTORY</div>
        <h2 id="schema-alias-history-h" className="h-section">
          紐付け履歴
        </h2>
        <div className="stack-sm">
          {aliases.length === 0 ? (
            <p className="muted">最近の紐付け履歴はありません。</p>
          ) : (
            aliases.slice(0, 10).map((alias) => (
              <div key={alias.id} className="card-flat">
                <div className="mono">{alias.stableKey}</div>
                <p className="muted mono">
                  {alias.aliasQuestionId} · {alias.resolvedAt} · {alias.resolvedBy}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default async function AdminSchemaPage() {
  const result = await safeServerFetch<FullDiff>("/admin/schema/diff");

  return (
    <div className="stack-lg" data-page="admin-schema">
      <Breadcrumb items={[{ label: "スキーマ" }]} />
      <header className="page-head">
        <div>
          <div className="eyebrow">ADMIN / SCHEMA</div>
          <h1 className="h-page">スキーマ差分のレビュー</h1>
          <p className="muted">
            Googleフォームの設問変更を照合し、stableKey の割り当てと履歴確認を行います。
          </p>
        </div>
      </header>

      {result.ok ? (
        <>
          <CurrentRevisionCard diff={result.data} />
          <SchemaDiffStatsGrid items={result.data.items} />
          <SchemaDiffPanel initial={result.data} hideInlineStats />
          <RevisionAndAliasHistory diff={result.data} />
        </>
      ) : (
        <AdminSectionErrorClient
          sectionLabel="Schema diff"
          code={result.error.code}
          message={result.error.message}
        />
      )}
    </div>
  );
}

export type { SchemaDiffItem, SchemaDiffListView };
