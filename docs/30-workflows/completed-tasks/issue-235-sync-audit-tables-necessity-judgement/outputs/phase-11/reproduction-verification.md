# Phase 11 Output: 再現確認（reproduction-verification）

判定で発見した事実を、再現コマンド実行で再確認した記録。冪等性のため実行ディレクトリ・引数を明記する。

## 前提

- 実行ディレクトリ: `.worktrees/task-20260531-144059-wt-9`
- 基準: origin/dev `f6faeb005`（2026-05-31）
- ツール: ripgrep (`rg`) / git

## 再確認項目

| 項目 | コマンド | 前提条件 | 期待結果 | 実結果 |
| --- | --- | --- | --- | --- |
| R-1 `sync_audit_*` 非存在（実コード） | `rg -n -e "sync_audit_logs" -e "sync_audit_outbox" apps/` | apps 配下に二段監査テーブルが無い | no match | no output / exit 1（PASS） |
| R-2 マイグレーション未作成 | `rg -n "CREATE TABLE.*sync_audit" apps/api/migrations/` | DDL に sync_audit_* が無い | ヒット 0 | ヒット 0（PASS） |
| R-3 現行 ledger 存在 | `rg -n -e "CREATE TABLE IF NOT EXISTS sync_jobs" -e "CREATE TABLE IF NOT EXISTS sync_job_logs" apps/api/migrations/` | sync_jobs / sync_job_logs が正本 | 2 件 | 0002 + 0003 の 2 件（PASS） |
| R-4 metrics_json 構造化 | `rg -n -e "metricsJsonBaseSchema" -e "PII_FORBIDDEN_KEYS" apps/api/src/jobs/_shared/sync-jobs-schema.ts` | zod 構造化 + PII 遮断 | 定義あり | 定義あり（PASS） |
| R-5 outbox 前例 | `rg -n "CREATE TABLE IF NOT EXISTS notification_outbox" apps/api/migrations/` | 実需ベース outbox 新設の前例 | 1 件 | 0014 の 1 件（PASS） |
| R-6 出現箇所が docs/skill のみ | `rg -l -e "sync_audit_logs" -e "sync_audit_outbox" .` | apps ヒット 0、docs/skill のみ | docs/skill のみ | 親 close-out / 本 issue-235 workflow / 原典 U02 spec / `.claude/skills/**` の参照のみ（apps 0）（PASS） |
| R-7 docs-only 実証 | `git status --short apps packages` | 判定がコードへ波及しない | 0 行 | 0 行（PASS） |

## 0 差分確認

全 7 項目で期待結果と実結果が一致。判定「新設不要」の前提が崩れていないことを再現確認した。差分 0 件。

## 注記

R-6 で `sync_audit_*` が出現するのは親 close-out 系の判定証跡（「新設しない」文脈）、本タスク自身の文書、原典 U02 spec、skill current-fact 参照のみ。実装（migrations / src）への混入は 0 件であり、判定の独立性が担保されている。
