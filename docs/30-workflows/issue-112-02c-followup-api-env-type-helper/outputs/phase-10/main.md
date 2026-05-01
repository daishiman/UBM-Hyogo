# Phase 10 outputs main — ロールアウト / 後続連携 サマリ

## 後続タスクへの引き継ぎ

| タスク | 採用形 |
| --- | --- |
| 03a / 03b | Cron handler `(event, env: Env, ctx)` |
| 04b / 04c | `new Hono<{ Bindings: Env }>()` + `c.env.DB` |
| 05a / 05b | `Env` に `SESSIONS` / `OAUTH_CLIENT_SECRET` / `MAGIC_LINK_HMAC_KEY` を追加（予約欄置換） |
| 09b | deploy 前 `pnpm typecheck` / `node scripts/lint-boundaries.mjs` pass を gate |

import 経路: `import type { Env } from "../env";`（apps/api 内部 path）。

## binding 追加 4 ステップ標準フロー

1. `apps/api/wrangler.toml` に binding 追記
2. `apps/api/src/env.ts` の `Env` interface に field 追加
3. 該当 field 直前に `// wrangler.toml [<section>] <key>` コメント追記
4. `node scripts/lint-boundaries.mjs` で apps/web 側無汚染を確認

## ロールアウト戦略

- feature flag: **不要**（型のみの変更でランタイム挙動不変）
- canary: 不要
- 一括 PR: **採用**（Phase 8 の 5 gate + Phase 9 boundary negative test が安全弁）
- rollback: `git revert` のみで完結（データ移行なし）

## 通信計画

| タイミング | 反映先 |
| --- | --- |
| Phase 12 | `outputs/phase-12/implementation-guide.md` に 4 ステップフロー / 後続 7 タスクへの参照例 |
| Phase 12 | `system-spec-update-summary.md` に 02c implementation-guide.md `_shared/db.ts` 節差分 |
| Phase 13 | PR description に `Refs #112` + blocker 解除サマリ + 4 ステップフロー要約 |

## ロールバック条件

- CI G-1〜G-3 連続 fail → `git revert` + Phase 2 差し戻し
- 後続タスクで `Env` 型エラー → 部分型 `Pick<Env, ...>` に縮小 or `Env` 拡張 PR を緊急発行
