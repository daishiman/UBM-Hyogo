# Phase 5: 実装（TDD Green）

- task_id: `admin-dashboard-jp-clarity-and-card-ux`
- 実装区分: 実装仕様書（CONST_005 必須項目を充足）
- 前提: Phase 1（要件・AC-1..AC-10・inventory）/ Phase 2（glossary 完全コード・C1-C5 Before/After・トークン）/ Phase 3（設計レビュー PASS）/ Phase 4（テスト計画・TC-ID）

## 目的

Phase 4 で計画した TC（TC-GLO / TC-KPI / TC-SAC / TC-ZD-EYEBROW / TC-SD / TC-RAT）を **green** にするための実コード変更を、変更ファイルごとに「現行コードに一致した Before」と「適用後の After」で示す。
本 Phase は **TDD の Green フェーズ**であり、英語ラベル・技術用語の日本語化（C1/C2/C5）と「直近のアクション」「公開ステータス」の視覚情報設計の是正（C3/C4）を `apps/web` 表現層のみで完結させる。
`apps/api` / D1 schema / Google Form schema / endpoint surface / fetch URL は一切変更しない（AC-8・不変条件 #1 #5）。新規 CSS クラス・新規プリミティブは作らない（Tailwind utility + 既存 `.ui-card` のみ・`admin-meetings` の教訓）。

## 新規作成 / 修正ファイル一覧（[Feedback RT-03] 必須）

### 新規作成（5 ファイル）

| # | パス | 内容 | 担当 |
| --- | --- | --- | --- |
| N1 | `apps/web/src/lib/admin/dashboardGlossary.ts` | 用語 SSOT。KPI/action/targetType/status ラベル + fallback accessor（C5） | AC-6 |
| N2 | `apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts` | T1: glossary 純関数テスト | AC-6 |
| N3 | `apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx` | T2: KPI 日本語/uppercase テスト（既存 spec 更新） | AC-1 |
| N4 | `apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx` | T3: schema 語排除テスト | AC-2 |
| N5 | （ZoneDistribution は既存 spec へ TC 追加・新規ファイルなし） | — | — |

> Phase 4 の新規 4 spec のうち KpiGrid / SchemaAlertCard は新規ファイル、ZoneDistribution は既存 `__tests__/ZoneDistribution.spec.tsx` への TC 追記。本一覧では N2/N3/N4 を新規テストとして計上する（spec の実装は Phase 6）。

### 修正（8 ファイル）

| # | パス | 変更概要 | 担当 |
| --- | --- | --- | --- |
| E1 | `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 英語 label 4 箇所 → `DASHBOARD_KPI_LABELS` 参照（C1） | AC-1 |
| E2 | `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | label span の `uppercase tracking-wide` 撤廃（C1） | AC-1 |
| E3 | `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 「スキーマ/alias/schema」を平易日本語へ（C2） | AC-2 |
| E4 | `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | eyebrow `DISTRIBUTION`（2 箇所）→「会員分布」（C2） | AC-3 |
| E5 | `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | `<table>` → `<ul>` カードリスト・日本語化・truncate（C3） | AC-4 |
| E6 | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 600px 固定 SVG → 横バーリスト・LABEL を glossary 統一（C4） | AC-5 |
| E7 | `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | 横バーリスト構造・新 testid へ更新（Phase 6 で実装） | AC-9 |
| E8 | `apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx` | カードリスト構造・新 testid へ更新（Phase 6 で実装） | AC-9 |

> E7/E8 はテスト更新であり、実コード（spec）の編集は Phase 6 の TDD ステップで行う。本 Phase ではテスト契約（維持/更新する assertion）を Phase 4 表で確定済み。

## 入力・出力・副作用の定義

- `dashboardGlossary.ts`: 純関数のみ。入力 `string`（action code / targetType / targetId）→ 出力 `string`（日本語ラベル or fallback raw）。**副作用なし・例外を投げない**（[WEEKGRD-02]）。
- 各 `_dashboard` コンポーネント: **stateless presentational**。入力 = props（`totals` / `count` / `slices` / `items`）→ 出力 = DOM。**state machine・ロック変数・副作用なし**。依存方向は `page.tsx` → `toAdminDashboardUi`（lib） → 各コンポーネント → `dashboardGlossary`（末端 utility・循環依存なし）。

## 実装順序

依存方向（glossary → コンポーネント → テスト）に沿って実装する。glossary を先に置くことで、各コンポーネント修正時に参照先（`DASHBOARD_KPI_LABELS` / `describeAuditAction` 等）が既に存在する状態を作る。

| 手順 | 対象 | 変更概要 | ステップ後の検証 |
| --- | --- | --- | --- |
| ① | `dashboardGlossary.ts`（N1・C5） | SSOT 新規作成 | `pnpm typecheck` / TC-GLO |
| ② | `KpiGrid.tsx` / `KpiCard.tsx`（E1/E2・C1） | 日本語 label / uppercase 撤廃 | TC-KPI |
| ③ | `SchemaAlertCard.tsx` / `ZoneDistribution.tsx`（E3/E4・C2） | 用語平易化 / eyebrow 日本語 | TC-SAC / TC-ZD-EYEBROW |
| ④ | `RecentActionsTable.tsx`（E5・C3） | カード型リスト再設計 | TC-RAT |
| ⑤ | `StatusDistribution.tsx`（E6・C4） | 横バーリスト再設計 | TC-SD |
| ⑥ | テスト（N2/N3/N4/E7/E8） | Phase 6 で実装・更新 | focused vitest 全 PASS |

## 各ファイルの変更内容

### 手順① N1: dashboardGlossary.ts（新規・C5・AC-6）

パス: `apps/web/src/lib/admin/dashboardGlossary.ts`（既存 `admin-dashboard-ui.ts` と同階層）。Phase 2 §C5 のコードを逐語で配置する。

```ts
// admin-dashboard-jp-clarity: ダッシュボードの日本語ラベル SSOT。
// API 契約（action code / targetType / status）は不変。表示変換のみここに集約する。

/** KPI 4 枚の日本語ラベル。KpiGrid から参照する。 */
export const DASHBOARD_KPI_LABELS = {
  totalMembers: "会員総数",
  publicMembers: "サイト公開中",
  untaggedMembers: "タグ未設定",
  unresolvedSchema: "要対応のフォーム項目",
} as const;

/** 公開ステータスの日本語ラベル。StatusDistribution から参照する。 */
export const MEMBER_STATUS_LABELS: Record<"public" | "member_only" | "hidden", string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "admin.member.status_updated": "会員の公開状態を変更",
  "member.status_updated": "会員の公開状態を変更",
  "admin.member.deleted": "会員を削除",
  "member.deleted": "会員を削除",
  "member.note.created": "会員メモを追加",
  "admin.meeting.created": "開催回を作成",
  "attendance.add": "出席を記録",
  "attendance.import.add": "出席を一括取り込み",
  "attendance.remove": "出席を取り消し",
  "admin.tag.created": "タグを作成",
  "admin.tag.updated": "タグを更新",
  "tag.queue.resolved": "タグ付けキューを解決",
  "admin.tag.queue_resolved": "タグ付けキューを解決",
  "admin.tag.queue_dlq_moved": "タグ付けキューを保留へ移動",
};

/** audit action code を日本語へ。未登録は raw コードをそのまま返す（情報を握り潰さない）。 */
export function describeAuditAction(code: string): string {
  return AUDIT_ACTION_LABELS[code] ?? code;
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  member: "会員",
  meeting: "開催回",
  tag: "タグ",
  admin_member_note: "会員メモ",
  schema: "フォーム項目",
};

/** targetType を日本語へ。未登録は raw 値をそのまま返す。 */
export function describeTargetType(type: string): string {
  return TARGET_TYPE_LABELS[type] ?? type;
}

/** 対象の表示文字列。targetId は呼び出し側で truncation する。 */
export function describeTarget(targetType: string, targetId: string | null): string {
  const label = describeTargetType(targetType);
  return targetId ? `${label} ${targetId}` : label;
}
```

> 検証: `mise exec -- pnpm typecheck` → TC-GLO-01..13 が green。`?? code` / `?? type` の fallback により未登録入力でも throw せず原入力を返す（TC-GLO-04/05/08）。

### 手順② E1: KpiGrid.tsx（編集・C1・AC-1）

`label` の英語直書き 4 箇所を `DASHBOARD_KPI_LABELS` 参照に置換し、import を追加する。

Before（現行 L1-3 / L16-29）:

```tsx
// task-15: KPI 4 枚を grid-4 で配置
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { KpiCard } from "./KpiCard";
// …
      <KpiCard label="Total members" value={totals.totalMembers} testId="admin-kpi-card-total" />
      <KpiCard label="Public on site" value={totals.publicMembers} testId="admin-kpi-card-public" />
      <KpiCard
        label="Untagged"
        value={totals.untaggedMembers}
        tone={totals.untaggedMembers > 0 ? "warning" : "neutral"}
        testId="admin-kpi-card-untagged"
      />
      <KpiCard
        label="Schema issues"
        value={totals.unresolvedSchema}
        tone={totals.unresolvedSchema > 0 ? "danger" : "success"}
        testId="admin-kpi-card-schema"
      />
```

After（import 追加 + label を glossary 参照へ。`value` / `tone` / `testId` は不変）:

```tsx
// task-15: KPI 4 枚を grid-4 で配置
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import { DASHBOARD_KPI_LABELS } from "../../../../lib/admin/dashboardGlossary";
import { KpiCard } from "./KpiCard";
// …
      <KpiCard label={DASHBOARD_KPI_LABELS.totalMembers} value={totals.totalMembers} testId="admin-kpi-card-total" />
      <KpiCard label={DASHBOARD_KPI_LABELS.publicMembers} value={totals.publicMembers} testId="admin-kpi-card-public" />
      <KpiCard
        label={DASHBOARD_KPI_LABELS.untaggedMembers}
        value={totals.untaggedMembers}
        tone={totals.untaggedMembers > 0 ? "warning" : "neutral"}
        testId="admin-kpi-card-untagged"
      />
      <KpiCard
        label={DASHBOARD_KPI_LABELS.unresolvedSchema}
        value={totals.unresolvedSchema}
        tone={totals.unresolvedSchema > 0 ? "danger" : "success"}
        testId="admin-kpi-card-schema"
      />
```

> import パスは `_dashboard/KpiGrid.tsx`（深さ 4）から `lib/admin/` への相対で `../../../../lib/admin/dashboardGlossary`（既存の同階層 import `../../../../lib/admin/admin-dashboard-ui` と同じ深さ）。
> 検証: TC-KPI-01（日本語 4 種）/ TC-KPI-02（英語不在）/ TC-KPI-04（testid 4 枚）/ TC-KPI-05（tone・toLocaleString）が green。

### 手順② E2: KpiCard.tsx（編集・C1・AC-1）

label span の `uppercase tracking-wide` を撤廃する（日本語ラベルに全大文字装飾は不要）。

Before（現行 L27）:

```tsx
      <span className="text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">{label}</span>
```

After（`uppercase tracking-wide` を削除し `font-medium` に置換）:

```tsx
      <span className="text-xs font-medium text-[var(--ubm-color-text-muted)]">{label}</span>
```

> 変更は label span の className のみ。`tone` トークン（`TONE_CLASS`）・`value.toLocaleString("ja-JP")`・`hint` 描画・`testId`・DOM 構造は不変。
> 検証: TC-KPI-03（`/\buppercase\b/` 不一致）が green。

### 手順③ E3: SchemaAlertCard.tsx（編集・C2・AC-2）

非エンジニア向けに「スキーマ」「alias」「schema」を排除する。リンク先 `/admin/schema` と `role="alert"` / トークン色（`--ubm-color-warn`）は維持。

Before（現行 L16-28）:

```tsx
        <strong className="block text-sm font-semibold text-[var(--ubm-color-warn)]">
          スキーマ未解決: {count} 件
        </strong>
        <p className="text-xs text-[var(--ubm-color-text-secondary)]">
          alias の確定が必要なフォーム項目があります。
        </p>
      </div>
      <Link
        href="/admin/schema"
        className="text-sm font-medium text-[var(--ubm-color-warn)] hover:underline"
      >
        schema 管理を開く →
      </Link>
```

After（3 箇所の文言のみ平易日本語へ）:

```tsx
        <strong className="block text-sm font-semibold text-[var(--ubm-color-warn)]">
          要対応のフォーム項目: {count} 件
        </strong>
        <p className="text-xs text-[var(--ubm-color-text-secondary)]">
          フォームの設問と、会員データの保存先との対応づけが必要です。
        </p>
      </div>
      <Link
        href="/admin/schema"
        className="text-sm font-medium text-[var(--ubm-color-warn)] hover:underline"
      >
        フォーム項目の対応づけを開く →
      </Link>
```

> 変更は文言 3 箇所のみ。`if (count <= 0) return null;`（L9）・`role="alert"`・className（トークン色）・href は不変。
> 検証: TC-SAC-01（schema 語不在）/ TC-SAC-02（見出し）/ TC-SAC-03（対応づけ）/ TC-SAC-04（リンク・href・role）/ TC-SAC-05（count<=0 で null）/ TC-SAC-06（HEX 不在）が green。

### 手順③ E4: ZoneDistribution.tsx（編集・C2・AC-3）

eyebrow `DISTRIBUTION`（placeholder 分岐 L41 / 通常分岐 L66 の 2 箇所）を「会員分布」へ。aria-label（`zone 別人数 全 N 件`）・`h-section`「UBM区画の分布」は不変。

Before（2 箇所とも同一）:

```tsx
            <div className="eyebrow text-xs uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
              DISTRIBUTION
            </div>
```

After（2 箇所とも）:

```tsx
            <div className="eyebrow text-xs uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
              会員分布
            </div>
```

> `eyebrow` の `uppercase` クラスは残すが、日本語に大文字小文字は無いため見た目に影響しない（globals.css の `.eyebrow { text-transform:uppercase }` も同様に無害）。className は変更しない。
> aria-label は既存 spec（`name: /zone 別人数/i`）が依存するため **変更しない**（AC-9）。
> 検証: TC-ZD-EYEBROW-01（会員分布）/ TC-ZD-EYEBROW-02（DISTRIBUTION 不在）/ TC-ZD-EYEBROW-03（placeholder も日本語）が green。既存 4 ケースは aria-label 不変のため破壊されない。

### 手順④ E5: RecentActionsTable.tsx（編集・C3・AC-4）

`<table>` 全体を `<ul>`/`<li>` のアクティビティリストへ置換する。ファイル名・export 名 `RecentActionsTable` は維持。`formatJstDateTime` import は維持。glossary（`describeAuditAction` / `describeTarget`）を追加 import する。

Before（現行 L1-4 の import / L26-60 の table 分岐）:

```tsx
// task-15: recentActions の DataTable（JST 表示）
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import Link from "next/link";
import { formatJstDateTime } from "../../../../lib/format/datetime";
// …
      {items.length === 0 ? (
        <p role="status" className="mt-3 text-sm text-[var(--ubm-color-text-muted)]">
          直近 7 日のアクションはありません
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">直近 7 日に発生した管理操作</caption>
          <thead>
            <tr className="border-b border-[var(--ubm-color-border-default)] text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
              <th scope="col" className="py-2 pr-3">日時 (JST)</th>
              <th scope="col" className="py-2 pr-3">実行者</th>
              <th scope="col" className="py-2 pr-3">アクション</th>
              <th scope="col" className="py-2">対象</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.auditId}
                className="border-b border-[var(--ubm-color-border-default)] last:border-b-0"
              >
                <td className="py-2 pr-3 text-[var(--ubm-color-text-secondary)]">
                  {formatJstDateTime(row.createdAt)}
                </td>
                <td className="py-2 pr-3 text-[var(--ubm-color-text-secondary)]">
                  {row.actorEmail ?? "—"}
                </td>
                <td className="py-2 pr-3 font-medium text-[var(--ubm-color-text-primary)]">
                  {row.action}
                </td>
                <td className="py-2 text-[var(--ubm-color-text-secondary)]">
                  {row.targetType}
                  {row.targetId ? `:${row.targetId}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
```

After（import に glossary 追加 + table を `<ul>` カードリストへ。header / empty は不変。Phase 2 §C3 の DOM を採用）:

```tsx
// task-15: recentActions のアクティビティリスト（JST 表示・日本語化）
import type { AdminDashboardView } from "@ubm-hyogo/shared";
import Link from "next/link";
import { describeAuditAction, describeTarget } from "../../../../lib/admin/dashboardGlossary";
import { formatJstDateTime } from "../../../../lib/format/datetime";
// …（header / empty placeholder は現行のまま維持）
      {items.length === 0 ? (
        <p role="status" className="mt-3 text-sm text-[var(--ubm-color-text-muted)]">
          直近 7 日のアクションはありません
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2" data-testid="recent-actions-list">
          {items.map((row) => (
            <li
              key={row.auditId}
              data-testid="recent-action-item"
              className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-bg)] p-3"
            >
              <p className="text-sm font-medium text-[var(--ubm-color-text-primary)]">
                {describeAuditAction(row.action)}
              </p>
              <p className="mt-1 text-xs text-[var(--ubm-color-text-secondary)]">
                {row.actorEmail ?? "—"}
                <span aria-hidden="true"> · </span>
                {formatJstDateTime(row.createdAt)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--ubm-color-text-muted)]">
                対象: {describeTarget(row.targetType, row.targetId)}
              </p>
            </li>
          ))}
        </ul>
      )}
```

> `<table>` / `<thead>` / `<tbody>` / `<caption>` / `<tr>` / `<td>` を全廃し `<ul>`/`<li>` 3 段カード（アクション主見出し → 実行者・日時メタ → 対象）へ置換。対象は `truncate`（`text-overflow:ellipsis`）でカード内に必ず収まる。
> `<header>`（`<h2>直近のアクション (7日)</h2>` + 監査ログリンク `/admin/audit`）と empty placeholder（`role="status"`）は **変更しない**（AC-9・TC-RAT-01/03）。
> トークン: `bg-[var(--ubm-color-bg)]`（カード地 `surface-panel` より一段沈めた面・grep 確認済みで `surface-subtle` は不在）、`rounded-[var(--ubm-radius-md)]`（実在）。HEX 直書きなし。
> 検証: TC-RAT-02（table 不在・list 5 件）/ TC-RAT-04（日本語アクション）/ TC-RAT-05（対象日本語）/ TC-RAT-06（truncate）/ TC-RAT-07（未登録 raw）/ TC-RAT-08（JST）/ TC-RAT-09/10（axe 0）が green。

### 手順⑤ E6: StatusDistribution.tsx（編集・C4・AC-5/AC-9）

600px 固定 SVG 縦棒グラフ（`VIEWBOX` / `computeBarLayout` の x/y/height レイアウト）を廃止し、ZoneDistribution と同型の横バーリストへ再設計する。`LABEL` は `MEMBER_STATUS_LABELS`（glossary）を正本にして二重定義を解消。`buildAriaLabel` は維持。`COLOR_VAR` / `STATUS_ORDER` は横バー fill に転用。export 名・ファイル名は維持。

主な変更点:

1. **import 追加**: `import { MEMBER_STATUS_LABELS } from "../../../../lib/admin/dashboardGlossary";`
2. **`LABEL` 定数を削除**し、参照箇所を `MEMBER_STATUS_LABELS` に置換（二重定義解消）。`COLOR_VAR` / `STATUS_ORDER` は維持。
3. **`VIEWBOX` 定数と縦棒レイアウト（x/y/height/barWidth/chartWidth）を削除**。`computeBarLayout` は「status / count / label / colorVar」のみ返す軽量版へ縮小（順序は `STATUS_ORDER`・`count = Math.max(0, slice.count)`）。
4. **`buildAriaLabel` は維持**（`computeBarLayout` の label/count から `公開ステータス分布: …` を生成・語順/区切り不変）。
5. **DOM を横バーリストへ**: `<svg viewBox="0 0 600 200">` を廃止し、`<ul role="img" aria-label={ariaLabel} data-testid="status-distribution-list">` + 各 `<li data-testid="status-bar" data-status=...>` 内に「ドット + ラベル + N名 + 横バー（`viewBox="0 0 100 8"`）」を描画。バー幅は `maxCount` 基準で `widthPct = total>0 ? min(100, count/maxCount*100) : 0`。

Phase 2 §C4 の DOM（render 部）を採用:

```tsx
// import: MEMBER_STATUS_LABELS（glossary）/ COLOR_VAR / STATUS_ORDER を維持
// computeBarLayout は { status, count, label: MEMBER_STATUS_LABELS[status], colorVar } を STATUS_ORDER 順で返す軽量版
// buildAriaLabel は維持（`公開ステータス分布: ${items.join(", ")}`）

  const ariaLabel = buildAriaLabel(slices);
  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  const total = bars.reduce((sum, b) => sum + b.count, 0);

  return (
    <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">公開ステータス</h2>
      <ul className="mt-3 space-y-3" role="img" aria-label={ariaLabel} data-testid="status-distribution-list">
        {bars.map((s) => {
          const widthPct = total > 0 ? Math.min(100, (s.count / maxCount) * 100) : 0;
          return (
            <li key={s.status} data-testid="status-bar" data-status={s.status}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs text-[var(--ubm-color-text-primary)]">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: s.colorVar }} />
                  {s.label}
                </span>
                <span className="tabular-nums text-xs text-[var(--ubm-color-text-primary)]">{s.count}名</span>
              </div>
              <svg
                className="mt-1 h-2 w-full overflow-hidden rounded fill-[var(--ubm-color-bg)]"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <rect width="100" height="8" rx="4" />
                <rect width={widthPct} height="8" rx="4" fill={s.colorVar} />
              </svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
```

> placeholder 分岐（`!slices || bars.length === 0`）の `role="status"`「分布データは現在集計対象外です」は **不変**（TC-SD-01/02）。
> aria-label は `<svg>` から `<ul role="img">` へ付与先のみ移すが、`buildAriaLabel` の文字列は不変（TC-SD-03/09/10・AC-9）。
> testid は `status-distribution-chart` → `status-distribution-list`（TC-SD-03）。`status-bar` は維持（TC-SD-04）。
> トークン: バー fill = `COLOR_VAR`（`var(--ubm-color-ok|info|warn)`）、track = `fill-[var(--ubm-color-bg)]`、dot = `style={{ background: s.colorVar }}`（CSS 変数参照のため HEX に該当しない）。`旧 TONE`（pill 用）は横バーで使わないため削除可（chip pill 廃止）。HEX 直書きなし（TC-SD-08）。
> 600px 固定 SVG（`viewBox="0 0 600 200"`）は完全廃止（TC-SD-05）。バー幅はカウント比例（TC-SD-07）。
> 検証: TC-SD-01..10 が green。

### 手順⑥ テスト（N2/N3/N4/E7/E8）

Phase 6 で Phase 4 の TC を実テストとして追加・更新する。本 Phase ではテスト契約（Phase 4 表）を確定済み。

## ローカル実行・検証コマンド

worktree 直後は事前に `mise exec -- pnpm install` / `mise exec -- pnpm verify:vitest-runtime` を 1 回実施する。

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# focused vitest（glossary + _dashboard + RecentActionsTable）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/dashboardGlossary.spec.ts \
  apps/web/src/features/admin/components/_dashboard \
  apps/web/src/features/admin/components/__tests__/RecentActionsTable.spec.tsx

# トークン gate（HEX 直書き検出）
mise exec -- pnpm verify:tokens

# API 非変更（空であること）
git diff --name-only -- apps/api | grep . && echo "[FAIL: apps/api changed]" || echo "[PASS: apps/api untouched]"
```

> 注: `git diff --name-only -- apps/api` は検証のための **read-only** な確認であり、本タスクで `apps/api` を編集しないことの gate（AC-8）。
> `verify:tokens` は HEX 直書きを検出する。新規・編集コードは `var(--ubm-color-*)` 経由のみのため PASS（AC-7）。

## トークン・CSS 方針（確定）

- 色は OKLch トークンのみ。HEX 直書き禁止。`bg-[var(--ubm-color-bg)]`（`surface-subtle` は tokens.css に不在のため `bg` を採用）、`rounded-[var(--ubm-radius-md)]`（実在）を使用。
- 新規 CSS クラス・新規プリミティブを作らない。Tailwind utility + 既存 `.ui-card` のみで構成する（未定義クラスによる視覚崩壊を防ぐ・`admin-meetings-card-ux-clarity` の教訓）。
- StatusDistribution の横バーは ZoneDistribution の既存バー表現（`<svg viewBox="0 0 100 8">` + track rect + 進捗 rect）と同型にし、ダッシュボード内の視覚言語を統一する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 設計正本（glossary 完全コード・C1-C5 Before/After・トークン） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-2-design.md` | 実装の正本 |
| テスト計画（TC-ID・維持/更新 assertion） | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-4-test-plan.md` | green 化対象 TC |
| 要件・inventory・AC | `docs/30-workflows/completed-tasks/admin-dashboard-jp-clarity-and-card-ux/phase-1-requirements.md` | AC-1..AC-10 / action code 実値 |
| glossary 配置先（同階層） | `apps/web/src/lib/admin/admin-dashboard-ui.ts` | `StatusSlice` 型・配置基準 |
| 既存 glossary パターン | `apps/web/src/lib/admin/`（`schemaGlossary.ts` / `schemaHistoryGlossary.ts`） | 命名・accessor パターン |
| JST 整形 | `apps/web/src/lib/format/datetime.ts` | `formatJstDateTime`（import 維持） |
| vitest 設定 | `vitest.config.ts`（ルート） | focused 実行の `--config` 指定先 |

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し、既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件（`var(--ubm-color-*)` 経由のみ） |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/lib/admin/dashboardGlossary.ts` | 新規 | 用語 SSOT（KPI/action/targetType/status + fallback accessor）（C5・AC-6） |
| `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 編集 | 英語 label 4 箇所 → `DASHBOARD_KPI_LABELS`（C1・AC-1） |
| `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | 編集 | label span の `uppercase tracking-wide` 撤廃（C1・AC-1） |
| `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 編集 | 「スキーマ/alias/schema」を平易日本語へ（C2・AC-2） |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | 編集 | eyebrow `DISTRIBUTION`（2 箇所）→「会員分布」（C2・AC-3） |
| `apps/web/src/features/admin/components/_dashboard/RecentActionsTable.tsx` | 編集 | `<table>` → `<ul>` カードリスト・日本語化・truncate（C3・AC-4） |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | 編集 | 600px 固定 SVG → 横バーリスト・LABEL を glossary 統一（C4・AC-5/AC-9） |
| テスト 5 本（N2/N3/N4/E7/E8） | 新規/更新 | Phase 6 で実装（glossary / KpiGrid / SchemaAlertCard 新規・StatusDistribution / RecentActionsTable 更新） |

## 統合テスト連携

- Phase 6 で各 spec（`dashboardGlossary.spec.ts` / `KpiGrid.spec.tsx` / `SchemaAlertCard.spec.tsx` / `ZoneDistribution.spec.tsx`（TC 追記）/ `StatusDistribution.spec.tsx`（更新）/ `RecentActionsTable.spec.tsx`（更新））を実コードとして追加・更新し、本 Phase の実装が green であることを機械確認する。
- Phase 7 で本 Phase の変更ファイル（glossary lib / 5 コンポーネント）の branch/line カバレッジを測定する。CSS は jsdom 非カバレッジのため Phase 11 視覚で担保する。
- Phase 9 QA で `verify:tokens`・`git diff --name-only -- apps/api` が空（AC-8）を再実行する。
- Phase 11（user-gated）で AC-1（KPI 日本語）/ AC-4（カードリストの対象 truncation）/ AC-5（横バーのコンパクト化）を staging 実機スクリーンショットで視覚確認する。

## 完了条件

- [ ] 新規 5（glossary + テスト 4）/ 編集 8 のファイル一覧を確定した（[Feedback RT-03]）。
- [ ] 実装順序（① glossary → ② KpiGrid/KpiCard → ③ SchemaAlertCard/ZoneDistribution → ④ RecentActionsTable → ⑤ StatusDistribution → ⑥ テスト）を確定した。
- [ ] 各ファイルの Before/After を import 文・置換箇所まで明記した（glossary 完全コードは Phase 2 から転記）。
- [ ] KpiCard.tsx:27 の `uppercase tracking-wide` 撤廃の具体 diff を示した。
- [ ] StatusDistribution の縦棒 SVG（VIEWBOX/computeBarLayout）→ 横バーリスト化、LABEL の `MEMBER_STATUS_LABELS` 統一、`buildAriaLabel` 維持を明記した。
- [ ] RecentActionsTable の `<table>` → `<ul>` 置換、`formatJstDateTime` import 維持を明記した。
- [ ] 各コンポーネントが stateless・props 入力・DOM 出力・副作用なし、glossary が純関数・例外なしであることを明記した。
- [ ] ローカル検証コマンド（typecheck / lint / verify:tokens / focused vitest / `git diff --name-only -- apps/api` が空）を確定した。
- [ ] トークンは `--ubm-color-bg`（surface-subtle 不在）・`--ubm-radius-md` を使用し、新規 CSS クラス・新規プリミティブを作らない方針を確定した。
