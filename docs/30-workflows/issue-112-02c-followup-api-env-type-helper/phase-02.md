# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 2 (follow-up) |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した AC-1〜7 と 4 open question に対し、`apps/api/src/env.ts` の `Env` interface 構造、wrangler.toml binding との対応表、`ctx()` refactor 契約を確定する。コードは書かず、interface 形 / シグネチャ / 互換戦略を **テキスト仕様** として固定し、Phase 3 のレビュー対象に渡す。

## 設計方針

1. `Env` interface は `apps/api/src/env.ts` に **手動定義** し、各 field 直前のコメントに `wrangler.toml` 該当 section / binding 名を明記する（Phase 1 D1 / D3）。
2. `ctx()` シグネチャは構造的部分型 `(env: Pick<Env, "DB">) => DbCtx` に変更する。`D1Db` は `D1Database` (Cloudflare Workers types) と互換となる alias として継続定義し、02c 既存 fixture との互換性を維持する（Phase 1 D2）。
3. `Env` フィールド命名は **wrangler.toml の生 key 名を維持**（`FORM_ID` / `SHEET_ID` 等）。同期コスト最小化と grep 容易性のため。
4. Schema / 共有コード ownership は本タスクが正本化担当。02c 由来の `_shared/db.ts` 型は本タスクで `Env` への依存に置換し、以後の owner は本タスクとなる。
5. KV / R2 / OAuth secret / Magic Link HMAC key などの未配置 binding は **本タスクでは追加しない**。`env.ts` 末尾コメントに「予約欄」として将来追加点のみ明記する。

## `Env` interface 設計

`apps/api/wrangler.toml` の現状から棚卸した binding を 1:1 で `Env` に持たせる。型は Cloudflare Workers ランタイム binding に従う。

| field | TS 型 | wrangler.toml 出典 | 備考 |
| --- | --- | --- | --- |
| `DB` | `D1Database` | `[[d1_databases]] binding = "DB"` | `Pick<Env, "DB">` で `ctx()` から参照 |
| `ENVIRONMENT` | `string` | `[vars] ENVIRONMENT` | `"production"` / `"staging"` / `"development"` のいずれかを想定（型では string、値の妥当性は runtime check） |
| `SHEET_ID` | `string` | `[vars] SHEET_ID` | Google Sheets 参照 ID |
| `FORM_ID` | `string` | `[vars] FORM_ID` | Google Form 参照 ID |
| `GOOGLE_FORM_ID` | `string` | `[vars] GOOGLE_FORM_ID` | 03a / 03b Cron handler 参照（FORM_ID と重複している点は本タスク scope out、03a で再評価） |
| `SHEETS_SPREADSHEET_ID` | `string` | `[vars] SHEETS_SPREADSHEET_ID` | u-04 sync job 参照（SHEET_ID と重複している点は 03a で再評価） |
| `SYNC_BATCH_SIZE` | `string` | `[vars] SYNC_BATCH_SIZE` | wrangler vars は string のみ。数値変換は呼び出し側責務 |
| `SYNC_MAX_RETRIES` | `string` | `[vars] SYNC_MAX_RETRIES` | 同上 |
| `SYNC_RANGE` | `string` | `[vars] SYNC_RANGE` | A1 表記レンジ |

### 予約欄（コメント明示のみ、本タスクでは追加しない）

| 想定 field | 想定型 | 想定 binding | 追加担当 |
| --- | --- | --- | --- |
| `SESSIONS` | `KVNamespace` | `[[kv_namespaces]]` | 05a / 05b |
| `OAUTH_CLIENT_SECRET` | `string` (secret) | `wrangler secret put` | 05a |
| `MAGIC_LINK_HMAC_KEY` | `string` (secret) | `wrangler secret put` | 05b |
| `R2_ARCHIVE` | `R2Bucket` | `[[r2_buckets]]` | 将来 |

### Env interface 形（テキスト仕様）

```
// apps/api/src/env.ts
//
// このファイルは apps/api Worker の binding 型契約の正本である。
// wrangler.toml の binding を追加・変更した場合は同時にこの interface を更新すること。
// 不変条件 #5: apps/web からの import は boundary lint で禁止される。

export interface Env {
  // wrangler.toml [[d1_databases]] binding = "DB"
  DB: D1Database;

  // wrangler.toml [vars] ENVIRONMENT
  ENVIRONMENT: string;

  // wrangler.toml [vars] SHEET_ID / SHEETS_SPREADSHEET_ID
  SHEET_ID: string;
  SHEETS_SPREADSHEET_ID: string;

  // wrangler.toml [vars] FORM_ID / GOOGLE_FORM_ID
  FORM_ID: string;
  GOOGLE_FORM_ID: string;

  // wrangler.toml [vars] SYNC_*
  SYNC_BATCH_SIZE: string;
  SYNC_MAX_RETRIES: string;
  SYNC_RANGE: string;

  // --- 予約欄 ---
  // SESSIONS: KVNamespace;            // 05a / 05b で追加予定
  // OAUTH_CLIENT_SECRET: string;     // 05a で wrangler secret put 経由
  // MAGIC_LINK_HMAC_KEY: string;    // 05b で wrangler secret put 経由
  // R2_ARCHIVE: R2Bucket;             // 将来
}
```

> 上記はテキスト仕様であり、実コードは Phase 5 以降の実装フェーズで作成する。本タスクの仕様書フェーズではコード生成を行わない。

## binding 対応表

詳細は `outputs/phase-02/env-binding-table.md` を参照。

## `ctx()` refactor 契約

詳細は `outputs/phase-02/ctx-refactor-contract.md` を参照。要約は以下:

- 旧: `ctx(env: { DB: D1Db }): DbCtx`
- 新: `ctx(env: Pick<Env, "DB">): DbCtx`
- 互換性: `D1Db` を `D1Database` 互換 alias として継続 export。02c 既存 fixture（`{ DB: D1MockObject }`）は構造的部分型により引き続き受理される。
- 変更箇所: `apps/api/src/repository/_shared/db.ts` の関数シグネチャと `import type { Env } from "../../env"` の追加のみ。本体ロジックは無変更。

## Schema / 共有コード Ownership 宣言

| 対象 | 旧 owner | 新 owner | 移管理由 |
| --- | --- | --- | --- |
| `apps/api/src/env.ts` | （未存在） | issue-112-02c-followup | 本タスクで新規作成 |
| `apps/api/src/repository/_shared/db.ts` の `ctx()` シグネチャ | 02c | issue-112-02c-followup | `Env` 依存追加に伴い本タスクが正本化 |
| `apps/api/src/repository/_shared/db.ts` の `D1Db` / `D1Stmt` / `DbCtx` / `intToBool` 等 | 02c | 02c のまま | 本タスク scope 外（変更しない） |

## session / OAuth / KV など将来 binding の予約欄

`Env` interface 末尾にコメント形式で予約欄を配置し、05a / 05b / 将来タスクが追加する際の挿入位置を明示する。**本タスクでは型として追加しない**。理由は scope out（Phase 1 論点 3）。

## 依存境界 / 統合テスト連携

| Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー（代替案 3 件比較）の入力 |
| Phase 4 | サブタスク分解（env.ts 新規 / db.ts refactor / guide 反映 / boundary lint 確認） |
| Phase 5 | runbook（編集順序）の入力 |
| Phase 6 | テスト戦略（02c unit test 維持 / 型レベル契約テスト）の入力 |
| Phase 9 | boundary lint negative test（`apps/web → apps/api/src/env`） |

## 多角的チェック観点

- **不変条件 #5**: `Env` を `apps/api/src/env.ts` に閉じ、`apps/web` からの import を boundary lint で禁止する設計を Phase 9 で gate 化する。
- **不変条件 #1**: `Env` は binding 名と値型のみを保持し、Forms schema 構造を持ち込まない。Phase 3 で再確認。
- **後方互換**: `Pick<Env, "DB">` への refactor が 02c fixture を破壊しないことを Phase 6 テスト戦略で gate 化。
- **secret hygiene**: 予約欄コメントに secret 実値を貼らない。binding 名のみ記載。

## 完了条件

- `Env` interface のフィールド一覧と TS 型が確定している
- wrangler.toml binding と `Env` の 1:1 対応表が `outputs/phase-02/env-binding-table.md` に確定している
- `ctx()` 旧→新シグネチャと後方互換戦略が `outputs/phase-02/ctx-refactor-contract.md` に確定している
- `outputs/phase-02/main.md` に設計サマリが記載されている

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/env-binding-table.md`
- `outputs/phase-02/ctx-refactor-contract.md`
