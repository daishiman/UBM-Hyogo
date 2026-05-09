# Issue #559 Sentry project + 1Password DSN provisioning

| Field | Value |
| --- | --- |
| id | `task-issue-559-sentry-project-1password-dsn-provisioning-001` |
| source | `docs/30-workflows/issue-559-task-03-followup-001-sentry-staging-runtime-evidence/outputs/phase-12/unassigned-task-detection.md` |
| category | external-provisioning |
| priority | high |
| status | unassigned |
| github_issue | #598 (https://github.com/daishiman/UBM-Hyogo/issues/598) |
| blocks | Issue #559 G1〜G5, parent task-03 `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED`, production deploy readiness observability gate |

## Background

Issue #559 needs a real Sentry DSN before Cloudflare staging secret placement can begin. The 2026-05-08 runtime evidence cycle confirmed that `op` is installed and signed in, but the expected 1Password vault `UBM-Hyogo` and items `Sentry Web DSN (staging)` / `Sentry Web DSN (production)` do not exist in the available accounts.

## Required Work

1. Create or identify the Sentry Web project used by `apps/web`.
2. Create or select the 1Password vault that will be the canonical secret source.
3. Store staging and production items with fields `dsn` and `public_dsn`.
4. If the selected vault name is not `UBM-Hyogo`, update Issue #559 workflow docs before running G1.
5. Re-run the G1 provisioning preflight from `phase-05.md`.

## Acceptance Criteria

- `op item get 'Sentry Web DSN (staging)' --vault <vault> --fields label=dsn --reveal=false` exits 0.
- `op item get 'Sentry Web DSN (staging)' --vault <vault> --fields label=public_dsn --reveal=false` exits 0.
- Equivalent production item checks exit 0.
- No DSN values are copied into repository files, command logs, PR text, or screenshots.

## Scope

In scope: external Sentry project/DSN provisioning and 1Password canonical item creation.

Out of scope: Cloudflare `secret put`, staging deploy, Sentry dashboard runtime observation, parent task-03 state promotion, commit, push, or PR creation.

## Why This Is Separate

This cannot be completed only by editing the repository. It depends on external SaaS project ownership and 1Password vault policy. The repository-side fix is to fail fast before G1 and to keep Issue #559 in `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` until the provisioning prerequisite is real.

## 苦戦箇所 / Lessons Learned

- **G1 preflight 検出方法の確立**: 1Password vault 不在を G1 secret 投入の **前段** で検出する preflight (`op vault get UBM-Hyogo` + `op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo --reveal=false`) を `phase-05.md` runbook に組み込み、Cloudflare secret put 実行前に fail-fast させる構造に到達するまで複数回 phase-05/phase-11 を往復した。次回類似タスクでは「外部 SaaS / 1Password の正本 path 存在確認」を G0 直後 / G1 直前の独立 gate として最初から組み込む。
- **`op` 認証成功 ≠ vault provisioning 完了**: `op whoami` 成功・`op vault list` 成功でも、ワークフロー spec が前提とする vault 名 (`UBM-Hyogo`) と item 名 (`Sentry Web DSN (staging)` / `(production)`) が存在しない罠を踏んだ。`op` の sign-in 状態確認だけで G1 へ進めると判定するのは危険で、vault + item の両方を field 単位 (`--fields label=dsn --reveal=false`) で確認する必要がある。
- **DSN 値の log / PR 漏洩防止**: `op read` 出力を pipe で直接 `cf.sh secret put` に渡し、shell history / log / PR body に DSN 値が残らない構造を維持するため、評価サイクル中も `--reveal=false` を徹底する必要があった。1Password CLI のデフォルト出力で値が標準出力に流れないよう各コマンドで明示する習慣を skill に反映済み。
- **CONST_009 例外条件の判定**: 「外部 SaaS provisioning 待ち」で本ワークフロー scope-out にする判断 (CONST_009 例外) と、本ワークフロー内で fail-fast preflight として handling する判断の境界判定に時間を要した。今回は「provisioning 自体は外部依存だが、preflight gate は本ワークフロー内に置く」二段構造に整理することで両立。
