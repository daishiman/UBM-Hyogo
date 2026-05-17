[実装区分: 実装仕様書]

# Phase 4: テスト設計 + fixture 設計 + verify script 雛形配置

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-04/main.md` |

## テストケース一覧

| TC | fixture / 入力 | 期待結果 |
| --- | --- | --- |
| TC-01 | `violation-sql-update.ts`（`UPDATE schema_questions SET stable_key = ?`） | Detector 1 で violation 1 件 |
| TC-02 | `violation-drizzle-update.ts`（`.update(schemaQuestions).set({ stableKey: ... })`） | Detector 2 で violation 1 件 |
| TC-03 | `violation-multiline-sql.ts`（template literal multiline で `UPDATE schema_questions` / `SET stable_key` が別行） | Detector 1 で violation 1 件 |
| TC-04 | `violation-camelcase-set.ts`（`.update(schemaQuestions).set({ stableKey })`） | Detector 2 で violation 1 件 |
| TC-05 | `allowed-read.ts`（`SELECT stable_key FROM schema_questions`） | violation 0 件 |
| TC-06 | `allowed-alias-update.ts`（`UPDATE schema_aliases SET stable_key`） | violation 0 件（テーブルが違う） |
| TC-07 | `scripts/__fixtures__/stable-key-update-lint/*.ts` を **全 scan 対象から除外** | 通常 scan で fixture が hit しない |
| TC-08 | `migrations/*.sql` 配下に violation を一時的に置く（spec 内 mock） | EXCEPTION で 0 件 |
| TC-09 | `--strict` flag 付き × violation あり | exit 1 |
| TC-10 | `--strict` flag なし × violation あり | exit 0（warning 出力のみ） |
| TC-11 | 失敗メッセージに `schema_aliases` と `/admin/schema/aliases` が含まれる | string 検査で hit |
| TC-12 | `--json` flag 付き | JSON parse 可能 / `violations[]` 構造一致 |

## fixture 配置

```
scripts/__fixtures__/stable-key-update-lint/
├── violation-sql-update.ts
├── violation-drizzle-update.ts
├── violation-multiline-sql.ts
├── violation-camelcase-set.ts
├── allowed-read.ts
└── allowed-alias-update.ts
```

## verify script placeholder 配置（前倒し）

- Phase 4 終了時点で `scripts/lint-stable-key-update.mjs` の **placeholder（exit 0 + TODO コメントのみ）** を作る計画を Phase 5 開始条件に含める
- placeholder により Phase 5 着手と同時に CI workflow / lefthook の wiring を並行検証できる
- 雛形コード（仕様書本文内のみ・実生成は Phase 5）:

```js
#!/usr/bin/env node
// TODO Phase 5: detector 1/2/3 を実装する
console.log("[stable-key-update-lint] placeholder OK");
process.exit(0);
```

## coverage 目標

- `scripts/lint-stable-key-update.mjs` の関数 coverage >= 80%（Detector 1/2/3 / stripComments / EXCEPTION 判定 / CLI flag 分岐）
- `bash scripts/coverage-guard.sh --no-run` で coverage summary 有無を Phase 11 に記録し、full workspace coverage は PR/CI runtime boundary として分離

## 統合テスト連携

vitest の `--include` 経由で `scripts/__fixtures__/stable-key-update-lint/` を guard script に投入する。
fixture そのものは `EXCEPTION_GLOBS` の `__fixtures__` で通常 scan からは除外される（TC-07）。

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] TC-01〜TC-12 が `outputs/phase-04/main.md` に列挙
- [ ] fixture path 一覧確定
- [ ] verify script placeholder 配置計画が Phase 5 に handoff

## 次Phase

Phase 5（実装）
