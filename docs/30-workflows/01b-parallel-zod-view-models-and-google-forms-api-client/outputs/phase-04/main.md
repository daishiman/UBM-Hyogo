# Phase 4: テスト戦略 — 成果物

> 仕様書: `phase-04.md` を再構成した最終版。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| Phase | 4 / 13 |
| 上流 | Phase 3（設計レビュー） |
| 下流 | Phase 5（実装ランブック） |
| 状態 | done |

## 2. 目的

型 / zod / Forms client / ESLint rule の **4 軸テスト戦略** を設計し、AC-1〜AC-10 すべてに 1 個以上の test を割り当てる。

## 3. 4 軸テスト計画（要約）

| 軸 | 内容 | 主要 test 数 |
| --- | --- | --- |
| 1. type-level | tsc strict による branded / viewmodel の型互換チェック | 5+ |
| 2. zod runtime | vitest による 31 項目 + viewmodel 10 種の parse | 70+ |
| 3. Forms client | vitest + fetch mock による getForm / listResponses / backoff | 15+ |
| 4. boundary lint | `scripts/lint-boundaries.mjs` による import 違反検出 | 3 |

> 詳細表は `test-strategy.md`、fixture 仕様は `test-fixtures.md` を参照。

## 4. AC ↔ test 対応表

| AC | test ID | 軸 |
| --- | --- | --- |
| AC-1 | type-test-viewmodel-fields | 1 |
| AC-2 | type-test-branded-7 | 1 |
| AC-3 | zod-31fields + zod-edge | 2 |
| AC-4 | zod-viewmodel-10 | 2 |
| AC-5 | zod-consent-normalize | 2 |
| AC-6 | type-test-responseEmail-system | 1 |
| AC-7 | type-test-distinct-branded | 1 |
| AC-8 | forms-auth + forms-get + forms-list | 3 |
| AC-9 | forms-backoff-429 + forms-backoff-5xx | 3 |
| AC-10 | boundary-lint × 3 | 4 |

## 5. coverage 目標

| package | 目標 |
| --- | --- |
| `packages/shared/src/zod` | 95%+ |
| `packages/shared/src/branded` | 100%（type-only） |
| `packages/integrations/google/src/forms` | 90%+ |

## 6. 実装結果

- 全 130 件 PASS、typecheck PASS。
- AC-1〜AC-10 全カバー。
- coverage 目標達成見込み（Phase 5 の sanity チェックで再確認）。

## 7. 不変条件マッピング

- **#1 / #3 / #7**: type test に必須（distinct branded / schema 抽象 / responseEmail system field）
- **#2**: consent normalizer test
- **#5**: boundary lint test
- **#6**: GAS prototype 由来値の reject test（zod レイヤ）

## 8. 完了確認

- [x] 4 軸 test list 完成
- [x] AC-1〜AC-10 全 100% カバー
- [x] fixture 設計確定（`test-fixtures.md`）
