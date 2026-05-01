# Phase 2 成果物 — 設計サマリ

## サマリ

`apps/api/src/env.ts` を Worker env 型の正本として新規作成し、`Env` interface に wrangler.toml の binding 9 件（`DB` + 8 vars）を 1:1 で持たせる。各 field 直前に対応する wrangler.toml section をコメントで明示する。`_shared/db.ts` の `ctx()` は `Pick<Env, "DB">` を引数に取るよう refactor し、`D1Db` を `D1Database` 互換 alias として継続させることで 02c 既存 fixture と互換を保つ。KV / R2 / secret 系 binding は本タスク scope 外であり、`env.ts` 末尾の予約欄コメントとしてのみ示す。

## 設計決定の要点

| # | 決定 | 詳細出典 |
| --- | --- | --- |
| 1 | `Env` interface は手動定義 | phase-02.md「設計方針」#1 |
| 2 | フィールド命名は wrangler.toml の生 key 名を維持 | 「設計方針」#3 |
| 3 | `ctx()` は `Pick<Env, "DB">` で構造的部分型 refactor | env-binding-table.md / ctx-refactor-contract.md |
| 4 | `D1Db` は `D1Database` 互換 alias として継続 export | ctx-refactor-contract.md |
| 5 | KV / R2 / secret は予約欄コメントのみ（型追加しない） | 「予約欄」表 |
| 6 | Ownership: `env.ts` と `ctx()` シグネチャは本タスクが正本化担当 | 「Schema / 共有コード Ownership 宣言」 |

## Phase 3 への引き渡し論点

- 採用案: 手動 `Env` interface + wrangler.toml コメント対応（採用）
- 代替 1: `wrangler types` 自動生成（コスト・scope 理由で見送り）
- 代替 2: 各タスク個別定義維持（型ドリフト理由で却下）
- リスク: binding 追加時の同期漏れ / boundary lint false negative / 02c test 破壊
