# Phase 1: 要件定義

## ユーザーストーリー

`dev` ブランチへの push 後、`backend-ci` → `deploy-staging` → `runtime-smoke-staging / smoke` が **secret 投入忘れで毎回 fail せず**、必要 secret が欠落している場合は **PR 段階の preflight gate** で識別できること。secret 投入は user の手元で `provision-staging-secrets.sh` 1 コマンドで完了すること。

## 受入条件 (AC)

| ID    | 受入条件 |
|-------|---------|
| AC-01 | `gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets --jq '.secrets[].name'` の出力に `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` の 4 件が含まれる |
| AC-02 | `gh workflow run runtime-smoke-staging.yml --ref dev` 実行で `verify required staging secrets` step が PASS、`run runtime smoke` step が exit 0 で終了する |
| AC-03 | `verify-env-secrets` preflight が `scripts/ci/verify-env-secrets.allowlist` の `env=staging-runtime-smoke;required=...` 宣言を読み、`staging-runtime-smoke` Environment の必須 secret セット（4 件）の登録状態を inventory に含める。欠落時は token が読取可能な PR / push / workflow_dispatch コンテキストで fail する |
| AC-04 | `runtime-smoke-staging.yml` の verify step は runtime job 内で展開済み secret 値の空文字確認を継続し、PR/push preflight は `verify-env-secrets.sh` の name-only Environment inventory 検査へ分離する。両者は同じ必須4件を参照し、値は出力しない |
| AC-05 | 既存テスト `scripts/ci/__tests__/verify-env-secrets.spec.sh` が PASS。新規ケース「Environment scope 必須キー欠落 → exit non-zero、JSON output に欠落キー名が列挙される」を追加し PASS |
| AC-06 | redaction / secret 値の echo がコードレビューで 0 件確認できる（`grep -n '\$STAGING_' .github/workflows/runtime-smoke-staging.yml` の参照は env block 経由のみ） |

## スコープ外

- bearer ローテーション自動化（短命 token の再取得自動化）→ `outputs/phase-12/unassigned-task-detection.md` で formalize 判定
- production smoke (`runtime-smoke-prod.yml`) への同等拡張 → `outputs/phase-12/unassigned-task-detection.md` で formalize 判定（同一構造の流用に留まる）
- 1Password vault item 自体の作成（前提として `op://Cloudflare/UBM-Hyogo Staging/*` が既に存在することを前提）

## 既存コード調査結果

| 項目 | 現状 |
|------|------|
| `runtime-smoke-staging.yml` の verify step | inline bash で 4 件を for ループ判定（重複ロジック） |
| `verify-env-secrets.sh` | workflow ファイル parse による static 検査。Environment scope の必須キーセットは `verify-env-secrets.allowlist` の `env=...;required=...` 宣言から読む設計へ拡張する |
| `provision-staging-secrets.sh` | 5 件分の op 参照を持ち冪等 |
| runbook | `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` に最新版 |
| 命名規則 | スクリプトは kebab-case、env var は UPPER_SNAKE。新規追加もこれに従う |

## carry-over 確認

- PR #758 (`ci-env-secret-inventory-and-preflight-gate`): preflight gate を導入済み。本タスクは **その allowlist contract を拡張**する位置づけ。`scripts/ci/verify-env-secrets.allowlist` を Environment required-set の宣言元として活用する。
- PR #728: 直接の関係なし（shared 型 contracts test）。
