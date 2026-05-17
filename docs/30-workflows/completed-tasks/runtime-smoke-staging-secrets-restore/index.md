# runtime-smoke-staging Secrets Restore

[実装区分: 実装仕様書]

## 概要

`backend-ci.yml` から発火する `runtime-smoke-staging.yml` の `smoke` ジョブが、`staging-runtime-smoke` GitHub Environment の必須 secret 4 件未投入により `verify required staging secrets` step で fail している。本タスクは ① 欠落 secret の投入（user 操作）と ② 同事象が CI 上で **早期検出 / 識別可能** であることを、既存 `verify-env-secrets.allowlist` contract の拡張として 1 サイクルで完了させる。

| 項目              | 値 |
|-------------------|----|
| 目的タスク種別    | NON_VISUAL / CI ガード + ops |
| 実装モード        | `new`（CI ガード強化部分） + `verify_existing`（runbook / provision script 部分） |
| スコープ          | `.github/workflows/runtime-smoke-staging.yml` / `scripts/ci/verify-env-secrets.*` / `scripts/smoke/provision-staging-secrets.sh` / runbook 1 件 |
| 視覚証跡          | UI/UX 変更なしのため Phase 11 スクリーンショット不要 |
| workflow_state    | `implemented_local_evidence_captured`（runtime rerun / secret mutation / commit / PR は user-gated） |
| commit / PR       | 本タスクでは実施しない |

## 失敗ログ（事実）

```
::error::missing secrets in environment 'staging-runtime-smoke': STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER
::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)
Process completed with exit code 1.
```

ジョブ: `backend-ci` → `runtime-smoke-staging / smoke`（`workflow_call`、PR #728 マージ後の `dev` push トリガー）

## 真因分析

1. **直接原因**: `staging-runtime-smoke` Environment に 4 件の `STAGING_*` secret が登録されていない（`SLACK_WEBHOOK_INCIDENT` を含めると 5 件中 4 件欠落）。
2. **構造原因**:
   - `verify-env-secrets` preflight gate は repo 全体の secret 参照を検査しているが、`staging-runtime-smoke` Environment scope の登録状況を **`smoke` ジョブ起動前** に gate していない。
   - 既存 provision 経路 (`scripts/smoke/provision-staging-secrets.sh`) は op + gh 両方の session 前提で動作するため、初回投入が user の明示操作待ちのまま放置されている。
3. **再発リスク**: bearer 短命化 → 失効 → CI 再発、の周期が読めない。preflight が Environment scope を含まないと「main / dev push 時の deploy 完了直後に毎回失敗」を繰り返す。

## 解決策の骨子

| レイヤ | 対応 | 担当 |
|--------|------|------|
| ops    | 4 件 (＋ 任意で `SLACK_WEBHOOK_INCIDENT`) を `gh secret set --env staging-runtime-smoke` で投入 | user |
| CI ガード | `verify-env-secrets.allowlist` に `staging-runtime-smoke` Environment scope の必須キー宣言を追加し、既存 preflight が name-only 登録状態を読む。`runtime-smoke-staging.yml` の runtime 値チェックは維持 | spec → 実装 |
| 文書     | 既存 runbook `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` を canonical として参照（複製しない）。本タスク root に該当 incident への対応手順だけ追記 | spec |

## Phase 構成

| Phase | 状態 | 成果物 |
|-------|------|--------|
| 1 要件定義 | completed | `outputs/phase-01/requirements.md` |
| 2 設計 | completed | `outputs/phase-02/design.md` |
| 3 設計レビュー | completed | 本 index 内 |
| 4 テスト作成 | completed | `outputs/phase-05/implementation-spec.md` 内 §テスト |
| 5 実装 | completed | `outputs/phase-05/implementation-spec.md` |
| 6-10 テスト拡充 / カバレッジ / リファクタ / QA / 最終レビュー | completed | `scripts/ci/__tests__/verify-env-secrets.spec.sh` |
| 11 手動テスト (NON_VISUAL) | runtime_pending | `outputs/phase-11/main.md` |
| 12 ドキュメント更新 | completed | `outputs/phase-12/*` strict 7 |
| 13 PR | user 明示承認後 | — |

> 本仕様書は実装差分・ローカルテスト・Phase 12 strict 7 まで同一サイクルで閉じる。runtime rerun、secret mutation、commit、push、PR は user-gated として Phase 11 / 13 に分離する。

## 主要参照

- `.github/workflows/runtime-smoke-staging.yml`
- `.github/workflows/verify-env-secrets.yml`
- `scripts/ci/verify-env-secrets.sh`
- `scripts/ci/__tests__/verify-env-secrets.spec.sh`
- `scripts/smoke/provision-staging-secrets.sh`
- `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`
- `docs/30-workflows/completed-tasks/ci-env-secret-inventory-and-preflight-gate/` (PR #758; 本ワークツリーに root が存在しない場合も aiworkflow-requirements 正本上の historical/current reference として扱う)
