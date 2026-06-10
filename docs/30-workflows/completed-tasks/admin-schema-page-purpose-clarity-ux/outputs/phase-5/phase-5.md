# Phase 5 — 実装手順

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) §5/§6 を実装トポロジの正本とする。
> 確定コピーは [Phase 4 §4.7](../phase-4/phase-4.md#47-確定日本語コピーテストと実装の単一正本) を単一正本として参照する（本 Phase はそれを実体化する）。
> 後続実装者がそのまま着手できる粒度（関数シグネチャ・差分方針・実コピー文言・行番号）で記述する。

## 5.0 canUseTool 適用範囲 / SDK 該当性

- **N/A**: 本タスクは Claude Agent SDK・IPC Bridge・canUseTool 等を一切使わない純表示 UI 改善。SDK ツール承認・preload API・safeInvoke 等は該当しない。

## 5.1 新規作成 / 編集ファイル一覧（FB RT-03・SSOT §6）

| # | パス | 種別 | レーン | 変更概要 |
| --- | --- | --- | --- | --- |
| 1 | `apps/web/src/components/admin/schemaGlossary.ts` | 新規 | A | 用語・流れ・diff type・統計・アウトカムの純データ/純関数 SSOT |
| 2 | `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | 新規 | A | 常時表示の目的説明カード（静的・server component 可） |
| 3 | `apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts` | 新規(test) | A | Phase 4 §4.2 |
| 4 | `apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx` | 新規(test) | A | Phase 4 §4.3 |
| 5 | `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | A,C | header description / explainer 挿入 / 統計 label・hint / 履歴見出し |
| 6 | `apps/web/app/(admin)/admin/schema/page.spec.tsx` | 編集(test) | A,C | Phase 4 §4.5 |
| 7 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | B | **表示文言追加のみ**（カテゴリ説明 / アウトカム / 平易ステータス / 0件集約コピー） |
| 8 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 編集(test) | B | Phase 4 §4.4（既存維持 + 追加） |
| 9 | `apps/web/src/styles/globals.css` | 編集 | C | `.schema-purpose-card` 系クラス（OKLch のみ） |

> `apps/api/**` / `apps/api/migrations/**` / `packages/shared/**` / Google Form 定義は **変更しない**（AC-7。`git diff --stat -- apps/api packages/shared` が空であることを検証）。

---

## 5.2 `schemaGlossary.ts`（新規・Lane A）

Phase 2 §2.3 の公開 API を実体化する。`satisfies` でコンパイル時網羅を担保。副作用・例外なし。未知キーは防御的に既定値を返す（WEEKGRD-02）。文言は Phase 4 §4.7 の逐語。

```ts
// apps/web/src/components/admin/schemaGlossary.ts
// Lane A: /admin/schema の用語言い換え・流れ・diff type メタの単一正本（純データ/純関数）。
// 不変条件: API/D1/Form 非接触。Lane B(SchemaDiffPanel)/Lane C(page) は本モジュールを import して使う（重複定義禁止）。

export interface GlossaryTerm {
  /** やさしい日本語の主表記 */
  readonly plainLabel: string;
  /** 併記する技術名（mono 表記想定。なければ undefined） */
  readonly technicalName?: string;
  /** 1〜2文の説明 */
  readonly description: string;
}

export type GlossaryKey = "stableKey" | "resolve" | "revision" | "diff" | "backfill";

export const SCHEMA_GLOSSARY = {
  stableKey: {
    plainLabel: "項目キー",
    technicalName: "stableKey",
    description: "会員データの保存先となる列名。フォームの設問が変わっても変わりません。",
  },
  resolve: {
    plainLabel: "対応づけ",
    technicalName: "resolve",
    description: "設問を項目キーへ結びつける操作です。",
  },
  revision: {
    plainLabel: "フォーム版数",
    technicalName: "revision",
    description: "取り込んだフォームのバージョンです。",
  },
  diff: {
    plainLabel: "差分",
    technicalName: "diff",
    description: "フォームとデータベースの食い違いです。",
  },
  backfill: {
    plainLabel: "再インデックス",
    technicalName: "backfill",
    description: "対応づけ後、過去の回答を新しい項目キーで並べ直す処理です。",
  },
} satisfies Record<GlossaryKey, GlossaryTerm>;

export interface FlowStep {
  readonly index: number;
  readonly title: string;
  readonly detail: string;
}

export const SCHEMA_FLOW_STEPS: readonly FlowStep[] = [
  {
    index: 1,
    title: "変更を検知する",
    detail: "Googleフォームの設問が追加・変更・削除されると差分として表示されます。",
  },
  {
    index: 2,
    title: "項目を対応づける",
    detail: "設問を会員データの保存先（項目キー）へ結びつけます。",
  },
  {
    index: 3,
    title: "会員データへ反映する",
    detail: "対応づけ後、会員の回答が正しい項目に整理されて表示されます。",
  },
];

export const SCHEMA_OUTCOME_SUMMARY =
  "会員の回答が、会員一覧・会員詳細・マイページに正しく表示されるようになります。";

export const SCHEMA_PURPOSE_HEADING = "このページでできること";
export const SCHEMA_PURPOSE_LEAD =
  "フォームの設問が変わったとき、会員の回答を正しい保存先へ結びつけるためのページです。";

export type DiffTypeKey = "added" | "changed" | "removed" | "unresolved";

interface DiffTypeDescription {
  readonly label: string;
  readonly meaning: string;
  readonly action: string;
}

const DIFF_TYPE_DESCRIPTIONS = {
  added: {
    label: "追加",
    meaning: "新しく増えた設問です。",
    action: "項目キーへ対応づけてください。",
  },
  changed: {
    label: "変更",
    meaning: "文言や種類が変わった設問です。",
    action: "内容を確認して対応づけ直してください。",
  },
  removed: {
    label: "削除",
    meaning: "フォームから無くなった設問です。",
    action: "不要なら対応づけを外せます。",
  },
  unresolved: {
    label: "未対応",
    meaning: "まだ項目キーへ対応づいていない設問です。",
    action: "クリックして対応づけます。",
  },
} satisfies Record<DiffTypeKey, DiffTypeDescription>;

const DIFF_TYPE_FALLBACK: DiffTypeDescription = {
  label: "差分",
  meaning: "フォームとデータベースの食い違いです。",
  action: "内容を確認してください。",
};

/** diff type → 平易説明 + 推奨アクション。未知キーは防御的に既定値（throw しない）。 */
export function describeDiffType(type: DiffTypeKey): DiffTypeDescription {
  return DIFF_TYPE_DESCRIPTIONS[type] ?? DIFF_TYPE_FALLBACK;
}

export type StatKey = "unresolved" | "added" | "changed" | "removed";

interface StatDescription {
  readonly label: string;
  readonly hint: string;
}

const STAT_DESCRIPTIONS = {
  unresolved: { label: "未対応", hint: "対応づけ待ち。クリックして対応づけます" },
  added: { label: "追加", hint: "新しく増えた設問" },
  changed: { label: "変更", hint: "文言や種類が変わった設問" },
  removed: { label: "削除", hint: "フォームから無くなった設問" },
} satisfies Record<StatKey, StatDescription>;

const STAT_FALLBACK: StatDescription = { label: "差分", hint: "内容を確認してください" };

/** 統計キー → 平易 label / hint（次アクション示唆）。未知キーは防御的に既定値。 */
export function describeStat(key: StatKey): StatDescription {
  return STAT_DESCRIPTIONS[key] ?? STAT_FALLBACK;
}

/** 割り当て実行時のアウトカム説明（箇条書き行）。 */
export const ASSIGN_OUTCOME_POINTS: readonly string[] = [
  "この設問の回答が、会員一覧・会員詳細・マイページに表示されるようになります。",
  "対応づけ後、過去の回答が新しい項目キーで並べ直されます（再インデックス）。",
  "割り当て直後の5分以内なら取り消せます。",
];

/** 全ペイン 0 件時の良い状態コピー。 */
export const SCHEMA_DIFF_ALL_CLEAR =
  "差分はありません。フォームとデータベースが一致した良い状態です。";
```

- 防御メモ: `??` フォールバックは型上は到達不能（`satisfies Record<...>` で網羅）だが、ランタイムで型外文字列を渡されても throw しないため Phase 4 §4.2 の防御テストが Green になる。

---

## 5.3 `SchemaPurposeExplainer.tsx`（新規・Lane A）

状態・API なし → server component で可（`"use client"` を付けない）。既存 `.ui-card` プリミティブ＋ Lane C 新規 CSS クラスで構成。a11y: `<section aria-labelledby>` + 見出し id、流れ図は `<ol>`、用語集は `<dl>`。`data-region` をテスト/視覚特定用に付与。

```tsx
// apps/web/src/components/admin/SchemaPurposeExplainer.tsx
// Lane A: /admin/schema の目的説明カード（常時表示・静的）。
// 状態/API なし → server component。新規プリミティブは作らず .ui-card + .schema-* クラスで構成。
import {
  SCHEMA_FLOW_STEPS,
  SCHEMA_GLOSSARY,
  SCHEMA_OUTCOME_SUMMARY,
  SCHEMA_PURPOSE_HEADING,
  SCHEMA_PURPOSE_LEAD,
  type GlossaryKey,
} from "./schemaGlossary";

const GLOSSARY_ORDER: readonly GlossaryKey[] = ["stableKey", "resolve", "revision"];

export function SchemaPurposeExplainer() {
  return (
    <section
      className="ui-card card-pad-lg schema-purpose-card"
      aria-labelledby="schema-purpose-h"
      data-region="schema-purpose-explainer"
    >
      <div className="eyebrow">ABOUT THIS PAGE</div>
      <h2 id="schema-purpose-h" className="h-section">
        {SCHEMA_PURPOSE_HEADING}
      </h2>
      <p className="muted">{SCHEMA_PURPOSE_LEAD}</p>

      <ol className="schema-flow-steps" data-region="schema-flow-steps">
        {SCHEMA_FLOW_STEPS.map((step) => (
          <li key={step.index} className="schema-flow-step">
            <span className="schema-flow-step__index" aria-hidden="true">
              {step.index}
            </span>
            <div>
              <p className="schema-flow-step__title">{step.title}</p>
              <p className="schema-flow-step__detail muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="schema-purpose-outcome">{SCHEMA_OUTCOME_SUMMARY}</p>

      <dl className="schema-glossary" data-region="schema-glossary">
        {GLOSSARY_ORDER.map((key) => {
          const term = SCHEMA_GLOSSARY[key];
          return (
            <div key={key} className="schema-glossary__row">
              <dt>
                {term.plainLabel}
                {term.technicalName ? (
                  <code className="mono schema-glossary__tech">{term.technicalName}</code>
                ) : null}
              </dt>
              <dd className="muted">{term.description}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
```

- 用語集は流れ図と区別するため `<dl>`（list role を持たない）で実装 → Phase 4 §4.3 の「流れ図 list は 3 件」検証が `data-region="schema-flow-steps"` 配下の `<ol>` で一意になる。
- 流れ図の矢印（`.schema-flow-arrow`）は CSS の `::after` で装飾的に表現する（DOM テキストに矢印を入れずアクセシビリティ上のノイズを避ける。SSOT §5 Lane C のクラスを利用）。

---

## 5.4 `page.tsx`（編集・Lane A,C）

> 表示文言・挿入のみ。`safeServerFetch` / レンダリング条件分岐 / データフローは変更しない。

### 5.4.1 import 追加（先頭付近）

**Before**（L8-14）:
```tsx
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type {
  DiffType,
  SchemaDiffItem,
  SchemaDiffListView,
} from "../../../../src/components/admin/SchemaDiffPanel";
import { Chip } from "../../../../src/components/ui";
```

**After**（直後に2 import 追加）:
```tsx
import { SchemaDiffPanel } from "../../../../src/components/admin/SchemaDiffPanel";
import type {
  DiffType,
  SchemaDiffItem,
  SchemaDiffListView,
} from "../../../../src/components/admin/SchemaDiffPanel";
import { SchemaPurposeExplainer } from "../../../../src/components/admin/SchemaPurposeExplainer";
import { describeStat } from "../../../../src/components/admin/schemaGlossary";
import { Chip } from "../../../../src/components/ui";
```

### 5.4.2 統計 label / hint 平易化（Lane C）

**Before**（L58-79 `SchemaDiffStatsGrid`）:
```tsx
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
```

**After**（`describeStat` で label/hint を平易化。tone・value・countByType は不変）:
```tsx
function SchemaDiffStatsGrid({ items }: { readonly items: ReadonlyArray<SchemaDiffItem> }) {
  const unresolved = countByType(items, "unresolved");
  const statU = describeStat("unresolved");
  const statA = describeStat("added");
  const statC = describeStat("changed");
  const statR = describeStat("removed");

  return (
    <section className="grid-4" aria-label="schema diff summary">
      <AdminStat
        label={statU.label}
        value={unresolved}
        hint={statU.hint}
        tone={unresolved > 0 ? "warning" : "positive"}
      />
      <AdminStat label={statA.label} value={countByType(items, "added")} hint={statA.hint} tone="positive" />
      <AdminStat
        label={statC.label}
        value={countByType(items, "changed")}
        hint={statC.hint}
        tone="warning"
      />
      <AdminStat label={statR.label} value={countByType(items, "removed")} hint={statR.hint} tone="critical" />
    </section>
  );
}
```

### 5.4.3 履歴見出し平易化（Lane C）

**Before**（L110-114 `RevisionAndAliasHistory` の ALIAS HISTORY セクション冒頭）:
```tsx
      <section className="ui-card card-pad-lg" aria-labelledby="schema-alias-history-h">
        <div className="eyebrow">ALIAS HISTORY</div>
        <h2 id="schema-alias-history-h" className="h-section">
          紐付け履歴
        </h2>
```

**After**（主見出しを「対応づけ履歴」へ。技術名は eyebrow に維持。説明文 1 行を追加）:
```tsx
      <section className="ui-card card-pad-lg" aria-labelledby="schema-alias-history-h">
        <div className="eyebrow">ALIAS HISTORY</div>
        <h2 id="schema-alias-history-h" className="h-section">
          対応づけ履歴
        </h2>
        <p className="muted">誰がいつどの設問をどの項目キーへ対応づけたかの記録です。</p>
```

> `CurrentRevisionCard` の「フォームの現在の版数」補足（SSOT §5 Lane C）は任意。最小差分を優先するなら、上記説明文と同様に `<p className="muted">フォームの現在の版数です。</p>` を L44-46 の hash 行近傍に追加してよい（AC には含まれないため必須ではない）。

### 5.4.4 header description 更新 + explainer 挿入（Lane A）

**Before**（L139-153 + L154-159 描画）:
```tsx
      <AdminPageHeader
        eyebrow="ADMIN / SCHEMA"
        title="スキーマ差分のレビュー"
        description="Googleフォームの設問変更を照合し、stableKey の割り当てと履歴確認を行います。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "Form schema" }]}
        headingId="schema-form-h"
        actions={
          <Link
            href="/admin/schema/history"
            className="text-sm text-[var(--ubm-color-link-default)] underline-offset-2 hover:underline"
          >
            resolve 履歴を見る
          </Link>
        }
      />
      {result.ok ? (
```

**After**（description 更新 + AdminPageHeader 直下に `<SchemaPurposeExplainer />` を常時描画。`result.ok` 条件の**外**に置くことで差分0件・fetch 失敗時も表示＝AskUser「常時表示」）:
```tsx
      <AdminPageHeader
        eyebrow="ADMIN / SCHEMA"
        title="スキーマ差分のレビュー"
        description="フォームの設問変更を会員データの保存先へ結びつけ、回答が正しく表示される状態を保ちます。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "Form schema" }]}
        headingId="schema-form-h"
        actions={
          <Link
            href="/admin/schema/history"
            className="text-sm text-[var(--ubm-color-link-default)] underline-offset-2 hover:underline"
          >
            resolve 履歴を見る
          </Link>
        }
      />
      <SchemaPurposeExplainer />
      {result.ok ? (
```

> 挿入位置は `AdminPageHeader` の閉じタグ直後・`{result.ok ? (` の直前。これにより成功/エラー両分岐で常時表示される（AC-1）。

---

## 5.5 `SchemaDiffPanel.tsx`（編集・Lane B）

> **【最重要】表示文言の追加のみ。handler / fetch / state / useAdminMutation / postSchemaAlias 呼び出し / bulk / rollback / recompute / undo のロジックは一切変更しない。** 既存の `onSubmit` / `onSelect` / `grouped` / `active` / `feedback` / 各 mutation・各 hook はそのまま。追加するのは JSX 内の静的説明テキストと、`active` 経由で出る form 内の補助文のみ。既存テスト（Phase 4 §4.4 の回帰群）が無改変で Green を保つことを着地条件とする。

### 5.5.1 import 追加（L26-30 schemaAliasValidation import 付近の直後）

**After**（既存 import 群の末尾に追加）:
```tsx
import {
  describeDiffType,
  ASSIGN_OUTCOME_POINTS,
  SCHEMA_DIFF_ALL_CLEAR,
  type DiffTypeKey,
} from "./schemaGlossary";
```

> `DiffType`（既存・L40）と `DiffTypeKey`（schemaGlossary・同一 union）は値が一致する。`describeDiffType(t as DiffTypeKey)` は型整合（同じ4 union）。冗長 import を避けるため、`DiffType` を `describeDiffType` に渡す際の型は互換。

### 5.5.2 各 diff type グループ説明（カテゴリ見出し直下）

**Before**（L878-879 グループ見出し）:
```tsx
          <div key={t} aria-labelledby={`pane-${t}`}>
            <h2 id={`pane-${t}`}>{TYPE_LABELS[t]}</h2>
```

**After**（見出し直下に meaning / action の 1 行説明を追加。`describeDiffType` 利用。ロジック不変）:
```tsx
          <div key={t} aria-labelledby={`pane-${t}`}>
            <h2 id={`pane-${t}`}>{TYPE_LABELS[t]}</h2>
            <p className="muted schema-type-meaning" data-role="diff-type-meaning">
              {describeDiffType(t).meaning}
            </p>
            <p className="muted schema-type-action" data-role="diff-type-action">
              {describeDiffType(t).action}
            </p>
```

> `t` は `DiffType`（既存 union）。`describeDiffType` の引数型 `DiffTypeKey` と同一 union なので追加キャスト不要。`TYPE_LABELS[t]`（既存 "追加"/"変更"/"削除"/"未解決"）は変更しない（既存テスト維持）。

### 5.5.3 平易ステータス併記（行内ステータス）

**Before**（L933 既存ステータス表示）:
```tsx
                      <p className="muted">{STATUS_LABELS[it.status]}</p>
```

**After**（既存 `STATUS_LABELS` 表示を維持しつつ、queued の行に平易補足を別要素で併記。既存 `getAllByText("未解決")` を増やさないため別語「対応づけ待ち」を使う）:
```tsx
                      <p className="muted">{STATUS_LABELS[it.status]}</p>
                      {it.status === "queued" ? (
                        <p className="muted schema-status-plain" data-role="diff-status-plain">
                          対応づけ待ち
                        </p>
                      ) : null}
```

> 「未解決」という文字列を新規に増やさない（既存テスト `getAllByText("未解決")` の件数を不変に保つ）。平易補足は別語「対応づけ待ち」を別 `<p>` で出す。

### 5.5.4 割り当てフォームのアウトカム説明（form 内・`active` 経由）

**Before**（L944-971 割り当て form。冒頭付近）:
```tsx
      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <p>questionId: <code>{active.questionId}</code></p>
          <FormField name="schema-stableKey" label="新しい stableKey" required>
```

**After**（`<h3>` と `<p>questionId>` の間に、アウトカム説明 list を追加。form/onSubmit/FormField/Input/ボタン等の既存要素は無改変）:
```tsx
      {active && active.questionId && (
        <form onSubmit={onSubmit} aria-label="stableKey alias 割当">
          <h3>{active.label}</h3>
          <div className="schema-assign-outcome" data-role="assign-outcome">
            <p className="muted">この設問を対応づけると：</p>
            <ul>
              {ASSIGN_OUTCOME_POINTS.map((point) => (
                <li key={point} className="muted">
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <p>questionId: <code>{active.questionId}</code></p>
          <FormField name="schema-stableKey" label="新しい stableKey" required>
```

> form の `aria-label`・`onSubmit`・「割当」「閉じる」ボタン・input ラベル「新しい stableKey」を一切変えない（Phase 4 §4.4 の既存操作テストが無改変で通る）。アウトカム list は補助テキストとして挿入するのみ。

### 5.5.5 0件集約コピー（全ペイン 0 件時）

**Before**（L868 `schema-grid` 開始の直前）:
```tsx
      <div className="schema-grid">
        {TYPES.map((t) => {
```

**After**（schema-grid の直前に、全件0のときだけ出る集約コピーを追加。各ペインの EmptyState「なし」は変更しない＝既存 empty テスト維持）:
```tsx
      {initial.items.length === 0 && (
        <p className="muted schema-diff-all-clear" data-role="schema-diff-all-clear">
          {SCHEMA_DIFF_ALL_CLEAR}
        </p>
      )}
      <div className="schema-grid">
        {TYPES.map((t) => {
```

> `initial.items.length === 0` は既存 prop の純導出（state 追加なし）。各ペイン内の `<EmptyState title="なし" .../>`（L881）は無改変 → 既存テスト「`なし` ちょうど4件」を壊さない。

---

## 5.6 `globals.css`（編集・Lane C・OKLch のみ）

既存 `.schema-grid` / `.schema-field-card`（L1425 付近）の近傍に新規クラスを追加。**HEX / `bg-[#xxx]` / `text-[#xxx]` 禁止**。`--ubm-color-*` / `--ubm-space-*` / `--ubm-radius-*` トークンのみ使用（実在トークン: `--ubm-color-surface-panel` / `--ubm-color-border-default` / `--ubm-color-accent-soft` / `--ubm-color-text-secondary` / `--ubm-space-2..4` / `--ubm-radius-sm/md`）。

```css
/* Lane C: SchemaPurposeExplainer 目的説明カード（OKLch トークンのみ・新規 HEX 0） */
.schema-purpose-card {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-3);
}

.schema-flow-steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ubm-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.schema-flow-step {
  display: flex;
  align-items: flex-start;
  gap: var(--ubm-space-2);
  flex: 1 1 14rem;
  padding: var(--ubm-space-3);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-md);
  background: var(--ubm-color-surface-panel);
  position: relative;
}

/* ステップ間の矢印（装飾。DOM テキストに矢印を入れない） */
.schema-flow-step:not(:last-child)::after {
  content: "→";
  position: absolute;
  right: calc(var(--ubm-space-3) * -1);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ubm-color-text-secondary);
}

.schema-flow-step__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  border-radius: var(--ubm-radius-sm);
  background: var(--ubm-color-accent-soft);
  color: var(--ubm-color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.schema-flow-step__title {
  margin: 0;
  font-weight: 600;
}

.schema-flow-step__detail {
  margin: var(--ubm-space-1) 0 0;
}

.schema-purpose-outcome {
  margin: 0;
  padding: var(--ubm-space-2) var(--ubm-space-3);
  border-radius: var(--ubm-radius-sm);
  background: var(--ubm-color-accent-soft);
}

.schema-glossary {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-2);
  margin: 0;
}

.schema-glossary__row {
  display: flex;
  flex-direction: column;
  gap: calc(var(--ubm-space-1));
}

.schema-glossary__tech {
  margin-left: var(--ubm-space-2);
}
```

> `--ubm-space-1` の実在は globals.css L243（`padding: var(--ubm-space-1) var(--ubm-space-2)`）で確認済み。矢印は flex-wrap で折り返した行末では視覚的にずれうるが、装飾要素なので機能・テストに影響しない（必要なら `@media (max-width)` で非表示化可。最小実装では維持）。

---

## 5.7 テストファイル（Lane A/B/C）

- 新規: `schemaGlossary.spec.ts` / `SchemaPurposeExplainer.component.spec.tsx` を Phase 4 §4.2/§4.3 のケース表どおり作成。
- 編集: `SchemaDiffPanel.component.spec.tsx`（§4.4 の追加 it）/ `page.spec.tsx`（§4.5 の追加 it + 履歴見出し「対応づけ履歴」・統計 label 平易化に伴う既存アサーション更新）。
- 既存操作系の無改変を守る（§4.4/§4.5 の制約）。

---

## 5.8 不変条件チェック（実装時セルフレビュー）

| 項目 | 確認方法 |
| --- | --- |
| `process.env.*` 直接参照なし | 本変更は env を一切触らない（純表示）。`getEnv()` 系も不要 |
| OKLch トークンのみ・新規 HEX 0 | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens`。`#` / `bg-[#` / `text-[#` を新規追加しない（既存 `text-[var(--ubm-color-link-default)]` は CSS var 参照で許容） |
| test は `*.spec.*` のみ | 新規/編集 test は `*.spec.ts` / `*.component.spec.tsx` / `page.spec.tsx`。`*.test.*` 禁止 |
| API / D1 / Form 非接触 | `git diff --stat -- apps/api packages/shared` が空。`SchemaDiffPanel` の API 呼び出し・mutation 不変 |
| 新規プリミティブを生やさない | `SchemaPurposeExplainer` は `.ui-card` + `.schema-*` で構成。`ui/` 配下に新規プリミティブ追加なし |
| `useAdminMutation` 本体不変 | `features/admin/hooks/useAdminMutation` を import するのみ・改変なし |

### 検証コマンド（SSOT §7）

```bash
# focused vitest
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
# 型・lint・トークン
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# API 非接触
git diff --stat -- apps/api packages/shared | wc -l   # 0 を期待
```

---

## 完了条件

- [x] 新規/編集ファイルパス一覧（種別・レーン付き・SSOT §6 準拠）
- [x] `schemaGlossary.ts` の完全な型・定数・関数骨格（`satisfies` 網羅・実コピー確定）
- [x] `SchemaPurposeExplainer.tsx` の JSX 骨格（`.ui-card` + 新規 CSS / `data-region` / a11y）
- [x] `page.tsx` の行番号付き Before→After（header / explainer 挿入 / 統計 label・hint / 履歴見出し）
- [x] `SchemaDiffPanel.tsx` の「表示追加のみ・ロジック不変」強調 + 行番号付き Before→After + import 配線
- [x] `globals.css` の OKLch クラス追加（HEX 0）
- [x] canUseTool/SDK = N/A 明記
- [x] 不変条件チェック（env / OKLch / *.spec / API 非接触 / プリミティブ）
