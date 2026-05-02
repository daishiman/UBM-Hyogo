# implementation-guide.md — Worker env 型の正本化（issue-112 02c-followup）

## Part 1: 中学生レベル概念説明

### 「Worker env って何？」

Cloudflare Workers は「学校の教室」みたいなもの。授業（API リクエスト処理）をするとき、教室に置いてある「黒板」「ロッカー」「給食室」みたいな道具を使う。この道具一式の入った箱が **env**（環境）。

- 黒板 = D1 データベース（メモを書いておける場所）
- ロッカー = KV（小さい鍵付き保管庫）
- 給食室 = R2（大きいファイルを置く倉庫）

授業のたびに「今日は黒板使う？ロッカー使う？」と env をのぞいて道具を取り出す。

### 「型を 1 箇所にまとめると何が嬉しい？」

家の中で「醤油どこ？」「砂糖どこ？」と毎回探すのは大変。だから台所の **棚に名前ラベルを貼って、どこに何があるかを 1 箇所にまとめる**。これが「型を 1 箇所にまとめる」ということ。

- もしバラバラに「醤油はここ、いやあそこ、もしかして冷蔵庫？」と書いてあると、誰かが砂糖を増やした時に全部書き直さないといけない
- 1 箇所（`apps/api/src/env.ts`）にまとめておけば、新しい道具が増えても **そこだけ直せば全員が同じラベルを見る**
- API（`apps/api`）の中だけで使う棚なので、Web 画面（`apps/web`）からは「のぞき見禁止」のルール（boundary lint）も貼っておく

### このタスクで何をやるか

1. `apps/api/src/env.ts` という名前の「ラベル一覧表」を新しく作る
2. 02c で作った `_shared/db.ts` の `ctx()` 関数を、その一覧表を見るように直す
3. Web 画面側からこの一覧表をのぞけないように見張りを付ける

## Part 2: 技術者レベル

### `Env` interface 契約

`apps/api/src/env.ts` に `Env` interface を export し、`wrangler.toml` の binding と一対一対応させる。各 field 直前に `// wrangler.toml [<section>] <key>` 形式のコメントで対応関係を明示する。

| 構成要素 | 役割 |
| --- | --- |
| `interface Env { ... }` | Worker 実行時 binding の型正本 |
| field 別コメント | wrangler.toml セクション・キーへの逆引きポインタ |
| `Pick<Env, K>` 派生型 | `ctx()` 等の限定スコープに使う |

### `ctx(env)` 契約

```ts
// 概念例（実装は別 PR）
export function ctx(env: Pick<Env, "DB">): RepositoryContext { ... }
```

- 引数は `Pick<Env, "DB">` で **最小権限**
- 02c 既存呼び出し側は `ctx(env)` のまま動作（後方互換）
- 将来 KV / R2 を使う repository が増えたら `Pick<Env, "DB" | "KV">` のように field を増やす

### `Hono<{ Bindings: Env }>` 使用例

```ts
// 04b me-and-profile-api / 04c admin-backoffice-api などでの参照例
const app = new Hono<{ Bindings: Env }>();
app.get("/me", (c) => {
  const repo = ctx(c.env);
  // ...
});
```

### binding 追加時の 4 ステップ

1. `apps/api/wrangler.toml` に新 binding（D1 / KV / R2 / vars）を追記
2. `apps/api/src/env.ts` の `Env` interface に対応 field を追記し、コメントで wrangler.toml の section / key を明示
3. 該当 binding を使う関数の型を `Pick<Env, "新Key">` で限定
4. `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` / `node scripts/lint-boundaries.mjs` で 4 種 log を再取得

### boundary lint との連動

- `scripts/lint-boundaries.mjs` の禁止トークンに `apps/api/src/env` を含め、`apps/web/**` から import すると error
- 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）の機械的 gate

## Part 3: 実装結果（2026-05-01）

### 適用差分

| 種別 | パス | 概要 |
| --- | --- | --- |
| 新規 | `apps/api/src/env.ts` | `Env` interface（`SyncEnv` / `ResponseSyncEnv` 継承 + 残 binding / secret）の正本配置。wrangler.toml セクションを field 直前コメントで明示。予約欄も付記 |
| refactor | `apps/api/src/repository/_shared/db.ts` | `ctx()` の引数型を `{ DB: D1Db }` → `Pick<Env, "DB">` に変更。`D1Db` alias は構造互換 bridge として `as unknown as D1Db` で保持 |
| refactor | `apps/api/src/index.ts` | インライン定義の `Env` を削除し、`./env` から import に統一 |
| 型ドリフト解消 | `apps/api/src/middleware/session-guard.ts` `routes/auth/index.ts` `routes/auth/session-resolve.ts` `sync/schema/types.ts` `routes/public/{form-preview,member-profile,members,stats}.ts` | ローカル Env interface の `DB: D1Db` を `DB: D1Database` に統一（`Pick<Env, "DB">` への適合） |
| gate 強化 | `scripts/lint-boundaries.mjs` | 禁止トークンに `apps/api/src/env` を追加（`apps/api` で既に gate されているが宣言的に明記） |

### gate 結果（Phase 11 evidence 参照）

| gate | 結果 | evidence |
| --- | --- | --- |
| `pnpm typecheck` | exit 0 | `outputs/phase-11/evidence/typecheck.log` |
| `pnpm lint`（boundary lint 含む） | exit 0 | `outputs/phase-11/evidence/lint.log` |
| boundary lint negative test（`apps/web` relative import probe） | 期待通り exit 1 検出。`../../api/src/env` のような相対 import も path 解決で遮断 | `outputs/phase-11/evidence/boundary-lint-negative.log` |
| focused regression tests | `apps/api/src/env.test.ts` + `scripts/lint-boundaries.test.ts` 4 tests PASS | `outputs/phase-11/evidence/boundary-lint-negative.log`, `outputs/phase-11/evidence/binding-mapping-check.log` |
| `pnpm --filter @ubm-hyogo/api test` | 486 PASS / 2 FAIL（pre-existing：`schemaDiffQueue.test.ts`。本タスク差分由来ではない） | `outputs/phase-11/evidence/test.log` |
| file / binding mapping | `apps/api/src/env.ts` 存在、`SHEET_ID` を含む wrangler binding 対応を確認 | `outputs/phase-11/evidence/file-existence.log`, `outputs/phase-11/evidence/binding-mapping-check.log` |
| secret hygiene grep | 実値 0 件（field 名・コメント・予約欄プレースホルダのみ） | `outputs/phase-11/evidence/secret-hygiene.log` |

### 後続タスクへの引き渡し

- 03a / 03b / 04b / 04c / 05a / 05b / 09b は `import type { Env } from "../env"`（または `"./env"`）経由で binding 型を解決する。インライン Env 再定義は禁止。
- KV / R2 / OAuth secret / Magic Link HMAC key 等の追加が必要な後続タスクは「binding 追加時の 4 ステップ」に従い、`wrangler.toml` ↔ `apps/api/src/env.ts` を同 PR で同期する。
