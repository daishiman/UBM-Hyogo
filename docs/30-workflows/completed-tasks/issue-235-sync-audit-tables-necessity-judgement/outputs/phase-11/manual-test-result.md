# Phase 11 Output: 手動検証結果（manual-test-result）— NON_VISUAL

## NON_VISUAL 宣言

- タスク種別: 設計判定（docs-only）。
- 非視覚的理由: 成果物は判定証跡（ドキュメント）であり画面変化なし。
- **UI/UX変更なしのため Phase 11 スクリーンショット不要**（screenshot ディレクトリ未作成）。
- 証跡の主ソース: 再現コマンド（rg/grep/git status）の実行結果 7 件。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 11 / 13 |
| 実行日 | 2026-05-31 |
| 実行ディレクトリ | `.worktrees/task-20260531-144059-wt-9`（origin/dev `f6faeb005`） |
| 証跡の主ソース | rg / grep / git status の再現コマンド実行結果 |
| screenshot 非作成理由 | docs-only 判定タスク。UI/UX 変更ゼロ |

## テスト件数サマリ

| カテゴリ | 件数 | PASS | FAIL | SKIP |
| --- | --- | --- | --- | --- |
| 判定前提の再現コマンド | 7 | 7 | 0 | 0 |
| docs-only 実証 | 1 | 1 | 0 | 0 |
| 合計 | 8 | 8 | 0 | 0 |

## 実行記録（コマンド / 期待 / 実結果）

| # | コマンド | 期待 | 実結果 | 判定 |
| --- | --- | --- | --- | --- |
| TC-1 | `rg -n -e "sync_audit_logs" -e "sync_audit_outbox" apps/` | no match（apps 配下に存在しない） | no output / exit 1 | PASS |
| TC-2 | `rg -n "CREATE TABLE.*sync_audit" apps/api/migrations/` | no match（DDL 未作成） | no output / exit 1 | PASS |
| TC-3 | `rg -n "CREATE TABLE IF NOT EXISTS sync_jobs" apps/api/migrations/` | 1 件（0003） | `apps/api/migrations/0003_auth_support.sql:22` | PASS |
| TC-4 | `rg -n "CREATE TABLE IF NOT EXISTS sync_job_logs" apps/api/migrations/` | 1 件（0002） | `apps/api/migrations/0002_sync_logs_locks.sql:14` | PASS |
| TC-5 | `rg -n -e "metricsJsonBaseSchema" -e "PII_FORBIDDEN_KEYS" apps/api/src/jobs/_shared/sync-jobs-schema.ts` | zod schema + PII 遮断キー定義あり | `13: PII_FORBIDDEN_KEYS` / `23: metricsJsonBaseSchema` | PASS |
| TC-6 | `rg -n "CREATE TABLE IF NOT EXISTS notification_outbox" apps/api/migrations/` | 1 件（0014・outbox 前例） | `apps/api/migrations/0014_notification_outbox.sql:5` | PASS |
| TC-7 | `rg -l -e "sync_audit_logs" -e "sync_audit_outbox" .`（出現箇所の所在） | docs/skill 参照のみ（apps なし） | ヒットは親 close-out、本 issue-235 workflow、原典 U02 spec、`.claude/skills/**` の参照のみ。`apps/` ヒット 0 | PASS |
| TC-8 | `git status --short apps packages \| wc -l` | 0（docs-only 実証） | `0` | PASS |

## edge case / 仕様判断根拠

| ID | 観点 | 判断根拠 |
| --- | --- | --- |
| EC-1 | `sync_audit`（単数）文字列の誤検知 | `apps/api/migrations/0002_sync_logs_locks.sql:4` のコメントに「既存の sync_audit テーブル」という文言があるが、これは判定対象の `sync_audit_logs` / `sync_audit_outbox`（二段監査テーブル）とは別物。TC-1/TC-2 は `_logs` / `_outbox` サフィックス付きで厳密検索しており誤検知しない |
| EC-2 | `metrics_json` の拡張余地 | `metricsJsonBaseSchema` は `.passthrough()` のため任意キー追加が DDL 変更なしで可能。将来 metric 追加でも新設不要の結論は揺らがない |
| EC-3 | docs-only 実証 | TC-8 で `apps` / `packages` 差分 0 件。判定がコードへ波及しないことを実測 |

## 結論

判定前提（現行 `sync_jobs` + `sync_job_logs` + zod `metrics_json` が存在し、`sync_audit_logs` / `sync_audit_outbox` はコードに存在しない）は最新コードで完全に成立。判定「**新設不要**」の前提は 0 差分で確認された。本タスクは docs-only（コード変更ゼロ）。
