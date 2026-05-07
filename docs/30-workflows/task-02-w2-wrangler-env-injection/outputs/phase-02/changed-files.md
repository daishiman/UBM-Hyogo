# 変更ファイル一覧（CONST_005）

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/wrangler.toml` | modify | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` を 3 環境揃いで集約 |
| `apps/web/src/lib/env.ts` | new | zod 検証付き `getEnv()` / `getPublicEnv()` 提供 |
| `apps/web/src/lib/__tests__/env.test.ts` | new | parse 成功 / URL 違反 / range 違反 / optional secret 欠落 / Workers context 優先 / public subset の 6 ケース |
| `apps/web/.dev.vars.example` | new | local 用 env テンプレ。secret は `op://` 参照のみ |
| `apps/web/package.json` | modify | `zod` を dependencies に追加（test/runtime 共通） |
| `pnpm-lock.yaml` | modify | zod 解決 |

## 変更しないもの

- `apps/web/next.config.ts`（`env` block 不在のため最小編集ゼロ — AC-11）
- `apps/api/wrangler.toml`（本タスク対象外）
- `[observability]`（task-03 owner）
