# Phase 5 outputs: 実装計画サマリ

Phase 5 で確定した実装計画のサマリ。詳細は `phase-05.md` および `runbook.md` を参照。

## 編集順序

```
T1 (env.ts 新規) → gate-1 (typecheck)
              → T2 (db.ts refactor) → gate-2 (typecheck + test)
              → T3 (guide 追記) || T4 (boundary lint) [並行]
              → gate-final (typecheck + lint + test)
```

## gate コマンド一覧

| gate | コマンド | 期待 |
| --- | --- | --- |
| gate-1 | `mise exec -- pnpm typecheck` | exit 0（env.ts 単独） |
| gate-2 | `mise exec -- pnpm typecheck` + `mise exec -- pnpm test --filter @ubm/api` | exit 0（refactor 後 02c unit test 全 pass） |
| gate-final | `mise exec -- pnpm typecheck` + `mise exec -- pnpm lint` + `mise exec -- pnpm test --filter @ubm/api` | 全 exit 0 |

## ロールバック case

| case | 状況 | 復旧戦略 |
| --- | --- | --- |
| 1 | T2 で 02c unit test 破壊 | fixture cast 追加 → 局所修復 → 失敗時 T2 のみ revert |
| 2 | T1 Env field が wrangler.toml と不一致 | 棚卸し再実行 → field 追加 / 削除 |
| 3 | T4 boundary lint false positive | source 条件を `apps/web/**` に絞る |
| 4 | T3 ガイドに secret 実値混入 | プレースホルダ置換 → 新規 commit で打消し |

## 局所 vs リモート

local は `mise exec --` 経由、CI は GitHub Actions workflow が `pnpm` 直接実行。失敗時の修正フローのみ異なる。

## Phase 6 への引き継ぎ

- T2 後方互換契約（`Pick<Env, "DB">` + `D1Db` alias 継続）
- 02c unit test fixture 互換条件（`{ DB: <D1Database 構造的部分型> }`）
- 型レベル契約テストの設計対象（後述 Phase 6 で詳細化）
