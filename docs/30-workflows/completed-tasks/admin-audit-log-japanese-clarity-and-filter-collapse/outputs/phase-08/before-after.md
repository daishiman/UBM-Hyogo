# Phase 8 — リファクタリング Before/After（before-after.md）

> `対象 / Before / After / 理由 / 挙動不変の確認方法` の 5 列テーブル（[Feedback RT-03]）。

| # | 対象 | Before | After | 理由 | 挙動不変の確認方法 |
| --- | --- | --- | --- | --- | --- |
| 1 | `AuditLogPanel.tsx` / `AuditLogCard.tsx` のラベル直書き | `label="action"` / `label="actorEmail"` 等の英語キー名直書き、`<dt>auditId</dt>` | `label={describeAuditField("action")}` 等の helper 経由、`<dt>ログID</dt>` | 英語ラベルを glossary helper へ集約し、表示文言の正本を 1 箇所（`auditGlossary.ts`）に統一 | auditGlossary.spec / AuditLogPanel.spec で日本語 label 描画を再確認。TC 全 PASS |
| 2 | `AuditLogCard.tsx` の action / targetType 直表示 | `{item.action}`（h3 / Chip）/ `{item.targetType ?? "—"}` を変換なしで表示（3 箇所に変換ロジック散在の余地） | `{describeAuditAction(item.action)}` / `{describeAuditTargetType(item.targetType)}` | コード→日本語変換を helper に一元化し、Card / Panel / appliedFilters で変換ロジックを重複させない（duplicate 削減） | AuditLogCard.spec で登録済→日本語・未登録→fallback（TC-E-03/04）を再確認 |
| 3 | `auditAppliedFilters.ts` のチップ英語 label | `label: "action"` / `label: "actor"` / `label: "target type"` / `label: "batchId"` / `label: "limit"`、`value: String(filters.action)`（生コード） | `label: describeAuditField("action")` 等、`value: describeAuditAction(...)` / `describeAuditTargetType(...)` | チップの表示文言を helper 経由で日本語化し、英語キー名露出ゼロ（AC-4）。`key` は内部識別子のため英語維持 | auditAppliedFilters.spec で英語キー名ゼロ（TC-E-09）を grep アサート |
| 4 | `globals.css` の `.admin-audit-glossary` / `.admin-audit-card__meta` minmax | `minmax(170px,1fr)` / `minmax(150px,1fr)` の不揃いで列数がばらつく。`.chip-row` を再宣言する誘惑 | glossary `minmax(200px,1fr)` + `align-items:stretch` / meta `minmax(180px,1fr)` + `align-items:start`。`.chip-row` は既存共通定義（L2189-2196）を再利用し再宣言しない | 整列破綻の解消 + CSS 重複定義削減。全 token 経由で HEX 非増加 | `verify:tokens` PASS（HEX 0）。jsdom は CSS 非評価のためクラス付与（構造）アサート + Phase 11 screenshot 差分なし |

## 命名規約の集約（命名 drift 削減）

| 対象 | 集約先（正本） |
| --- | --- |
| フィールドラベル（操作の種類 / 実行者 等） | `AUDIT_FIELD_LABELS` + `describeAuditField` |
| 操作コードラベル（出席を追加 等） | `AUDIT_ACTION_LABELS` + `describeAuditAction` |
| 対象種別ラベル（開催日 / 会員 等） | `AUDIT_TARGET_TYPE_LABELS` + `describeAuditTargetType` |

- 用語を変更する場合の修正点は `auditGlossary.ts` の 3 マップのみ（修正点 1 箇所）。

## 挙動不変の総括

| 挙動 | 確認 |
| --- | --- |
| 検索 / リセット | `<form action="/admin/audit">` + `<Link data-role="reset">` が不変（TC 全 PASS） |
| ページネーション | `<Pagination>` + `buildAuditHref` キー名不変 |
| PII マスク / JSON 開示 / エラーメッセージ | `maskAuditText` / `JsonDisclosure` / `toAuditErrorView` 経由が不変 |
| testid | `audit-log-card` / `audit-applied-filters` 維持（grep） |
| API 契約 | `<input name>` 8 個維持・`git diff -- apps/api packages/shared` 空 |

> 全 4 行のリファクタは「表示文言の正本集約」と「CSS 整列」に限定され、データフロー・DOM contract・API 契約を変えない。Phase 7 の TC が全 PASS であれば挙動不変が担保される。
