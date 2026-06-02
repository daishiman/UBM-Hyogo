# Phase 11 — manual smoke log（spec-only / NON_VISUAL）

本サイクルは spec 作成のため、コード実行を伴う smoke は**未実施**。以下は本サイクルで実行する手順の予約。

## 本サイクルで実行する smoke 手順（予約・user-gated）

```bash
# 1. guard test 単体（無料・ローカルのみ）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts

# 2. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3.（任意 / Gate-C / user-gated）staging cron が想定間隔で発火するか観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format=json \
  | jq 'select(.event == "cron.sync.start" or .event == "cron.sync.end")'
```

## 期待結果（本サイクルで埋める）

- guard test: TC-1..5 全 pass（canonical 一致 / ≤3 本 / legacy `0 * * * *` 不在 / parity / extractCrons 単体）。
- 負のシナリオ（手元で 4 本目を一時追加）で guard が **fail** することを確認し、変更を revert。
- staging tail（任意）: `*/5` / `*/15` / `0 18` の cron.sync イベントが ±1 分許容で出現。

> runtime 観測は DoD 必須ではない（解析的予算で free-tier 安全が確定済み）。
