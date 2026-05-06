# Phase 09 — 品質レポート / Quality Report

## ローカル実行結果（2026-05-07 / Node 24.15.0 / pnpm 10.33.2）

- `mise exec -- pnpm --filter @ubm-hyogo/api test` → 117 files / 789 tests PASS（Duration ~289s）
- `mise exec -- pnpm typecheck` → 全 workspace（shared / integrations / integrations/google / web / api）PASS
- `mise exec -- pnpm lint` → 全 workspace PASS

## 不変条件

- #5: paused 経路は D1 を呼ばず early return。enqueue 経路の D1 アクセスは `apps/api/src/workflows/tagCandidateEnqueue.ts` 内に閉じる。
- #13: 本タスクは `member_tags` を書かない。resolve workflow（既存）のみが書き込み権を保持。

## ログ可観測性

`logWarn({ code: "UBM-TAGQ-PAUSED", ... })` は `console.warn` に JSON 出力されるため、Cloudflare Workers ログ → Sentry / Slack 連携でも grep 可能。
