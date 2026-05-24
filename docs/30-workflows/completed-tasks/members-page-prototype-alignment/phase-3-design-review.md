# Phase 3: 設計レビュー

## 1. プロトタイプ突合せ

| 要素 | プロトタイプ実装 | 本タスク設計 | 整合判定 |
|---|---|---|---|
| Segmented | `pages-public.jsx` L250-254 + `styles.css` L536-555 | DensityToggle が既存 `Segmented` primitive を採用、CSS は `[data-component="density-toggle"]` 経由 | ✓ |
| page-head | `pages-public.jsx` L208-256 | `.page-head` + `.eyebrow` + h1 + `[data-role="lead"]` | ✓ |
| filter card | `pages-public.jsx` L258 + grid `1.5fr 1fr 1fr 1fr auto` | `[data-component="member-filters"] [data-role="filter-grid"]` | ✓ |
| member-grid comfy/dense | `styles.css` L576-577 | `[data-component="member-grid"][data-density]` で同 minmax | ✓ |
| member-grid list | `styles.css` L578 + `.mrow` L594-623 | `[data-component="member-table"]` thead/tbody td に `.mrow` 相当の高さ・色 | ✓（プロトタイプ div→本実装 table。セマンティクス的に同等以上） |
| tag-pill | `styles.css` L824 | 既存 API / URL state の active tag 表示のみ整形。候補一覧 UI は本 workflow の正本対象外 | ✓（スコープ宣言通り） |
| empty-state | `pages-public.jsx` L308-313 + `styles.css` L935-940 | `[data-component="empty-state"]` | ✓ |
| responsive 900px | `styles.css` L1011-1022 | 同等の `@media` 内分岐を追加 | ✓ |

## 2. token / 不変条件レビュー

- すべての色: `var(--ubm-color-*)` 経由 ✓
- 角丸: `var(--ubm-radius-lg, 16px)` でフォールバック付き ✓
- HEX / RGB 直書き: 新規追加禁止。shadow は既存 `--ubm-shadow-xs` / `--ubm-shadow-sm` を使用し、直 `rgba(...)` を書かない。
- API 変更: なし ✓
- D1 直接アクセス: なし ✓
- 新 primitive: なし（既存 Segmented 採用）✓

## 3. リスク再評価

| リスク | Phase 2 対策 | レビュー結論 |
|---|---|---|
| `Segmented` が `ariaLabel` / `data-component` を root に渡せない | Segmented.tsx で `...rest` を root に spread | 採用 |
| box-shadow 直値が token gate に引っかかる | 既存 shadow token に置換 | 受容しない（実装前に設計で回避） |
| `legacy-public.css` 既存ルールとの衝突 | 末尾追記 / 既存ルール非編集 | OK |

## 4. 完了条件

- プロトタイプ突合せ表で全項目 ✓
- 修正必要なリスクなし
- 次フェーズへ
