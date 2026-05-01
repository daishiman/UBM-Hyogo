# Phase 1 成果物 — 決定事項サマリ

## 決定事項

| # | 決定 | 根拠 |
| --- | --- | --- |
| D1 | `Env` interface は `apps/api/src/env.ts` に手動定義する（`wrangler types` 自動生成は scope out） | small スケール / CI friction 回避 / Phase 3 で代替案比較済み |
| D2 | `_shared/db.ts` の `ctx()` は `(env: Pick<Env, "DB">) => DbCtx` へ refactor し、構造的部分型で 02c 既存 test を破壊しない | 論点 2 / AC-3 / AC-6 |
| D3 | `Env` には wrangler.toml に明示済の binding のみ含める（KV / R2 / OAuth secret はコメント予約欄のみ） | 論点 3 / scope out 方針 |
| D4 | `apps/web → apps/api/src/env` import は boundary lint の negative test で gate（Phase 9） | 不変条件 #5 / AC-5 |
| D5 | secret 実値は `env.ts` コメント・evidence に**含めない**（Phase 9 secret hygiene check） | AC-7 / CLAUDE.md secret 管理ルール |

## AC quantitative 化

| AC | 成果物 / コマンド |
| --- | --- |
| AC-1 | `apps/api/src/env.ts` 新規 1 ファイル + `export interface Env` |
| AC-2 | `Env` 各 key に `// wrangler.toml [vars]/[[d1_databases]] <name>` コメント |
| AC-3 | `ctx(env: Pick<Env, "DB">)` 変更後 02c unit test 全 pass |
| AC-4 | 02c implementation-guide.md に `Hono<{ Bindings: Env }>` 使用例を追記 |
| AC-5 | `apps/web/**` → `apps/api/src/env` import で `pnpm lint` exit non-zero |
| AC-6 | `pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` 全 exit 0 |
| AC-7 | secret hygiene check で実値非含有を確認 |

## Phase 2 への open question

1. `Env` のフィールド命名（wrangler.toml の生 key 名 `FORM_ID` 等を維持するか、camelCase へ変換するか）→ **生 key 名維持** を推奨（同期コスト最小）
2. `D1Db` を `D1Database` (Cloudflare 公式型) の alias 化するか → Phase 2 設計で確定
3. `scripts/lint-boundaries.mjs` の禁止トークン現状（`apps/api/**` で網羅されているか / `apps/api/src/env` の明示追加が必要か）→ Phase 2 で棚卸

## 真の論点（再掲）

- 論点 1: 手動 Env vs `wrangler types` 自動生成 → 手動採用
- 論点 2: `ctx()` 後方互換 → `Pick<Env, "DB">` で構造的部分型維持
- 論点 3: `Env` のスコープ → wrangler.toml 明示済 binding のみ
- 論点 4: boundary lint の十分性 → Phase 2 で棚卸 → Phase 9 で negative test
