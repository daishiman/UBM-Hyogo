# Phase 9 成果物 — 品質保証

## 状態
- 実行済（2026-05-01）

## 実行結果

### 1. `pnpm --filter @ubm-hyogo/api build`

```
> tsc -p tsconfig.build.json --noEmit
（exit 0、エラーなし）
```

→ tsconfig.build.json で `__tests__` / `__fixtures__` / `*.test.ts` が exclude されている
状態で型検査 PASS。

### 2. `pnpm --filter @ubm-hyogo/api typecheck`

```
> tsc -p tsconfig.json --noEmit
（exit 0、エラーなし）
```

→ test/fixture を含めても型整合 PASS。

### 3. dep-cruiser

```
✔ no dependency violations found (438 modules, 723 dependencies cruised)
```

→ production code → __fixtures__/__tests__ の violation 0 件。新 rule が誤検知しない
ことも確認（合成違反テストは Phase 6 参照）。

### 4. `pnpm --filter @ubm-hyogo/api test`

`Test Files 1 failed | 82 passed (83), Tests 4 failed | 506 passed (510)` — 失敗は
すべて `apps/api/src/jobs/sync-forms-responses.test.ts`（response sync の write-cap
ロジック）に関するもので、本タスクの diff（tsconfig.build.json 新設・package.json build
script・.dependency-cruiser.cjs rule 追加・02c 完了タスクの implementation-guide.md 補強）
とは無関係。runtime コードや test 設定を一切変更していないため **既存の pre-existing
failure** と判定。

| 失敗 test | 直接の根本原因（推定） | 本 follow-up との関連 |
| --- | --- | --- |
| `sync-forms-responses.test.ts > AC-9` | response sync 内部の cursor / status 期待値ずれ | 無関係（runtime / test 不変） |
| `sync-forms-responses.test.ts > AC-10 writeCap` | per-sync write 上限到達時の status 'failed' / 'succeeded' 期待値 | 無関係 |
| その他 2 件 | 同 test ファイル内の関連 case | 無関係 |

→ AC-2「`pnpm test` が引き続き通る」は **FULL PASS ではない**。本タスクの diff
（build config / boundary lint / docs）による regression は見つからないが、既存の
`sync-forms-responses.test.ts` failure が残っているため、全体 test suite は FAIL と記録する。
既存 failure は `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md`
で追跡する。

## 品質ゲート

| ゲート | 結果 |
| --- | --- |
| build (tsconfig.build.json) | PASS |
| typecheck (tsconfig.json) | PASS |
| dep-cruiser | PASS |
| 新 rule の合成違反検出（Phase 6） | PASS |
| esbuild bundle 検査（Phase 11） | PASS（bundle に test/fixture/miniflare 0 件） |
| `pnpm test`（全体） | FAIL（pre-existing failure 4 件。別 follow-up に分離） |
| `pnpm test`（本 diff の影響範囲） | PASS（build config / boundary lint 差分による regression なし） |
