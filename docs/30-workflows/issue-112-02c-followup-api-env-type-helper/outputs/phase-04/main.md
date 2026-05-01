# Phase 4 outputs: サブタスク分解サマリ

Phase 4 で確定したサブタスク 4 件のサマリ。詳細は `phase-04.md` を参照。

## サブタスク 4 件

| ID | 名称 | 主成果物 | 依存 | AC |
| --- | --- | --- | --- | --- |
| T1 | `apps/api/src/env.ts` 新規作成 | `Env` interface + 9 binding コメント + 予約欄 | なし | AC-1 / AC-2 / AC-7 |
| T2 | `_shared/db.ts` の `ctx()` refactor | `(env: Pick<Env, "DB">) => DbCtx` シグネチャ | T1 | AC-3 / AC-6 |
| T3 | implementation-guide.md 追記 | `Hono<{ Bindings: Env }>` / Cron handler 使用例 | T1 / T2 | AC-4 |
| T4 | boundary lint 確認 / negative test | `scripts/lint-boundaries.mjs` 棚卸し + negative test 設計 | T1 | AC-5 |

## 依存グラフ

```
T1 → T2 → T3
        \\
T1 ────→ T4
```

実行順: **T1 → T2 → (T3 || T4 並行可)**

## AC ↔ サブタスク対応

| AC | 担当 サブタスク |
| --- | --- |
| AC-1 (env.ts 存在 / Env export) | T1 |
| AC-2 (binding 1:1 対応コメント) | T1 |
| AC-3 (`ctx()` refactor + 既存 unit test pass) | T2 |
| AC-4 (`Hono<{ Bindings: Env }>` 使用例追記) | T3 |
| AC-5 (`apps/web` boundary lint error) | T4 |
| AC-6 (typecheck / lint / test 全 pass) | T2 + 全 T |
| AC-7 (secret hygiene) | T1 + T3 |

## 粒度評価

合計新規 LOC: 最大でも 100 行未満（small スケール準拠）。

## Phase 5 への引き継ぎ

- 編集順序: T1 → T2 → typecheck → T3 → T4 → 全 gate 再実行
- 各 T のコマンド: `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api`
- ロールバック手順: T2 互換破壊時に `D1Db` alias 経路で局所復旧、影響範囲が広ければ revert
