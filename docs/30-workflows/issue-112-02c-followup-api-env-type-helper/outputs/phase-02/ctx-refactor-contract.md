# `ctx()` refactor 契約

`apps/api/src/repository/_shared/db.ts` の `ctx()` を `Env` 依存に refactor する際の契約。

## 旧シグネチャ

```ts
// apps/api/src/repository/_shared/db.ts (現行)
export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

export interface DbCtx {
  readonly db: D1Db;
}

export const ctx = (env: { DB: D1Db }): DbCtx => ({ db: env.DB });
```

## 新シグネチャ（refactor 後）

```ts
// apps/api/src/repository/_shared/db.ts (refactor 後)
import type { Env } from "../../env";

// D1Db は Cloudflare Workers の D1Database と構造互換な alias として継続定義する。
// 02c 既存 unit test の D1 mock fixture を破壊しないため。
export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

export interface DbCtx {
  readonly db: D1Db;
}

export const ctx = (env: Pick<Env, "DB">): DbCtx => ({ db: env.DB as unknown as D1Db });
```

> `as unknown as D1Db` は `D1Database` (公式 Workers types) と `D1Db` (本リポジトリ局所型) を構造互換として接続する一時的 bridge。長期的には `D1Db` を削除して `D1Database` に直接依存する選択肢があるが、02c 既存 fixture との互換のため本タスクでは alias を維持する。

## 後方互換戦略

1. **構造的部分型**: TypeScript の構造的部分型により、呼び出し側が `{ DB: <D1Database 互換オブジェクト> }` を渡せば `Pick<Env, "DB">` として受理される。02c の `_shared/db.ts` を直接 import している既存呼び出し側は影響を受けない。
2. **D1Db alias 継続**: `D1Db` / `D1Stmt` / `DbCtx` / `intToBool` / `boolToInt` / `isUniqueConstraintError` の他 export は無変更。02c repository 群と既存テストへの影響なし。
3. **Test fixture**: 02c の unit test は `ctx({ DB: mockD1 })` 形式で呼ぶ実装を想定。`mockD1` が `D1Database` の構造的部分型を満たせば変更不要。満たさない場合は test 側を Phase 6 テスト戦略で `as Pick<Env, "DB">["DB"]` キャスト追加で吸収する（type cast のみ、ロジック変更なし）。
4. **Import パス**: `import type { Env } from "../../env"` を新規追加。既存の他 import は無変更。

## 変更点サマリ

| 変更 | 旧 | 新 | 影響 |
| --- | --- | --- | --- |
| `ctx` 引数型 | `{ DB: D1Db }` | `Pick<Env, "DB">` | 型契約のみ。runtime 動作は同一 |
| import | なし | `import type { Env } from "../../env"` | 追加 1 行 |
| `D1Db` interface | export 維持 | export 維持 | 無変更 |
| `DbCtx` / 他 helper | 無変更 | 無変更 | 無変更 |

## 検証手順（Phase 6 / 11 で実行）

1. `pnpm typecheck` — `Pick<Env, "DB">` への変更後も `apps/api` 全体で型エラーが出ないこと
2. `pnpm test --filter @ubm/api` — 02c の `_shared/db.ts` 関連 unit test が全件 pass
3. boundary lint — `apps/web` から `apps/api/src/env` を import すると lint error
4. 後方互換 spot check — 02c で `ctx()` を呼ぶ箇所（repository 各 module）の typecheck が通ること

## 後続タスクへの contract 出力

```ts
// 04b / 04c 等の Hono router での参照例
import { Hono } from "hono";
import type { Env } from "./env";

const app = new Hono<{ Bindings: Env }>();

app.get("/me", async (c) => {
  const env = c.env; // 型: Env
  const dbCtx = ctx(env); // ctx は Pick<Env, "DB"> を受理するので OK
  // ...
});
```

```ts
// 03a / 03b の Cron handler での参照例
import type { Env } from "./env";

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctxArg: ExecutionContext) {
    const dbCtx = ctx(env);
    // ...
  },
};
```

これらは Phase 12 implementation-guide.md に転記される。
