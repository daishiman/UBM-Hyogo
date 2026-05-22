# Implementation Guide

## Part 1: 中学生レベル

管理画面 API は、家の鍵にあたる `AUTH_SECRET` がないと誰も中に入れない。今回は鍵の名前は登録されていたが、実際のランタイムでは鍵が空として見えていたため、すべての admin endpoint が 500 になった。

今回の対応では、鍵が空のときにすぐ分かるログを出し、smoke test が「鍵の binding 問題」と分類できるようにし、空の鍵を投入しない入口 guard も追加した。

## Part 2: 技術者レベル

- `requireAuth` / `requireAdmin` の `AUTH_SECRET` falsy branch を `getAuthSecretOrRespond()` に集約し、`UBM-AUTH-SECRET-MISSING` を emit。
- `validateAuthSecretEnv()` は `AUTH_SECRET.trim().min(32)` を検証する狭い zod contract。
- `runtime-attendance-provider.sh` は non-200 body を redaction 後に保存し、`{"error":"auth misconfigured"}` を `auth-secret-binding-missing` として `runtime-smoke.log` / `summary.json` に記録。
- `cf.sh secret put` は stdin が空白のみなら exit 78。`--dry-run` は non-empty guard の local test 専用。

## Verification

- `outputs/phase-07/test.log`
- `outputs/phase-07/api-typecheck.log`
- `outputs/phase-07/smoke-test.log`
- `outputs/phase-07/cfsh-secret-put.log`

