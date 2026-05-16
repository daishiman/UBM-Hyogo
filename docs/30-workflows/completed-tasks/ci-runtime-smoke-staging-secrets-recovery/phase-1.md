# Phase 1: 要件定義

## 真の論点

GitHub Environment `staging-runtime-smoke` に必須 secret 5 件が未登録のため `runtime-smoke-staging.yml` が常時 fail し、`dev` ブランチへの merge 後に必ず CI 赤になる。さらに error メッセージが案内する runbook パスが stale（runbook は `completed-tasks/` へ移動済み）で、user が runbook へ即座にたどり着けない。

## 依存・責務境界

| レイヤ | 責務 | 本タスクでの担当 |
|--------|------|----------------|
| GitHub Environment (`staging-runtime-smoke`) | secret の永続保持 | user（AI 禁止） |
| `.github/workflows/runtime-smoke-staging.yml` | verify gate + runtime smoke 実行 | AI（path 修正のみ） |
| `scripts/smoke/provision-staging-secrets.sh` | op→stdin→`gh secret set` 投入 | user 実行（既存・変更なし） |
| 新規 `scripts/ci/verify-workflow-doc-refs.sh`（仮） | workflow YAML 内の `docs/...md` 参照が実在することを検証 | AI（新規実装） |
| `.github/workflows/<ci-meta>.yml`（新規 job または既存統合） | 上記 verify script を CI で実行 | AI（新規実装） |

## 変更ファイル inventory

| パス | 種別 | 概要 |
|------|------|------|
| `.github/workflows/runtime-smoke-staging.yml` | 編集 | 46 行目の runbook パスを current 位置に修正 |
| `scripts/ci/verify-workflow-doc-refs.sh` | 新規 | workflows 内の `docs/.../*.md` 参照実在チェック script（POSIX sh） |
| `scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh` | 新規 | bats もしくは plain shell test。stale path 検出ケース / 正常ケース |
| `.github/workflows/verify-workflow-doc-refs.yml` | 新規 | PR / push (dev/main) で上記 script を実行する CI job |
| `docs/30-workflows/completed-tasks/ci-runtime-smoke-staging-secrets-recovery/outputs/phase-*/*.md` | 新規 | phase ごとの成果物 |

## 命名規約調査

- 既存 CI script: `scripts/smoke/`、`scripts/cf.sh`、`scripts/coverage-guard.sh`（kebab-case）→ 新規も kebab-case
- 既存 workflow file: kebab-case（`runtime-smoke-staging.yml`、`backend-ci.yml`）→ 同様
- 既存 verify 系 workflow: `.github/workflows/verify-indexes.yml`、`.github/workflows/verify-test-suffix.yml` → 新規も `verify-*.yml`

## NON_VISUAL 宣言

本タスクは CI / 運用設定変更のみで UI/UX 変更なし。Phase 11 の screenshot は不要。代替証跡として `gh workflow run` 再実行ログ + secret 一覧の取得結果を用いる。

## carry-over 確認

`completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/` で過去に同種作業が完了している。今回は **当時投入された secret が失効/未投入のため再投入** + **runbook 移動に追従していない参照修正** + **再発防止 gate 追加** の 3 点で、過去成果物の重複ではない。

## 完了条件

- 変更ファイル inventory が確定
- 既存 secret 0 件であることの evidence を `outputs/phase-1/requirements.md` に記録
