# Unassigned Task Detection

## Result

1 new unassigned task surfaced this cycle and was materialized because the blocker is external SaaS / 1Password provisioning, not an in-repo code or documentation gap.

## New unassigned task

### UT-Sentry-Provisioning: Sentry project + 1Password DSN provisioning

- 概要: 本ワークフローの G1 secret 投入の前提として、Sentry SaaS project の作成（または既存プロジェクト特定）と DSN 発行、および 1Password 上の vault / item provisioning が未実施。
- 必要作業:
  1. Sentry project（環境別 or 共通）の作成・特定と server / public DSN の取得
  2. 1Password に `UBM-Hyogo` vault 作成（あるいは既存 vault を採用し、本ワークフローの spec の op:// path を該当 vault 名へ更新）
  3. item `Sentry Web DSN (staging)` / `Sentry Web DSN (production)` 作成（fields: `dsn`, `public_dsn`）
- depends on: なし（独立に着手可）
- blocks: 本ワークフロー G1〜G5、parent task-03 の `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` 昇格、production deploy readiness の observability gate
- proposed scope-out from this workflow: yes（CONST_009 の例外条件「外部 SaaS provisioning 待ち」に該当。今サイクルで完了不可）
- 追跡先: `docs/30-workflows/unassigned-task/task-issue-559-sentry-project-1password-dsn-provisioning-001.md`

## Reasoning

G0 failure 自体は本ワークフロー内で handled する blocking preflight。ただし G1 halt の根本原因（1Password / Sentry provisioning 不在）は本ワークフローの design assumption（spec が op:// 正本 path を前提）の外にあり、独立の未タスクとして可視化する必要がある。production deploy / production secret 投入は引き続き本ワークフロー scope out で、production readiness gate が既存所管。
