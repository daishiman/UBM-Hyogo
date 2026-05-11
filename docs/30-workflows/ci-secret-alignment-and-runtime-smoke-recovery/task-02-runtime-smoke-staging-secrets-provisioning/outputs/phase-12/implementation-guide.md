# Implementation Guide: task-02 runtime smoke staging secrets provisioning

## Part 1: 中学生レベルの説明

runtime smoke は、staging の API が本当に動いているかを GitHub Actions で確認する仕組みです。必要な secret が入っていないと、テスト本体まで進んでから分かりにくいエラーになります。

今回の改善では、テストを始める前に `STAGING_API_BASE`、`STAGING_ADMIN_BEARER`、`STAGING_MEMBER_ID`、`STAGING_ME_BEARER` が入っているかを先に確認します。足りなければ、どの secret が足りないかをログに出して止めます。値そのものは絶対に出しません。

## Part 2: 技術者向け

### 実装対象

| path | 役割 |
| --- | --- |
| `.github/workflows/runtime-smoke-staging.yml` | `mask staging credentials` の前に `verify required staging secrets` を置く |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | ユーザー承認後の canonical secret 投入手順。推奨経路として `scripts/smoke/provision-staging-secrets.sh` を案内し、手動 `gh secret set` fallback も保持する |
| `scripts/smoke/provision-staging-secrets.sh` | 既存 helper。1Password refs から environment-scoped GitHub secrets を name-only で投入するユーザー実行用スクリプト |

### 不変条件

- Secret 実値、断片、ハッシュ、webhook URL はログ・docs・PR本文へ出さない。
- AI は実値を `gh secret set` に渡さず、`scripts/smoke/provision-staging-secrets.sh` も実行しない。実投入はユーザー承認後にユーザーが行う。
- `SLACK_WEBHOOK_INCIDENT` は smoke 実行の必須 pre-check に含めない。failure notification step の guard が担当する。
- Runtime PASS は user-gated workflow run 後にのみ昇格する。
