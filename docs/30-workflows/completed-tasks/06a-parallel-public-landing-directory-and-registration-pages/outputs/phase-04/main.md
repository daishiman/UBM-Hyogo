# Phase 4 成果物 — テスト戦略サマリ

## 概要

unit / contract / E2E / static / a11y の 5 layer を 4 ルートに対して設計し、AC-1〜AC-12 を test ID と紐付ける。本 Phase では unit test の実装まで完了させ、contract / E2E は 08a / 08b に引き継ぐ。

## verify suite

| layer | 対象 | tool | 担当 | 件数 |
| --- | --- | --- | --- | --- |
| unit | URL query zod, parser | vitest | 06a | 10 件 (U-01〜U-06 + 補助) |
| contract | 4 page の fetch I/O | vitest + msw | 08a | 5 件 (C-01〜C-05) |
| E2E | 4 ルート × desktop / mobile | Playwright | 08b | 7 件 (E-01〜E-07) |
| static | grep / ESLint | grep + ESLint | 06a | 4 件 (S-01〜S-04) |
| a11y | axe via Playwright | Playwright | 08b | 4 件 |

## unit test 実装結果

ファイル: `apps/web/src/lib/url/__tests__/members-search.test.ts`

```
✓ apps/web/src/lib/url/__tests__/members-search.test.ts (10 tests) 16ms
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test (U-01〜U-06) | completed |
| 2 | contract test (C-01〜C-05) | designed (08a へ引継ぎ) |
| 3 | Playwright (E-01〜E-07) | designed (08b へ引継ぎ) |
| 4 | static check (S-01〜S-04) | designed (Phase 9 で実行) |
| 5 | a11y axe | designed (08b 連携) |

## 完了条件チェック

- [x] AC-1〜AC-12 が test ID と対応（`test-matrix.md` 参照）
- [x] unit / contract / E2E / static の 4 layer が定義
- [x] AC-7, AC-8, AC-9, AC-11 のための static check が含まれる
