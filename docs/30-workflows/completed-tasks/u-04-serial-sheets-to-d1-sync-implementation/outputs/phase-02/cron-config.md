# cron-config.md（wrangler.toml Cron Trigger 設定）

> 状態: completed-design
> 上位仕様: `../../phase-02.md`
> 関連: `sync-module-design.md` / `audit-writer-design.md`

## 1. 既存状態と整合方針

`apps/api/wrangler.toml` には現在 3 cron expression が登録されている。

| 既存 cron | owner / 用途 | 本タスクの取り扱い |
| --- | --- | --- |
| `0 */6 * * *`（prod）| UT-09 sheets sync（6 時間ごと）| **本タスクで `0 * * * *` に統一**（sync-flow.md §2 推奨） |
| `0 18 * * *` | 03a schema sync（03:00 JST）| **触らない**（別 owner） |
| `*/15 * * * *` | 03b forms response sync | **触らない**（別 owner） |
| `0 * * * *`（staging）| UT-09 sheets sync（1 時間ごと）| 既に統一済、staging は維持 |

**結論**: prod の Sheets sync expression を `0 */6 * * *` から `0 * * * *` に変更する。staging は変更不要。03a / 03b の cron は本タスクで触らない。Cron 件数は 3 件のまま（Free tier 上限 5 件以内）。

## 2. wrangler.toml 変更点（設計）

### 2.1 production block

```toml
# apps/api/wrangler.toml [triggers]（既存トップレベル + production）
# 変更前: crons = ["0 */6 * * *", "0 18 * * *", "*/15 * * * *"]
# 変更後:
[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
# - "0 * * * *"     : Sheets sync（U-04 owner、本タスクで 6h → 1h に変更）
# - "0 18 * * *"    : 03a schema sync（既存、別 owner、触らない）
# - "*/15 * * * *"  : 03b forms response sync（既存、別 owner、触らない）
```

### 2.2 staging block

```toml
[env.staging.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]  # 既存維持
```

### 2.3 production env block

トップレベル `[triggers]` を更新するため、`[env.production.triggers]` ブロックは追加しない（`name = "ubm-hyogo-api"` でトップレベルが production にも適用される）。staging 用 override のみ存在する現状を維持。

## 3. scheduled handler 接続（apps/api/src/index.ts）

```ts
// 概念実装（Phase 5）
import { Hono } from "hono";
import { syncRouter, runScheduledSync } from "./sync";

const app = new Hono();
// ... 既存ルート mount
app.route("/admin", syncRouter);

export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    // event.cron で発火 cron 文字列が分かる
    if (event.cron === "0 * * * *") {
      ctx.waitUntil(runScheduledSync(env));
      return;
    }
    // 03a / 03b は別 handler に dispatch（既存 entry に存在）
    // 本タスクは "0 * * * *" のみを所有する
  },
};
```

**重要**: scheduled handler は `event.cron` で発火元 cron 文字列を判別する。複数 cron が同じ default export.scheduled を共有するため、本タスクの `runScheduledSync` は `event.cron === "0 * * * *"` のときだけ起動する。03a / 03b の handler は本タスクで触らない（既存実装を尊重）。

## 4. 環境差分

| env | cron | 想定運用 |
| --- | --- | --- |
| production | `0 * * * *`（Sheets sync）| 1 時間ごと全件 upsert sync（D1 writes 上限の 1〜3%）|
| staging | `0 * * * *`（Sheets sync）| 1 時間ごと全件 upsert sync（既存維持）|
| local | （Workers cron は dev 環境では発火しない）| `wrangler dev --test-scheduled` で手動発火、または `POST /admin/sync/run` で manual 実行 |

## 5. 周期妥当性の根拠

| 軸 | 値 | 出典 |
| --- | --- | --- |
| D1 writes / day 上限（Free） | 100,000 | specs/08-free-database.md |
| 想定 sync 1 回あたり writes | 数件〜数十件（50 名 MVP）| sync-flow.md §2 |
| 1h 周期 | 24 回/day | - |
| 推定総 writes/day | 数百〜数千 | 上限の 1〜3% |
| upgrade trigger | 上限の 50% に到達 | Phase 09b 監視で alert |

1h 周期で発生する **遅延**（最悪 60 分）は MVP 観点で許容（admin が即時反映を要求するなら manual sync `/admin/sync/run` を併用）。

## 6. NO-GO 条件

- Cron Trigger Free tier 5 件超過: 本タスクは 3 件維持のため発生しない
- Workers CPU time 10ms 超過: `runScheduledSync` 内の delta fetch + upsert が 50 名規模では収まる想定。超過時は Phase 5 で chunk 分割 / Workers Paid 移行を検討
- 03a / 03b cron の expression を誤って削除: **本タスクで触らない** ことで回避（PR レビューで検証）

## 7. AC trace

| AC | 反映箇所 |
| --- | --- |
| AC-3 | §2 / §3（cron `0 * * * *` で scheduled handler 起動）|
