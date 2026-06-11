# Phase 2: 設計

- task_id: `admin-dashboard-jp-clarity-and-card-ux`

## 目的

Phase 1 で確定した AC-1..AC-10 を満たす、`apps/web` 表現層の具体設計（glossary SSOT のコード、各コンポーネントの Before/After、トークン、状態所有権）を固定し、Phase 5 実装が迷わず行える粒度にする。

## 設計方針

1. **用語は SSOT 化**: ラベルを各コンポーネントに直書きせず、新規 `dashboardGlossary.ts` に集約する（既存 `schemaGlossary.ts` / `schemaHistoryGlossary.ts` のパターンを踏襲）。
2. **API 契約は不変**: `recentActions` / `StatusSlice` の shape は触らない。日本語化は UI 表現層の glossary 変換のみ。
3. **色は OKLch トークンのみ**: 新規 HEX 直書き禁止。既存 `--ubm-color-*` 変数のみ使用。
4. **CSS 実体欠如の罠を回避**: 新規 BEM クラスを増やさず、Tailwind utility + 既存 `.ui-card` のみで構成する（未定義クラスによる視覚崩壊を防ぐ。`admin-meetings-card-ux-clarity` の教訓）。
5. **既存テスト契約を維持**: StatusDistribution の `aria-label="公開ステータス分布: …"` と HEX 禁止 assertion、RecentActionsTable の `/admin/audit` リンク・axe 0 違反は維持し、構造系 assertion のみ更新する。
6. **コンポーネント名は維持**: `RecentActionsTable` / `StatusDistribution` の export 名・ファイル名を維持（`apps/web/src/features/admin/components/index.ts` の barrel と `page.tsx` の import を壊さない）。内部 DOM のみ再設計する。

## 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 再利用 | 対象 |
| --- | --- |
| 再利用する | `.ui-card`（globals.css:594）/ KpiCard の tone トークン構造 / ZoneDistribution の横バー（`<svg viewBox="0 0 100 8">` + 進捗 rect）パターン |
| 新規 | `dashboardGlossary.ts`（SSOT）のみ。新規プリミティブ・新規 CSS クラスは作らない |

公開ステータスの横バーは ZoneDistribution の既存バー表現（`apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx:102-110`）と同型にし、視覚言語をダッシュボード内で統一する。

## C5: dashboardGlossary.ts（新規 SSOT）

パス: `apps/web/src/lib/admin/dashboardGlossary.ts`

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

### 入出力・副作用

- 純関数のみ。副作用なし・例外を投げない（[WEEKGRD-02]）。
- 入力: `string`（action code / targetType / targetId）。出力: `string`（日本語ラベル or fallback raw）。

## C1: KpiGrid.tsx / KpiCard.tsx（KPI 日本語化）

### KpiGrid.tsx（編集）

`label` を英語直書きから `DASHBOARD_KPI_LABELS` 参照へ置換する。

```tsx
import { DASHBOARD_KPI_LABELS } from "../../../../lib/admin/dashboardGlossary";
// ...
<KpiCard label={DASHBOARD_KPI_LABELS.totalMembers} value={totals.totalMembers} testId="admin-kpi-card-total" />
<KpiCard label={DASHBOARD_KPI_LABELS.publicMembers} value={totals.publicMembers} testId="admin-kpi-card-public" />
<KpiCard label={DASHBOARD_KPI_LABELS.untaggedMembers} value={totals.untaggedMembers}
  tone={totals.untaggedMembers > 0 ? "warning" : "neutral"} testId="admin-kpi-card-untagged" />
<KpiCard label={DASHBOARD_KPI_LABELS.unresolvedSchema} value={totals.unresolvedSchema}
  tone={totals.unresolvedSchema > 0 ? "danger" : "success"} testId="admin-kpi-card-schema" />
```

### KpiCard.tsx（編集）

label 行の `uppercase` を撤廃（日本語ラベルに全大文字は不要）。`tracking-wide` も削除し、`text-xs text-[var(--ubm-color-text-muted)]` のみに。tone トークン・数値フォーマット（`toLocaleString("ja-JP")`）は維持。

```tsx
// Before: className="text-xs uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
// After:  className="text-xs font-medium text-[var(--ubm-color-text-muted)]"
```

## C2: SchemaAlertCard.tsx / ZoneDistribution.tsx（用語平易化）

### SchemaAlertCard.tsx（編集）

非エンジニア向けに「スキーマ」「alias」「schema」を排除する。

| 箇所 | Before | After |
| --- | --- | --- |
| 見出し（:17） | `スキーマ未解決: {count} 件` | `要対応のフォーム項目: {count} 件` |
| 説明（:19） | `alias の確定が必要なフォーム項目があります。` | `フォームの設問と、会員データの保存先との対応づけが必要です。` |
| リンク（:27） | `schema 管理を開く →` | `フォーム項目の対応づけを開く →` |

リンク先 `/admin/schema` と `role="alert"` / トークン色（`--ubm-color-warn`）は維持。

### ZoneDistribution.tsx（編集）

eyebrow `DISTRIBUTION`（2 箇所: :41 placeholder 分岐 / :66 通常分岐）を日本語へ。

| Before | After |
| --- | --- |
| `DISTRIBUTION`（英語大文字） | `会員分布` |

`.eyebrow` クラスは `text-transform:uppercase`（globals.css:2137）だが、日本語には影響しない（日本語に大文字小文字は無い）。`h-section` の「UBM区画の分布」は維持。

## C3: RecentActionsTable.tsx（カード型アクティビティリスト再設計）

`<table>` を廃止し、`<ul>`/`<li>` のアクティビティリストへ再設計する。ファイル名・export 名 `RecentActionsTable` は維持。

### 新 DOM 構造

```tsx
import { describeAuditAction, describeTarget } from "../../../../lib/admin/dashboardGlossary";
// header（既存維持）: <h2>直近のアクション (7日)</h2> + 監査ログリンク
// empty（既存維持）: role="status" の placeholder

<ul className="mt-3 flex flex-col gap-2" data-testid="recent-actions-list">
  {items.map((row) => (
    <li
      key={row.auditId}
      data-testid="recent-action-item"
      className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-bg)] p-3"
    >
      {/* 主見出し: 日本語アクション名 */}
      <p className="text-sm font-medium text-[var(--ubm-color-text-primary)]">
        {describeAuditAction(row.action)}
      </p>
      {/* メタ: 実行者 · 日時（JST） */}
      <p className="mt-1 text-xs text-[var(--ubm-color-text-secondary)]">
        {row.actorEmail ?? "—"}
        <span aria-hidden="true"> · </span>
        {formatJstDateTime(row.createdAt)}
      </p>
      {/* 対象: ラベル日本語化 + ID truncation でカード内に収める */}
      <p className="mt-0.5 truncate text-xs text-[var(--ubm-color-text-muted)]">
        対象: {describeTarget(row.targetType, row.targetId)}
      </p>
    </li>
  ))}
</ul>
```

### 設計判断

- **テーブル廃止理由**: 4 列固定 table は対象列（`member:MEM-...`）が伸びてカード幅を超える。1 件 = 1 カード行にすることで、対象は `truncate`（`text-overflow:ellipsis`）でカード内に必ず収まる。
- **情報階層**: 「何をしたか（アクション）」を主見出し、「誰が・いつ」をメタ、「対象」を補足の 3 段にする（Apple HIG の情報優先順位）。
- **アクセシビリティ**: empty 時の `role="status"` 維持。`監査ログを開く →` リンク（`/admin/audit`）維持。`actorEmail` の `· ` 区切りは `aria-hidden`。
- **トークン（確定）**: tokens.css を grep 確認した結果 `--ubm-color-surface-subtle` は**存在しない**。`--ubm-color-bg`（カード地 `surface-panel` より一段沈めた面・ZoneDistribution のバー track と同変数）を使う。`--ubm-radius-md` は実在。

## C4: StatusDistribution.tsx（コンパクト横バーリスト再設計）

600px 固定 SVG 縦棒グラフを廃止し、ZoneDistribution と同型の横バーリストへ再設計する。

### 新 DOM 構造

```tsx
// LABEL / TONE / COLOR_VAR / STATUS_ORDER は維持（COLOR_VAR は横バー fill に転用）
// MEMBER_STATUS_LABELS（glossary）を LABEL の正本にして二重定義を避ける

<section className="ui-card ...">
  <h2 className="text-sm font-semibold ...">公開ステータス</h2>
  <ul className="mt-3 space-y-3" role="img" aria-label={ariaLabel} data-testid="status-distribution-list">
    {bars.map((s) => {
      const widthPct = total > 0 ? Math.min(100, (s.count / maxCount) * 100) : 0;
      return (
        <li key={s.status} data-testid="status-bar" data-status={s.status}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs">
              <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: s.colorVar }} />
              {s.label}
            </span>
            <span className="tabular-nums text-xs text-[var(--ubm-color-text-primary)]">{s.count}名</span>
          </div>
          <svg className="mt-1 h-2 w-full overflow-hidden rounded fill-[var(--ubm-color-bg)]"
               viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
            <rect width="100" height="8" rx="4" />
            <rect width={widthPct} height="8" rx="4" fill={s.colorVar} />
          </svg>
        </li>
      );
    })}
  </ul>
</section>
```

### aria-label 契約の維持（AC-9）

既存テスト `StatusDistribution.spec.tsx` は `aria-label="公開ステータス分布: 公開 12, 会員限定 8, 非公開 3"` を assert する。`buildAriaLabel` をそのまま維持し、`<svg>` ではなく `<ul role="img">` に付与する。`data-testid="status-distribution-chart"` は `data-testid="status-distribution-list"` に変わるため、spec を更新する（AC-9 / Phase 6）。

### トークン

- バー色は `COLOR_VAR`（`var(--ubm-color-ok|info|warn)`）を `fill` で使用。HEX 直書きなし → 既存テストの `not.toMatch(/#[0-9a-fA-F]{6}\b/)` を維持できる。
- `style={{ background: s.colorVar }}` の dot は CSS 変数参照のため HEX に該当しない。

## 状態所有権・依存関係

- 全コンポーネントは **stateless presentational**（props のみ）。state machine・ロック変数なし。
- 依存方向: `page.tsx` → `toAdminDashboardUi`（lib） → 各 `_dashboard` コンポーネント → `dashboardGlossary`（lib）。glossary は末端 utility で循環依存なし。
- `dashboardGlossary.ts` は `apps/web/src/lib/admin/` に配置（既存 `admin-dashboard-ui.ts` と同階層）。subpath 衝突なし。

## 統合テスト連携

- glossary（純関数）は単体テスト `dashboardGlossary.spec.ts` で fallback 含め検証。
- 各コンポーネントは focused vitest で構造（testid）・文言（日本語/技術語排除）・トークン（HEX 禁止）・aria 契約を検証。
- CSS 由来のレイアウト（truncation / 横バー幅 / はみ出し解消）は jsdom 非評価のため Phase 11 staging screenshot（実装後・user-gated）で担保。

## 成果物

- 本ファイル（設計）: dashboardGlossary.ts 完全コード、C1-C5 の Before/After、トークン確定（`--ubm-color-bg` 採用）、状態所有権・依存方向、既存テスト契約維持方針。

## 完了条件

- [ ] glossary の完全コードを確定した。
- [ ] C1-C4 の Before/After を全箇所明記した。
- [ ] 既存テスト契約（aria-label / HEX 禁止 / audit リンク / axe）の維持方針を明記した。
- [ ] 新規 CSS クラス・新規プリミティブを作らない方針を確定した。
- [x] tokens.css を grep 確認し、`surface-subtle` 不在 → `--ubm-color-bg` 採用を確定した。
