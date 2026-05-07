# Phase 7: 静的解析 / 型チェック

実装区分: 実装仕様書

## 7.1 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api build
```

## 7.2 期待結果

| 項目 | 期待 |
| --- | --- |
| typecheck | exit 0、新規 type error 0 |
| lint | exit 0、新規 lint warning 0 |
| build | `apps/api` の Workers bundle が生成され exit 0 |

## 7.3 想定される typecheck エラーと修復

| エラー | 原因 | 修復 |
| --- | --- | --- |
| `Property 'attendanceProvider' does not exist on type 'Variables'` (route 側) | route の `Variables` 型に `RepositoryProviderVariables` を合成していない | route 冒頭の `new Hono<{ ... Variables: ... & RepositoryProviderVariables }>()` を追加 |
| `Property 'attendanceProvider' does not exist on type 'Variables'` (builder 側) | `DbCtx` 型に `var.attendanceProvider` が反映されていない | builder.ts の `DbCtx` 型を Phase 2.3 通り narrow |
| `Argument of type ... is not assignable to parameter of type ...` (call site) | `buildMemberProfile(ctx, mid, { ... })` の第3引数が型エラー | 第3引数を削除 |
| `Cannot find module './middleware/repository-providers'` | path 誤記 / export 名 mismatch | `apps/api/src/middleware/repository-providers.ts` の存在と export 名を確認 |

## 7.4 想定される lint warning

- 未使用 import: `createAttendanceProvider` を route から削除した後、import 文の残存に注意
- `import type { AttendanceProvider }` のみで使われている場合は `import type` に変更

## 7.5 修復方針

- typecheck エラーは Phase 5 ランブックの当該 step に戻り、不足した変更を補完する
- lint は `pnpm --filter @ubm-hyogo/api lint --fix` を試し、残存違反のみ手修正
- build は esbuild / wrangler 由来エラーが出た場合、`scripts/cf.sh` 経路で再現確認（CLAUDE.md の Cloudflare CLI ルール準拠）

## 7.6 完了条件

- typecheck / lint / build いずれも exit 0
- 警告 0（既存ベースラインに対する **追加** が 0）
- `apps/api/dist/` または `apps/api/.wrangler/` に Workers bundle が生成
