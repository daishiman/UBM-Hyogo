# Phase 8 — リスクと対策

| ID | リスク | 影響度 | 対策 |
| --- | --- | --- | --- |
| R-1 | JSDoc を `@deprecated` で書いてしまい、現役 production caller (`tagQueueResolve.ts`) で deprecation warning が出る | 中（CI ノイズ） | `@deprecated` を使わない。**`@internal` のみ**使用（Phase 4 文面 B/C で確定済み） |
| R-2 | 関数 body / interface 引数型を誤って書き換える | 高（ランタイム挙動変化） | `Edit` の `old_string` を関数 body 全文ではなく `export async function assignTagsToMember(\n  c: DbCtx,` の 2 行だけに限定（Phase 5 Step 2） |
| R-3 | JSDoc 内マルチライン文字列で lint rule `max-len` 違反 | 低 | 1 行 100 文字以内で記述（Phase 4 文面はすべて準拠） |
| R-4 | 後続実装者が JSDoc を読まず新規 helper を追加する | 低（type-level test gate は有効） | Phase 12 再検証で `memberTags.readonly.test-d.ts` に `assign*` 派生 helper 禁止 gate を追加済み。残る caller 増加リスクは grep topology gate で検知する |
| R-5 | issue #294 が CLOSED のまま再オープンを求められる | 低 | issue は close 維持。本ワークフローで完結し、PR description で issue #294 を参照（`Refs #294`）するに留める |

## 影響範囲評価

- ランタイム影響: なし（JSDoc は実行時に剥がされる）
- D1 schema 影響: なし
- API surface 影響: なし
- 既存 caller 影響: なし
