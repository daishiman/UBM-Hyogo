# ci-runtime-smoke-staging-secrets-recovery

## 概要

`backend-ci` の `runtime smoke staging / smoke` ジョブが、GitHub Environment `staging-runtime-smoke` の必須 secret 未登録のため `verify required staging secrets` ステップで exit 1 になる。本ワークフローで local repo 側の再発防止を完了し、secret 投入と runtime rerun は user-gated evidence として残す。

**[実装区分: 実装仕様書]**
- 主作業の一部（`gh secret set` の実値投入）は AI 禁止の user 操作だが、stale runbook path 修正・再発防止 CI guard はコード変更を伴う。CONST_004 に従い実装仕様書として作成し、operation セクションを併設する。

## 現状調査結果（2026-05-15）

| 観測項目 | 結果 |
|---------|------|
| `staging-runtime-smoke` Environment | 存在（id=15114442155, created 2026-05-09） |
| 同 Environment の secrets 数 | **0 件**（`gh api .../secrets` 確認） |
| 必須 secret | smoke 本体 early-fail は `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` の 4 件。provisioning inventory は failure post 用 `SLACK_WEBHOOK_INCIDENT` を含む 5 件 |
| 失敗ジョブ | `.github/workflows/runtime-smoke-staging.yml` lines 35-48 |
| 既存 runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` |
| 既存 provisioning script | `scripts/smoke/provision-staging-secrets.sh` |
| **stale 参照** | `runtime-smoke-staging.yml:46` が旧 runbook path を案内していたため、`completed-tasks/` 配下の current path へ修正済み |

## スコープ

| 含む | 含まない |
|------|----------|
| (A) user による `staging-runtime-smoke` Environment への secret 投入手順の明文化 | secret の実値投入実行（AI 禁止・user 操作） |
| (B) `.github/workflows/runtime-smoke-staging.yml:46` の stale runbook path 修正 | `production-runtime-smoke` 系の修正 |
| (C) 再発防止 CI guard 追加（workflows 内の runbook 参照パスが実在することを検証） | runbook 自体のリライト |
| (D) 動作確認（再実行で PASS することの evidence 取得） | `runtime-attendance-provider.sh` 本体ロジックの変更 |

## 不変条件

1. secret の実値を AI コンテキストに露出させない（chat / file / commit message / PR description）
2. `gh secret set` の実行は user 単独。AI は手順記述のみ
3. runbook の正本パスを更新する場合は、ガード script が新パスを検知できるよう **同一 wave** で更新する
4. CLAUDE.md の既定: PR base は `dev`、main は production リリース時のみ

## Phase 構成

| Phase | 名称 | 主要成果物 |
|-------|------|-----------|
| 1 | 要件定義 | `outputs/phase-1/requirements.md`（変更ファイル inventory・command list） |
| 2 | 設計 | `outputs/phase-2/design.md`（guard script API・workflow YAML diff 方針） |
| 3 | 設計レビュー | `outputs/phase-3/review.md` |
| 4 | テスト作成 | `outputs/phase-4/test-plan.md`（guard script unit test cases） |
| 5 | 実装 | `outputs/phase-5/implementation-result.md`（コード変更 + secret 投入手順） |
| 6 | テスト拡充 | `outputs/phase-6/extended-tests.md` |
| 7 | カバレッジ | `outputs/phase-7/coverage-report.md`（guard script 変更行 100%） |
| 8 | リファクタ | `outputs/phase-8/refactor.md` |
| 9 | 品質保証 | `outputs/phase-9/qa-result.md`（`pnpm lint` / actionlint） |
| 10 | 最終レビュー | `outputs/phase-10/final-review-result.md` |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md`（**NON_VISUAL**） |
| 12 | ドキュメント更新 | `outputs/phase-12/implementation-guide.md` ほか 6 成果物 |
| 13 | PR 作成 | user 明示承認後のみ |

## 完了条件（DoD）

- repo-local guard が `bash scripts/ci/verify-workflow-doc-refs.sh` / test で PASS している
- `staging-runtime-smoke` Environment に 5 件の secret が登録されている（user 操作後に `gh api .../secrets --jq '.secrets[].name' | sort` で 5 行確認）
- `runtime-smoke-staging.yml` の stale runbook path が修正され、`.github/workflows/` 内の runbook 参照は実在ファイルを指す
- 新規 CI guard が `.github/workflows/` 内の `docs/...md` 形式パス参照を検証し、stale path で fail する
- `gh workflow run runtime-smoke-staging.yml --ref dev` 再実行で `smoke` job が PASS する（user-gated runtime evidence）
- Phase 12 strict 7 成果物が揃う

## 参照

- `.github/workflows/runtime-smoke-staging.yml`
- `.github/workflows/backend-ci.yml`
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`
- `scripts/smoke/provision-staging-secrets.sh`
