# Phase 3 — 設計レビュー

## 採用案

`getCloudflareContext().env` ↔ `process.env` 二経路 + zod parse + `getEnv()` / `getPublicEnv()` 公開 API。
詳細比較は `alternatives-comparison.md`。

## task-03 並列調整

`apps/web/wrangler.toml` のセクション owner を分割し並列衝突を回避:

| セクション | owner | 備考 |
| --- | --- | --- |
| `[vars]` / `[env.*.vars]` | task-02（本タスク） | 先行 land |
| `[observability]` / instrumentation 追記 | task-03 sentry-workers-sdk-unify | 本タスク完了後に rebase |

`SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` のキーは本タスクが `EnvSchema` に固定し、task-03 は値の参照側のみ実装する。

## レビュー結論

GO。下流（task-04 / 05 / 18）は `getEnv()` のみ参照する契約で確定。
