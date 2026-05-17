**[実装区分: 実装仕様書]**

# Phase 3: 設計レビュー — serial-05-step-03-schema-diff-resolve

## 1. Current Topology Review

| 対象 | 判定 | 根拠 |
| --- | --- | --- |
| `page.tsx` | existing alignment | `fetchAdmin("/admin/schema/diff")` と `SchemaDiffPanel` を使用済み |
| `SchemaDiffPanel.tsx` | hardening target | 4 ペイン、row selection、stableKey form、feedback state を既に保持 |
| `api.ts` | mutation helper | `postSchemaAlias()` が browser proxy `/api/admin/schema/aliases` を使用 |
| Worker route | existing contract | `/admin/schema/diff` は `{ total, items }`、未解決 status は `queued` |

## 2. Review Result

Greenfield component 追加ではなく、既存 `SchemaDiffPanel` の hardening が最小複雑性で要件を満たす。

## 3. Required Corrections

- API response shape は `{ total, items }` に統一する。
- status は `queued|resolved` に統一する。
- POST 422 / 409 / 202 は fallback ではなく feedback として扱う。
- step-01 hook へ寄せる場合は現物の `trigger/isLoading/error` を使う。

## 4. Four-Condition Precheck

| 条件 | 判定 | 理由 |
| --- | --- | --- |
| 矛盾なし | `implemented-local-runtime-pending` | existing panel hardening と実コード差分を同じ状態語彙へ再分類済み |
| 漏れなし | `implemented-local-runtime-pending` | API / component / helper / test / evidence /正本同期の対象を列挙済み |
| 整合性あり | `implemented-local-runtime-pending` | `{ total, items }` と `queued|resolved`、stableKey regex、409/422 payload を正本化 |
| 依存関係整合 | `implemented-local-runtime-pending` | step-01 / step-02 / existing admin helper の境界を明示 |
