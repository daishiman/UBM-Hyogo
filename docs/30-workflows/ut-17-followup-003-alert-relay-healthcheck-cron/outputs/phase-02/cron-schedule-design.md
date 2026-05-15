# Phase 2 / cron-schedule-design — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-1

## 1. 設計方針

Cloudflare Workers Free Plan は account 全体で cron 上限 3 本。`apps/api/wrangler.toml` 既存の
`crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]`（production / staging 両方）は既に上限到達済。

**新規 cron を追加せず**、既存 `0 18 * * *` 分岐に **dayOfWeek=1 (月曜) 限定** で healthcheck を起動する相乗り方式を採用する。

## 2. cron schedule 仕様

| 項目 | 値 |
| --- | --- |
| cron 式 | `0 18 * * *`（既存と同一・追加しない） |
| UTC 起動時刻 | 毎日 18:00 UTC |
| JST 換算 | 毎日 03:00 JST |
| 実発火頻度 | 週 1 回（dayOfWeek=1 のみ実行） |
| 実発火タイミング | 毎週 **月曜 18:00 UTC = 火曜 03:00 JST** |

> **JST 月曜 09:00 起動を期待した原典 3.4** との差: dayOfWeek=1 (UTC) は UTC 月曜であり、
> JST では火曜未明 03:00 に発火する。Slack 通知の運用観点では「平日勤務時間帯」を外したい場合に都合が良いため、本設計では UTC 月曜採用を優先する。
> 仮に JST 月曜午前を厳密に狙うなら dayOfWeek=0 (UTC 日曜 = JST 月曜) を選ぶ。Phase 03 レビューで最終決定可能。

## 3. 既存 cron 分岐との並列性

`apps/api/src/index.ts:462-493` の `0 18 * * *` 分岐は現状 2 つの `ctx.waitUntil` を起動:

1. `runSchemaSync(env, deps)` (schema sync)
2. `runRetentionPurge(env, opts)` (retention purge dry-run/apply)

本タスクで追加する 3 つ目の `ctx.waitUntil`:

3. `runAlertRelayHealthcheck(env, ctx, event)` — dayOfWeek=1 のみ実 healthcheck、それ以外は内部で early return

これら 3 つは互いに独立した promise として並列実行され、いずれかが throw しても他の処理に影響しない。

## 4. 実装パッチイメージ（疑似コード）

```typescript
// apps/api/src/index.ts:462 付近
if (cron === "0 18 * * *") {
  ctx.waitUntil((async () => { /* 既存 schema sync */ })());
  ctx.waitUntil((async () => { /* 既存 retention purge */ })());

  // UT-17-FU-003: 週次 healthcheck 相乗り
  ctx.waitUntil((async () => {
    try {
      const { runAlertRelayHealthcheck } = await import("./scheduled/healthcheck");
      await runAlertRelayHealthcheck(env, ctx, event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[ut17-healthcheck] uncaught", { error: message });
    }
  })());

  return;
}
```

## 5. 変更対象ファイル一覧

| パス | 区分 | 変更内容 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | `[triggers]` の `crons` は不変。`# UT-17-FU-003: 0 18 * * * 分岐に dayOfWeek=1 限定の週次 healthcheck を相乗りさせる` のコメントを 3 箇所（top-level / `[env.production.triggers]` / `[env.staging.triggers]`）に追記 |
| `apps/api/src/index.ts` | 編集 | `if (cron === "0 18 * * *")` 分岐末尾に上記 `ctx.waitUntil((async () => { ... runAlertRelayHealthcheck ... })())` を追加 |

## 6. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# wrangler.toml 構文確認
mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --dry-run --config apps/api/wrangler.toml --env staging
```

## 7. Trade-offs

| 代替 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- |
| 新規 cron `0 0 * * 1` 追加 | 月曜 09:00 JST に正確に発火 | account cron 上限超過で deploy 失敗 | 不採用 |
| `0 18 * * *` から既存 schema sync を別 cron に分離 | 責務分離 | cron 本数増加 / Workers Paid 移行必須 | 不採用 |
| Workers Paid 移行 | cron 制限緩和 | 月額 $5 / 本タスクの単一目的に過剰 | Trade-off 記載のみ |

## 8. DoD

- [x] 新規 cron スロットを追加していない
- [x] 既存 `0 18 * * *` への相乗り方式が dayOfWeek 判定で実現されている
- [x] 並列起動の独立性（`ctx.waitUntil` × 3）が示されている
- [x] 変更対象ファイル一覧が新規 / 編集区分付きで揃っている
- [x] 検証コマンドが mise exec / wrangler dry-run で示されている
