# Phase 10: 最終レビュー

> Phase: 10 / 13

---

## 受入条件チェック

| # | 条件 | 確認方法 |
|---|------|---------|
| 1 | Tag pill 選択時に背景塗りつぶしで視認可能 | Playwright + 手動確認 |
| 2 | Member card hover で border-color / box-shadow が transition | Playwright `transitionDuration` 比較 |
| 3 | Profile section に visibility marker（左ボーダー + icon）が表示 | Playwright + 手動 |
| 4 | OKLch token のみで実装、HEX 直書き 0 件 | `pnpm verify:tokens` + fallback `rg` |
| 5 | `verify-design-tokens` CI gate `completed (exit 0)` | CI 結果 |
| 6 | 既存 Vitest / Playwright smoke `completed (exit 0)` | Phase 9 結果 |
| 7 | axe a11y violations 0 維持 | Phase 9 結果 |

---

## blocker

| ID | 内容 | 対応 |
|----|------|------|
| — | なし | — |

---

## 判定

すべて `completed (local exit 0)` で Phase 11 着手。
