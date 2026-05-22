# Phase 5: 実装仕様書

[実装区分: implementation / NON_VISUAL / CI guard + ops]

本タスクは `ci-env-secret-inventory-and-preflight-gate` の派生差分として、`staging-runtime-smoke` Environment の必須 4 secret を `verify-env-secrets.allowlist` の明示契約に追加し、既存 preflight が GitHub Environment secret 名だけを検査できるようにする。runtime job 内の空文字確認は値展開後の最終防御なので維持する。

## 0. 前提確認

```bash
gh auth status
bash scripts/ci/__tests__/verify-env-secrets.spec.sh
```

`gh secret set` / `op read` は user 操作であり、AI は secret 値・hash・断片を取得しない。

## 1. ops: secret 投入（user 単独操作）

```bash
bash scripts/smoke/provision-staging-secrets.sh
```

投入後の name-only 確認:

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort
```

必須 4 件は `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER`。`SLACK_WEBHOOK_INCIDENT` は failure notification 用の任意 1 件として分離し、smoke 起動条件には含めない。

## 2. code: `scripts/ci/verify-env-secrets.sh` 拡張

allowlist の既存 `name=...;reason=...` に加えて、次の形式を受け付ける。

```text
env=staging-runtime-smoke;required=STAGING_API_BASE,STAGING_ADMIN_BEARER,STAGING_MEMBER_ID,STAGING_ME_BEARER;reason=required-staging-runtime-smoke-secret
```

実装要件:

- allowlist parse 時に `env`, `required`, `reason` を TSV として保持する。
- workflow ref scan の結果と同じ `unresolved.tsv` へ、欠落 secret を `workflow=<allowlist path>`, `job=env-required`, `env=<ENV>`, `secret=<NAME>`, `reason=<REASON>` で追加する。
- secret 値は取得せず、`gh api repos/{owner}/{repo}/environments/{env}/secrets --jq '.secrets[].name'` の name-only 一覧だけを使う。
- `--env` / `--required` の新 CLI は追加しない。既存 `--json --event-name` 呼び出しが allowlist contract を読む。

## 3. code: `scripts/ci/verify-env-secrets.allowlist`

末尾に Environment scope 必須キー宣言を追加する。

```text
env=staging-runtime-smoke;required=STAGING_API_BASE,STAGING_ADMIN_BEARER,STAGING_MEMBER_ID,STAGING_ME_BEARER;reason=required-staging-runtime-smoke-secret
```

## 4. workflow 方針

`.github/workflows/verify-env-secrets.yml` は既存の `Run preflight gate` step が allowlist を読むため追加 step 不要。

`.github/workflows/runtime-smoke-staging.yml` の `verify required staging secrets` inline check は維持する。preflight は GitHub API の登録名検査、runtime step は job に展開された実値の空文字検査で責務が異なる。

## 5. テスト

`scripts/ci/__tests__/verify-env-secrets.spec.sh` に次を追加する。

| ID | 入力 | gh api モック | 期待 |
|----|------|--------------|------|
| ENV-001 | allowlist env-required が 4 件、登録済みが 2 件 | `STAGING_API_BASE`, `STAGING_ADMIN_BEARER` | exit 1、JSON に `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` |
| ENV-002 | allowlist env-required が 4 件、登録済みが 4 件 | 必須 4 件 | exit 0、JSON `[]` |

## 6. 検証コマンド（DoD）

```bash
bash scripts/ci/__tests__/verify-env-secrets.spec.sh
bash scripts/ci/verify-env-secrets.sh --json --event-name pull_request
git status --short
git diff --stat
```

`bash scripts/ci/verify-env-secrets.sh --json --event-name pull_request` はローカルの実 GitHub Environment secret 登録状態に依存するため、未投入なら exit 1 が正しい。テストではモックで completed を証明し、runtime workflow rerun は user-gated evidence として Phase 11 に残す。

## 7. DoD

- [x] `verify-env-secrets.sh` が allowlist `env=...;required=...;reason=...` を解釈する
- [x] `verify-env-secrets.allowlist` に `staging-runtime-smoke` 必須 4 件がある
- [x] `verify-env-secrets.spec.sh` の ENV-001 / ENV-002 が PASS
- [x] `runtime-smoke-staging.yml` の inline 値チェックを維持している
- [x] Phase 11 evidence と Phase 12 strict 7 が揃っている
- [x] commit / push / PR / secret mutation は user 明示承認まで実施しない

## 8. リスク / 残課題

| ID | 内容 | 対応 |
|----|------|------|
| R-01 | `GH_VERIFY_ENV_SECRETS_TOKEN` が Environment secret 名一覧を読めない | PR gate ではなく push / workflow_dispatch gate として扱い、Phase 11 evidence に境界を記録 |
| R-02 | bearer 短命による定期失効 | `outputs/phase-12/unassigned-task-detection.md` で formalize 判定 |
| R-03 | production 側への同等拡張 | `outputs/phase-12/unassigned-task-detection.md` で formalize 判定 |

## 9. 関連タスクとの差分

`ci-env-secret-inventory-and-preflight-gate` は全体 inventory と隣接 secret 整理の正本。本タスクは 2026-05-16 の runtime smoke failure を受け、`staging-runtime-smoke` 必須 4 件を allowlist contract とテストで明示する派生差分に限定する。
