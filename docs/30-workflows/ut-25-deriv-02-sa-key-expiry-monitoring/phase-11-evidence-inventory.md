---
phase: 11
title: Evidence Inventory
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 11: Evidence Inventory — SA key 失効監視

[実装区分: 実装仕様書]

## 1. evidence 表

| # | Artifact | 取得コマンド | 期待値 / 内容 | 保存先 |
| --- | --- | --- | --- | --- |
| E-01 | typecheck ログ | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` | exit 0、エラー 0 件 | `outputs/phase-11/typecheck.log` |
| E-02 | lint ログ | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` | exit 0、warning 0 件 | `outputs/phase-11/lint.log` |
| E-03 | vitest (api) ログ | `mise exec -- pnpm --filter @ubm/api test 2>&1 \| tee outputs/phase-11/vitest-api.log` | 新規 spec 緑、classifier/logger branch 100% | `outputs/phase-11/vitest-api.log` |
| E-04 | wrangler.toml cron diff | `git diff apps/api/wrangler.toml \| tee outputs/phase-11/wrangler-cron.diff` | `crons` 配列要素数 3 のまま | `outputs/phase-11/wrangler-cron.diff` |
| E-05 | staging dry-run 失効ログ（401） | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging > outputs/phase-11/staging-tail-401.log` | `event: 'sheets.auth.failure', code: 'SHEETS_AUTH_401_KEY_INVALID'` を含む | `outputs/phase-11/staging-tail-401.log` |
| E-06 | staging dry-run 失効ログ（403） | 同上 | `code: 'SHEETS_AUTH_403_FORBIDDEN'` を含む | `outputs/phase-11/staging-tail-403.log` |
| E-07 | alert 受信 screenshot/log | Slack / mail スクリーンショット | rollbackRunbookUrl リンクが clickable | `outputs/phase-11/alert-received.{png,md}` |
| E-08 | false positive 抑止ログ（500/404） | 同上 tail | `SHEETS_AUTH_OTHER` で alert なし | `outputs/phase-11/staging-tail-other.log` |
| E-09 | rollback-runbook 逆参照 diff | `git diff docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` | 冒頭追記が反映 | `outputs/phase-11/rollback-runbook.diff` |
| E-10 | UT-25-DERIV-01 申し送り | `outputs/phase-11/deriv-01-handoff.md` を新規作成 | rotation 時 mute 手順 section ドラフトを記載 | `outputs/phase-11/deriv-01-handoff.md` |
| E-11 | verify-pr-ready ログ | `bash scripts/verify-pr-ready.sh 2>&1 \| tee outputs/phase-11/verify-pr-ready.log` | exit 0、全 gate green | `outputs/phase-11/verify-pr-ready.log` |
| E-12 | gate-metadata validate ログ | `mise exec -- pnpm gate-metadata:validate 2>&1 \| tee outputs/phase-11/gate-metadata.log` | zod schema 合致 | `outputs/phase-11/gate-metadata.log` |

## 2. evidence 取得順序

1. ローカル: E-01 → E-02 → E-03 → E-04 → E-12 → E-11
2. staging: E-05 / E-06 / E-08 / E-07（同一セッション内）
3. 逆参照: E-09
4. 申し送り: E-10

## 3. evidence existence gate

Phase 12 自己点検では `outputs/phase-12/phase12-task-spec-compliance-check.md` の
`Phase 11 evidence file inventory` を正本テーブルとして使う。`Status=present`
の行だけを物理存在 validator 対象とし、実装前または user-gated runtime の行は
`pending`、spec-created の手動確認 placeholder は `n/a` とする。

本 workflow は現時点で `implemented_local_runtime_pending / implementation / NON_VISUAL`。
`outputs/phase-11/manual-test-result.md` は focused local evidence の要約として物理配置し、
staging 失効 dry-run / alert receipt / production deploy などの runtime evidence は user-gated として保持する。
実装後に E-01〜E-12 の artifact を取得した時点で、各行を `present` へ昇格する。
存在しない artifact を `present` と書いた状態で Gate-B を passed にしない。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| spec-created manual result | `outputs/phase-11/manual-test-result.md` | n/a |
| typecheck | `outputs/phase-11/typecheck.log` | pending |
| lint | `outputs/phase-11/lint.log` | pending |
| api vitest | `outputs/phase-11/vitest-api.log` | pending |
| cron diff | `outputs/phase-11/wrangler-cron.diff` | pending |
| staging 401 tail | `outputs/phase-11/staging-tail-401.log` | pending |
| staging 403 tail | `outputs/phase-11/staging-tail-403.log` | pending |
| alert receipt | `outputs/phase-11/alert-received.md` | pending |
| false-positive suppression | `outputs/phase-11/staging-tail-other.log` | pending |
| rollback diff | `outputs/phase-11/rollback-runbook.diff` | pending |
| DERIV-01 handoff | `outputs/phase-11/deriv-01-handoff.md` | pending |
| verify-pr-ready | `outputs/phase-11/verify-pr-ready.log` | pending |
| gate metadata | `outputs/phase-11/gate-metadata.log` | pending |

## 5. 機密情報の取り扱い

- staging tail ログに SA private key 文字列・OAuth token が混入していないか目視確認後にコミット
- alert 受信 screenshot は Slack channel 名・user mention をマスクしてからコミット
- `.env` 実値はコミットしない（CLAUDE.md 不変条件）
