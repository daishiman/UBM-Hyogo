# Phase 10: 最終レビュー

## 1. AC 達成チェック（[phase-1-requirements.md](phase-1-requirements.md) §3）

| AC | 確認 |
|---|---|
| AC-1 PublicHeader 水平 3 ブロック | smoke + 目視 |
| AC-2 PublicFooter 水平 flex | smoke + 目視 |
| AC-3 DensityToggle radiogroup | unit + smoke |
| AC-4 Filter grid 5 列 / mobile 1 列 | 目視 + computed style |
| AC-5 grid auto-fill / table grid | 目視 |
| AC-6 empty-state 中央寄せ | smoke |
| AC-7 page-head 3 段 + Segmented | 目視 |
| AC-8 HEX 直書きなし | `pnpm verify:tokens` または `pnpm --filter @ubm-hyogo/web verify-design-tokens` |
| AC-9 API 不変 | `git diff dev -- apps/api/` 空 |
| AC-10 url helper 不変 | `git diff dev -- apps/web/src/lib/url/members-search.ts` 空 |
| AC-11 typecheck/lint/build | exit 0 |
| AC-12 Playwright smoke | pass |

## 2. 不変条件再確認

| 条件 | 状態 |
|---|---|
| D1 直接アクセスなし | ✓（API 経由のみ） |
| token 経由のみ | ✓ |
| 新 endpoint / schema 変更なし | ✓ |
| `*.spec.{ts,tsx}` のみ追加 | ✓ |
| 新 primitive 追加なし | ✓ |

## 3. 完了条件

- 12 AC すべて達成
- 不変条件 5 件すべて満たす
