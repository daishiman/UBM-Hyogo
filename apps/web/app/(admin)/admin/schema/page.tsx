import Link from "next/link";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import {
  AdminSectionErrorClient,
  AdminStat,
} from "../../../../src/features/admin/components/_shared";
import { AdminPageHeader } from "../../../../src/features/admin/components/_layout/AdminPageHeader";
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import { SchemaReviewGuide } from "../../../../src/components/admin/SchemaReviewGuide";
import { SchemaPurposeExplainer } from "../../../../src/components/admin/SchemaPurposeExplainer";
import { describeSchemaStat } from "../../../../src/components/admin/schemaGlossary";
import type {
  DiffType,
  SchemaDiffItem,
  SchemaDiffListView,
} from "../../../../src/components/admin/SchemaDiffPanel";
import { Chip } from "../../../../src/components/ui";
import { formatJstDate } from "../../../../src/lib/format/datetime";

export const dynamic = "force-dynamic";

type FullDiff = SchemaDiffListView & {
  hash?: string | null;
  capturedAt?: string | null;
};

const countByType = (items: ReadonlyArray<SchemaDiffItem>, type: DiffType) =>
  items.filter((item) => item.type === type).length;

function CurrentRevisionCard({ diff }: { readonly diff: FullDiff }) {
  const capturedAt = formatJstDate(diff.capturedAt ?? diff.items[0]?.createdAt);

  return (
    <section className="ui-card card-pad-lg" aria-labelledby="schema-current-revision-h">
      <div className="row-between">
        <div>
          <div className="eyebrow">現在のフォーム構成</div>
          <div className="row">
            <h2 id="schema-current-revision-h" className="h-section">
              最新版
            </h2>
            <span className="chip-row">
              <Chip tone="green">適用中</Chip>
            </span>
          </div>
          <p className="muted">
            いま会員サイトに反映されているフォームの構成です。設問の変化はこの構成を基準に確認します。
          </p>
          {capturedAt ? <p className="muted">（取得: {capturedAt}）</p> : null}
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
  const unresolvedStat = describeSchemaStat("unresolved");
  const addedStat = describeSchemaStat("added");
  const changedStat = describeSchemaStat("changed");
  const removedStat = describeSchemaStat("removed");

  return (
    <section className="grid-4" aria-label="schema diff summary">
      <AdminStat
        label={unresolvedStat.label}
        value={unresolved}
        hint={unresolvedStat.hint}
        tone={unresolved > 0 ? "warning" : "positive"}
      />
      <AdminStat
        label={addedStat.label}
        value={countByType(items, "added")}
        hint={addedStat.hint}
        tone="positive"
      />
      <AdminStat
        label={changedStat.label}
        value={countByType(items, "changed")}
        hint={changedStat.hint}
        tone="warning"
      />
      <AdminStat
        label={removedStat.label}
        value={countByType(items, "removed")}
        hint={removedStat.hint}
        tone="critical"
      />
    </section>
  );
}

function RevisionAndAliasHistory({ diff }: { readonly diff: FullDiff }) {
  const aliases = diff.resolvedAliases ?? [];

  return (
    <div className="grid-2" data-region="schema-revision-alias-history">
      <section className="ui-card card-pad-lg" aria-labelledby="schema-revisions-h">
        <div className="eyebrow">フォーム構成の履歴</div>
        <h2 id="schema-revisions-h" className="h-section">
          フォーム構成の履歴
        </h2>
        <p className="muted">
          取り込んだフォーム構成の版です。どの版の差分を確認しているかを示します。
        </p>
        <div className="stack-sm">
          <div className="schema-field-card">
            <div>
              <div className="row">
                <span>最新版</span>
                <span className="chip-row">
                  <Chip tone="green">適用中</Chip>
                </span>
              </div>
              <p className="muted">{diff.total} 件の変更点</p>
            </div>
            <Link className="ui-button ui-button-ghost" href="/admin/schema/history">
              開く
            </Link>
          </div>
        </div>
      </section>

      <section className="ui-card card-pad-lg" aria-labelledby="schema-alias-history-h">
        <div className="eyebrow">対応づけの記録</div>
        <h2 id="schema-alias-history-h" className="h-section">
          対応づけ履歴
        </h2>
        <p className="muted">誰がいつ、どの設問をどの項目キーへ対応づけたかの記録です。</p>
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
    <section
      className="flex flex-col gap-4"
      aria-labelledby="schema-form-h"
      data-page="admin-schema"
    >
      <AdminPageHeader
        eyebrow="管理 / フォーム項目"
        title="フォーム項目の対応づけ"
        description="Googleフォームの設問が増減・変更されたとき、新しい設問に項目名をつけて、過去の回答とのつながりを保つ作業をします。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "フォーム項目" }]}
        headingId="schema-form-h"
        actions={
          <Link
            href="/admin/schema/history"
            className="text-sm text-[var(--ubm-color-link-default)] underline-offset-2 hover:underline"
          >
            対応づけ履歴を見る
          </Link>
        }
      />
      <SchemaPurposeExplainer />
      {result.ok ? (
        <>
          <SchemaReviewGuide />
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
    </section>
  );
}

export type { SchemaDiffItem, SchemaDiffListView };
