# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 1 / 13 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

Issue #778 の現状を最新コードに照らして再評価し、本タスクで実装すべき rollback / undo の最終スコープを確定する。

## 現状調査（2026-05-19 時点）

### 期待 vs 実態 vs 根拠

| 観点 | Issue #778 期待 | 現コードベース実態 | 根拠（grep / file） |
| --- | --- | --- | --- |
| rollback UI | SchemaDiffPanel に存在 | **無し** | `grep -n -E "rollback\|undo" apps/web/src/components/admin/SchemaDiffPanel.tsx` → 0 hit |
| rollback helper | `lib/admin/api.ts` に存在 | **無し** | 同 grep 0 hit |
| rollback endpoint | `routes/admin/schema.ts` に存在 | **無し** | 同 grep 0 hit |
| `schema_aliases.deleted_at` 列 | 任意 | **無し** | `apps/api/migrations/0008_*.sql` 確認 |
| audit relation 保存先 | 任意 | 現行 schema alias workflow は application `audit_log` を使用。`cf_audit_log` は Cloudflare Audit Logs 取り込み専用 | `apps/api/src/workflows/schemaAliasAssign.ts` / `apps/api/migrations/0003_auth_support.sql` |
| 最新 migration 番号 | - | 0018 | `ls apps/api/migrations/` |
| Issue closure 経緯 | - | linked PR なし / comment なし / 2026-05-19T02:10:00Z closed | `gh issue view 778` |

### Closed without code 判定

Issue #778 は CLOSED だが対応コードは無い → administrative close と判断。**根本問題（D1 直接修正運用）は未解決**。本仕様書で CLOSED 維持のまま再起動する。

## 要件（Functional）

| FR | 内容 |
| --- | --- |
| FR-1 | admin actor が SchemaDiffPanel から rollback ボタンで誤 resolve を取り消せる |
| FR-2 | rollback 確認 modal に「影響応答件数」「再集計要否警告」を表示 |
| FR-3 | 直近 resolve 後 5 分以内は undo トースト（クイック取消）を表示 |
| FR-4 | rollback 操作自体が `audit_log` に `schema_alias.rollback` action として記録される |
| FR-5 | 取消済 alias は soft delete として `schema_aliases.deleted_at` に時刻が記録される |
| FR-6 | 並列 resolve/rollback の競合は楽観ロック（`schema_aliases.version`）+ `If-Match` ヘッダで検出 |
| FR-7 | 取消時 `schema_diff_queue.status` を `resolved → queued` に戻す |

## 要件（Non-Functional）

| NFR | 内容 |
| --- | --- |
| NFR-1 | rollback API レイテンシ p95 < 500ms（local d1） |
| NFR-2 | 影響件数 query は indexed `COUNT(*)` のみ（N+1 禁止） |
| NFR-3 | `db.batch()` で atomic transaction を保証 |
| NFR-4 | UI 描画 OKLch token 完全準拠 |
| NFR-5 | a11y: rollback ボタンは `aria-label` 必須、modal は focus trap |

## 完了条件

- [x] Issue #778 が closed without code であると確認
- [x] FR-1〜FR-7 と NFR-1〜NFR-5 が定義済み
- [x] 未タスク化対象（followup-003/005/006/007）を Phase 02 で明確化することを引継ぎ

## 次 Phase

- 次: 2（設計）
- 引き継ぎ事項: FR/NFR、移管対象 followup、最新 migration 番号 0018
