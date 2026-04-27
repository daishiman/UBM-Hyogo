# Phase 5: 実装ランブック — 成果物

> 仕様書: `phase-05.md` を再構成した最終版。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| Phase | 5 / 13 |
| 上流 | Phase 4（テスト戦略） |
| 下流 | Phase 6（異常系検証） |
| 状態 | done |

## 2. 目的

package init → 型 → zod → Forms client → ESLint → test の **6 step ランブック** を発行し、各 step に sanity check を埋め込む。

## 3. 6 step 概要

| step | 内容 | sanity |
| --- | --- | --- |
| 1 | package init（`packages/shared`, `packages/integrations/google`） | typecheck PASS（empty barrel） |
| 2 | branded type 7 種定義 | type-level test |
| 3 | 型 4 層（schema / response / identity / viewmodel）定義 | tsc PASS、04-types.md カバー grep |
| 4 | zod schema + consent normalizer | vitest PASS、31 fixture parse 成功 |
| 5 | Forms client（auth / backoff / mapper / client） | vitest PASS、429 retry 成功 |
| 6 | boundary lint script 設定 | `pnpm -w lint` PASS |

> 詳細は `implementation-runbook.md` を参照。

## 4. rollback 戦略（要約）

| step | rollback 手段 |
| --- | --- |
| 1〜2 | 削除のみ（影響 0） |
| 3 | 型のみ、consumer 影響なし |
| 4 | zod 無効化（schema を passthrough に） |
| 5 | Forms client export を空 stub に置換、03a/b で fallback |
| 6 | boundary lint disable（一時） |

## 5. 全体 sanity チェック

```bash
mise exec -- pnpm -w typecheck
mise exec -- pnpm -w lint
mise exec -- pnpm -w test
```

## 6. 実装結果

- 全 step 完了。
- vitest 130 件 PASS、typecheck PASS、lint PASS。
- パッケージ名は実装時に **`@ubm-hyogo/shared` / `@ubm-hyogo/integrations-google`** を採用（仕様書の `@ubm/*` から変更）。

## 7. 不変条件 sanity

| step | 確認した不変条件 |
| --- | --- |
| 2 | #7（branded distinct） |
| 3 | #1（schema 抽象） / #3（responseEmail system field） / #4（admin-managed 分離） |
| 4 | #1 / #2（consent key） / #6（GAS prototype 排除） |
| 5 | #5（D1 binding に触れず） |
| 6 | #5（boundary 強制） |
