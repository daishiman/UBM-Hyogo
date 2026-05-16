# Phase 1: 要件定義

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-06-public-pages/spec.md` の
監査結果（`/` のみ改善必要、他 3 routes は OK）を確定し、Phase 2 設計への入力を固定する。

## 真の論点

### 論点 1: responderUrl の取得方式

- (A) HomePage で `fetchPublic("/public/form-preview")` を新規呼び出し → レイテンシ増・SSR cache 戦略複雑化 → **不採用**
- (B) static fallback URL を `apps/web/src/lib/constants.ts` に集約 → **採用（spec.md 付記で確定済）**
- (C) `NEXT_PUBLIC_*` env 化 → var 管理コスト発生・CLAUDE.md 方針と不整合 → **不採用**

### 論点 2: コンポーネント配置

- (A) `apps/web/src/components/public/CallToActionCTA.tsx` 単独 → **採用**
- (B) RegisterCallout と統合 → variant 分岐が増えメンテ性低下 → **不採用**（既存 RegisterCallout は light variant 用途で責務が異なる）

### 論点 3: スタイリング方法

- (A) `tokens.css` の `--ubm-color-text-primary` / `--ubm-color-surface-panel` / `--ubm-color-accent` 直接参照（CSS module または styled approach）→ **採用**
- (B) Tailwind arbitrary value `bg-[#xxx]` → **CI gate `verify-design-tokens` で禁止のため不採用**

## 受入条件

index.md AC-1 〜 AC-10 を参照。

## 完了条件

- 論点 3 件すべて結論明記
- スコープ・参照資料・AC が index.md と整合
