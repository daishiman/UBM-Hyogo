# Phase 1 — 要件定義 / Topology Verification

## 1. 真の論点

「**プロトタイプとは UI が大きく異なる**」というユーザー報告は、見た目の「整合性問題」ではなく **CSS selector 不整合に起因する layout 崩壊**。コンポーネントは正しく rendering されているが、CSS が selector match しないため `display: flex/grid` / `padding` / `gap` などの layout rule が一切適用されていない。

## 2. 現状 topology（実測）

### 2.1 ホーム経路

| layer | path | 備考 |
| --- | --- | --- |
| route | `apps/web/app/page.tsx` | `<main data-page="home">` で wrap |
| layout | `apps/web/app/layout.tsx` | `tokens.css` → `globals.css` の順で import |
| header | `apps/web/src/components/public/PublicHeader.tsx` | `data-component="public-header"` |
| hero | `apps/web/src/components/public/Hero.tsx` | `data-component="hero"`（既存 CSS 有） |
| stats | `apps/web/src/components/public/Stats.tsx` | `data-component="stats"` + `data-role="stat-grid"` + `li[data-stat]` |
| zones | `apps/web/src/components/public/ZoneIntro.tsx` | `data-component="zone-intro"` + `data-role="zone-list"` + `li[data-zone]` |
| timeline | `apps/web/src/components/public/Timeline.tsx` | `data-component="timeline"`（既存 CSS は一部あり。grid / card rhythm のプロトタイプ差分補強が必要） |
| cta | `apps/web/src/components/public/CallToActionCTA.tsx` | `data-component="call-to-action-cta"`（既存 CSS 有・className ハイブリッド） |
| footer | `apps/web/src/components/public/PublicFooter.tsx` | `data-component="public-footer"` |
| member grid | `apps/web/src/components/public/MemberGrid.tsx` | `data-component="member-grid"` + `data-density` |

### 2.2 CSS 配置

| file | 行数 | 役割 |
| --- | --- | --- |
| `apps/web/src/styles/tokens.css` | 154 | OKLch 色 / radius / shadow 等 token 正本 |
| `apps/web/src/styles/globals.css` | 566 | Tailwind + `@layer base` + `@layer components` rhythm |
| `apps/web/src/styles/legacy-public.css` | 470 | 公開／管理コンポーネントの data-attr ベース rule 集約 |

### 2.3 既存 selector inventory（`legacy-public.css` 実測）

| 状態 | selector |
| --- | --- |
| ✅ 既存 | `[data-component="hero"]`, `[data-component="stat-card"]`, `[data-component="member-card"]`, `[data-component="call-to-action-cta"]`, `[data-component="profile-hero"]`, `[data-component="register-callout"]`, `[data-component="form-preview-sections"]`, `[data-component="members-filter-bar"]` |
| ❌ **不足（CSS rule 無し / 補強必要）** | `[data-component="public-header"]`, `[data-component="stats"]`（親）+ `[data-role="stat-grid"]` + `li[data-stat]`, `[data-component="zone-intro"]` + `[data-role="zone-list"]` + `li[data-zone]`, `[data-component="timeline"]`（既存 selector あり・プロトタイプ grid/card 補強）, `[data-component="public-footer"]`, `[data-component="member-grid"]` |

## 3. 不変条件（再掲）

1. HEX 直書き禁止（CI gate `verify:tokens` で fail）
2. コンポーネント TSX の data-attribute 構造は変更しない（snapshot test 既存）
3. `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）
4. `tokens.css` の OKLch variable を経由
5. `apps/web` から D1 直接アクセス禁止

## 4. artifacts.json metadata（要約）

- `taskType`: implementation
- `visualEvidence`: VISUAL（公開 home page の見た目変更）
- `implementation_mode`: existing-route-css-alignment
- `workflow_state`: implemented

## 5. 完了条件（Phase 1）

- ✅ 現状 topology の grep 実測完了
- ✅ 不足 selector の punch list 確定
- ✅ 不変条件確定
