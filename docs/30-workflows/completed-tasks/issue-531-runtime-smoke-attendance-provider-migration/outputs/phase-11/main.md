# Phase 11 Evidence Summary

| Evidence | Status | Path |
| --- | --- | --- |
| typecheck | PASS (exit 0, 2026-05-07) | `outputs/phase-11/evidence/typecheck.log` |
| lint | PASS (exit 0, 2026-05-07) | `outputs/phase-11/evidence/lint.log` |
| api test | PASS (123 files / 863 tests, 2026-05-07) | `outputs/phase-11/evidence/test.log` |
| api build | PASS (`tsc -p tsconfig.build.json --noEmit` exit 0) | `outputs/phase-11/evidence/build.log` |
| shellcheck | PASS (exit 0, empty output) | `outputs/phase-07/shellcheck.log` |
| grep gate | PASS (no `set-cookie` / `authorization:` / `cf-*` / bearer / email / profile PII 値検出) | `outputs/phase-11/evidence/grep-gate.log` |
| staging runtime smoke | PENDING (staging credentials 未提供のため hold) | `outputs/phase-11/evidence/runtime-smoke.log` |

## ローカル PASS 5 点セット根拠

- typecheck: monorepo 全 workspace で `tsc --noEmit` 成功（apps/api, apps/web, packages/* すべて Done）
- lint: 同上 lint pipeline 全 workspace Done
- api test: `pnpm --filter @ubm-hyogo/api test` で 123 ファイル / 863 テスト全 PASS
- api build: `tsc -p tsconfig.build.json --noEmit` exit 0
- grep-gate: token/cookie pattern は evidence logs 全体、PII/raw body pattern は `runtime-smoke.log` に限定して grep し検出 0 件

## AC-4 throw assertion 確認

`apps/api/src/repository/__tests__/builder.test.ts (26 tests)` がすべて PASS（`test.log:463`）。
`builder.test.ts:192,301` の `attendanceProvider not bound to context` throw assertion は同ファイルの 26 テストに含まれ、`✓` 行に集約されている。

## Runtime smoke 取り扱い

`scripts/smoke/runtime-attendance-provider.sh` は staging 専用 runner として整備済み。実行には以下の 1Password 経由の環境変数が必要:

- `STAGING_API_BASE`
- `STAGING_ADMIN_BEARER`
- `STAGING_MEMBER_ID`
- `STAGING_ME_BEARER`

これらの値は本セッションでは提供されておらず、CONST 違反（secrets 漏洩 / 値の握り）を避けるため、本サイクルでの runtime smoke 実行は intentionally hold する。Phase 13（user 承認ゲート）で credential 提供時に追加で `runtime-smoke.log` を取得する想定。
