# Phase 11: NON_VISUAL Evidence

## Evidence Boundary

`runtime-smoke-staging-secrets-restore` は `implemented_local_evidence_captured`。ローカル deterministic evidence は取得し、GitHub Environment secret mutation と runtime workflow rerun は user-gated のため `runtime_pending` とする。

## Local Evidence

| コマンド | 実測結果 |
| --- | --- |
| `bash scripts/ci/__tests__/verify-env-secrets.spec.sh` | 2026-05-16 実行。exit 0、`verify-env-secrets.spec.sh: OK` |
| `cmp -s docs/30-workflows/runtime-smoke-staging-secrets-restore/artifacts.json docs/30-workflows/runtime-smoke-staging-secrets-restore/outputs/artifacts.json` | 2026-05-16 実行。exit 0 |
| `find docs/30-workflows/runtime-smoke-staging-secrets-restore/outputs/phase-12 -maxdepth 1 -type f \| sort` | 2026-05-16 実行。strict 7 files がすべて存在 |
| `bash scripts/ci/verify-env-secrets.sh --json --event-name pull_request` | 2026-05-16 実行。exit 1。`staging-runtime-smoke` 必須 4 secret の欠落を JSON で列挙。secret 値は取得・出力なし |

## Runtime Pending

| 項目 | 状態 | 理由 |
| --- | --- | --- |
| GitHub Environment secret mutation | user-gated | secret 値は user の 1Password / GitHub CLI 操作のみ |
| `gh workflow run runtime-smoke-staging.yml --ref dev` | runtime_pending | secret 投入後の user 承認操作 |
| commit / push / PR | blocked | user 明示承認まで実施しない |
