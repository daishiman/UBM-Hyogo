# apps/api 共通 Env 型 + ctx helper foundation - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 02c-followup-001-api-env-type-and-helper                                      |
| タスク名     | apps/api 共通 Env 型 + ctx helper foundation                                  |
| 分類         | 改善 / foundation                                                             |
| 対象機能     | apps/api Worker env 型定義と D1 binding wrap helper の正本化                  |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | consumed / implemented-local                                                  |
| 発見元       | 02c Phase 12 unassigned-task-detection #1                                     |
| 発見日       | 2026-04-27                                                                    |

## Canonical Workflow Status

- 後継 workflow: `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/index.md`
- Issue: #112（仕様書作成時点で CLOSED）
- 状態: `implemented-local` / Phase 1-12 completed / Phase 13 pending_user_approval。
- AC close-out: AC-1〜AC-7 は後継 workflow で実装・evidence 取得・正本同期まで完了済み。commit / push / PR は Phase 13 承認ゲートに残す。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02c で D1 repository を `apps/api/src/repository/` 配下に実装した際、Worker env からの D1 binding 取得は `_shared/db.ts` の `ctx(env)` で吸収した。しかし `apps/api/src/env.ts` 相当の **共通 env 型定義ファイルが存在しない**（`apps/api/src/` には `index.ts` と `repository/` のみ）。

03a / 03b / 04b / 04c / 05a / 05b / 09b 以降のタスクが Hono router / Cron handler を生やす際、env 型を各タスクで個別に書くと型ドリフトが起き、`DB: D1Database` 以外の binding（KV / R2 / secrets）追加時の影響範囲が追えなくなる。

### 1.2 問題点・課題

- `apps/api/src/env.ts` が未作成で、Worker env 型の **正本** が定義されていない
- `wrangler.toml` の binding 定義と TS 型の整合を保証する仕組みがない
- 02c の `_shared/db.ts` の `ctx(env)` は `{ DB: D1Database }` を最低条件として暗黙に期待しているが、契約として明文化されていない
- 04b / 04c / 05a / 05b が hono router を実装する際、`Hono<{ Bindings: Env }>` で参照する `Env` 型の正本が無い

### 1.3 放置した場合の影響

- 各タスクが独自に env 型を定義し、KV / R2 / Magic Link HMAC key などの binding 追加時に複数箇所修正が必要になる
- 型ドリフトが boundary lint で検知できず、実 deploy で初めて binding 不整合が発覚する
- 02c が実装した `ctx(env)` の前提条件が 04c / 05b で守られない可能性がある

---

## 2. 何を達成するか（What）

### 2.1 目的

`apps/api/src/env.ts` を Worker env 型の **正本** として配置し、02c の `ctx(env)` および後続タスクの hono router / cron handler が **型ドリフト無し** で参照できる状態にする。

### 2.2 最終ゴール

- `apps/api/src/env.ts` が存在し、`Env` 型として `wrangler.toml` の binding と一対一対応している
- 02c の `_shared/db.ts` の `ctx()` が `Env` 型を引数に取り、暗黙の `{ DB: D1Database }` 依存が型契約として明示される
- 04b / 04c / 05a / 05b 等の後続タスクが `import type { Env } from "@/env"` で参照可能

### 2.3 スコープ

#### 含むもの

- `apps/api/src/env.ts` の新規作成（`Env` 型 / `getEnv()` / `ctx()` を再 export）
- `apps/api/wrangler.toml` の binding 棚卸しと型対応表の作成
- `_shared/db.ts` の `ctx()` を `Env` 型を取るよう refactor（後方互換維持）
- 後続タスク向け使用例の `implementation-guide.md` 追記

#### 含まないもの

- KV / R2 / Magic Link HMAC key 等の binding **追加** 実装（個別タスク責務）
- hono router 実装（04b / 04c）
- secret 管理ポリシー（CLAUDE.md / 1Password 経路）

### 2.4 成果物

- `apps/api/src/env.ts` 新規ファイル
- `_shared/db.ts` の refactor 差分
- env 型 / binding 対応表（Phase 02 outputs）
- 02c implementation-guide.md への反映差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api/wrangler.toml` を読める
- 02c の `apps/api/src/repository/_shared/db.ts` の現状実装を理解している
- 不変条件 #5（`apps/web` から D1 直接アクセス禁止）を理解している

### 3.2 実行手順

1. `wrangler.toml` の binding 一覧を棚卸し（D1 / KV / R2 / vars / secrets）
2. `apps/api/src/env.ts` を新規作成し、`Env` interface を定義
3. `_shared/db.ts` の `ctx()` シグネチャを `(env: Pick<Env, "DB">) => DbCtx` に変更
4. 既存 unit test / boundary lint が通ることを確認
5. 02c implementation-guide.md の使用例（03a / 04c / 05a 節）に `import type { Env }` を反映

### 3.3 受入条件 (AC)

- AC-1: `apps/api/src/env.ts` が存在し、`Env` interface が export されている
- AC-2: `Env` の各 key が `wrangler.toml` の binding と一対一対応している（コメントで対応関係を明示）
- AC-3: 02c の `ctx(env)` が `Env` を引数に取るよう refactor され、unit test がすべて pass
- AC-4: 後続タスク向け参照例として `Hono<{ Bindings: Env }>` の使用例が implementation-guide に追記されている
- AC-5: `apps/web/**` から `apps/api/src/env.ts` を import すると boundary lint が error にする（不変条件 #5）

---

## 4. 苦戦箇所 / 学んだこと（02c で得た知見）

### 4.1 binding 暗黙契約の落とし穴

02c では `_shared/db.ts` が `{ DB: D1Database }` を暗黙に期待していたが、型契約として固定していなかったため、テスト時に `as any` でキャストしないと型エラーになるケースが発生した。Env 型を正本化することで `Pick<Env, "DB">` のような部分型契約が安全に書ける。

### 4.2 wrangler.toml と TS 型の同期

`wrangler.toml` には binding 名が文字列で書かれているため、TS 型の `Env` interface と機械的に同期する仕組みは無い。**コメントで対応関係を明示する** ことで、binding 追加時のレビュー漏れを防ぐ運用にすべき。将来的には `wrangler types` 自動生成も検討。

### 4.3 boundary lint との二重防御

`apps/web` が `apps/api/src/env.ts` を import すると D1Database 型が web 側に流入する。`scripts/lint-boundaries.mjs` の禁止トークンに `apps/api/src/env` を追加する必要がある（`apps/api` 全体の禁止に既に含まれていれば追加不要）。

---

## 5. 関連リソース

- `apps/api/src/repository/_shared/db.ts` - 現行 `ctx()` 実装
- `apps/api/wrangler.toml` - binding 定義
- `scripts/lint-boundaries.mjs` - boundary lint 実行 gate
- `doc/00-getting-started-manual/specs/08-free-database.md` - D1 構成
- 02c implementation-guide.md `_shared/db.ts` 節
- unassigned-task-detection.md #1
