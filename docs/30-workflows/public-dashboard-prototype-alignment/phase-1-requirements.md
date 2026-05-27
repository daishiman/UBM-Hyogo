---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
created_at: 2026-05-26
task_type: UI task
visual_category: VISUAL
implementation_mode: verify_existing
workflow: docs/30-workflows/public-dashboard-prototype-alignment/
---

# Phase 1: 要件定義

## 1. ゴール (3 個)

1. **G1 (Hero / Stats 整合)**: `/` の Hero と Stats をプロトタイプ `LandingPage` L4-59 と整合させ、`card-on-canvas + radial accent + serif h1 + eyebrow` の Hero、`Members / Zones / Meetings/yr / Last sync` 4-stat + sub line + sync badge の Stats に切り替える。
2. **G2 (About + Three Zones 導入)**: プロトタイプ `LandingPage` L62-92 の About カード + Three Zones row-list を `AboutUbm` 1 component で導入し、Hero と Stats の間に 2-card grid layout を配置する。Three Zones の row-list は `AboutUbm` 内部に吸収し、既存 `ZoneIntro.tsx` は fallback / 別画面利用に備えて残置する (削除しない)。
3. **G3 (Featured / Recent 整合)**: Featured Members に eyebrow + h2 + 全員見る CTA を追加し、`items.length === 0` でも heading を維持する。Timeline に eyebrow + h2 + 「毎月第2木曜開催」chip + tl-row layout (date / label / note / attendees) を追加し、API に `note` / `attendees` が無いケースを graceful fallback で吸収する。

> 非ゴール: 新規 API 追加・D1 schema 変更・auth middleware 改修・relative time formatter 導入。

---

## 2. 対象 route 一覧 (1 route)

| # | Route | プロトタイプ正本 | 既存実装ファイル | 作業区分 |
| --- | --- | --- | --- | --- |
| R1 | `/` (Landing) | `LandingPage` L4-152 | `apps/web/app/page.tsx` + `apps/web/src/components/public/{Hero,Stats,ZoneIntro,Timeline,MemberGrid,CallToActionCTA}.tsx` | `verify_existing` (整合修正) + `new` (`AboutUbm.tsx` のみ) |

横断: `apps/web/src/styles/legacy-public.css` (hero card / stat-sub / about-grid / featured / timeline 拡張)。

---

## 3. 既存コードの命名規則分析

| 種別 | 規則 | 適用先 | 例 |
| --- | --- | --- | --- |
| ファイル (Component) | `PascalCase.tsx` | `apps/web/src/components/public/` | `Hero.tsx`, `MemberCard.tsx` |
| ファイル (Test) | 同名 `.spec.tsx` を `__tests__/` 配下 | `apps/web/src/components/public/__tests__/` | `Hero.spec.tsx` |
| ファイル (Route Test) | `apps/web/app/__tests__/page.spec.tsx` | route smoke | (新規) |
| Component export | `PascalCase` named export | 全 component | `export function Hero()` |
| Props 型 | `XxxProps` interface | 全 component | `interface HeroProps` |
| `data-component` | kebab-case | section 識別 | `data-component="hero"`, `data-component="featured-members"` |
| `data-role` | kebab-case | sub-element 識別 | `data-role="eyebrow"`, `data-role="cta"`, `data-role="sub"` |

→ 新規 `AboutUbm.tsx` も同規則で配置。`data-component="about-ubm"`, sub-element に `data-role="copy"` / `data-role="zone-row"`。

---

## 4. P50 チェック表

| # | チェック項目 | 結果 | 根拠 |
| --- | --- | --- | --- |
| P50-1 | current branch に対象 dir が存在 | YES | `apps/web/src/components/public/` 既存 |
| P50-2 | プロトタイプ正本ファイルが存在 | YES | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152 |
| P50-3 | upstream `dev` に同名 dir なし (drift 無) | YES | parent workflow `ui-prototype-alignment-mvp-recovery` は completed |
| P50-4 | 前提タスク (task-11) は completed | YES | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/05-screens-public/task-11-*.md` |
| P50-5 | OKLch token が `tokens.css` に存在 | YES | `--ubm-color-zone-{a,b,c}` 等は task-09 で導入済 |
| P50-6 | `verify-design-tokens` CI gate 稼働中 | YES | task-18 で導入済 |
| P50-7 | 既存 endpoint surface 把握済 | YES | `/public/stats` (`PublicStatsViewZ`) / `/public/members` |
| P50-8 | `EmptyState` primitive 流用可 | YES | `apps/web/src/components/feedback/EmptyState.tsx` |

→ 全 PASS。Phase 2 着手可能。

---

## 5. implementation_mode 区分

| Mode | 対象 | 内容 |
| --- | --- | --- |
| `verify_existing` | `Hero`, `Stats`, `ZoneIntro`, `MemberGrid`, `Timeline`, `app/page.tsx`, `legacy-public.css` | 既存実装 (task-11) のレイアウト・コピー・data shape をプロトタイプ正本と整合 |
| `new` | `AboutUbm.tsx` + `__tests__/AboutUbm.spec.tsx` | About + Three Zones row-list 2-card セクション |

> artifacts.json の top-level は最も保守的な `verify_existing` を採用 (1 component 新規・残り改修)。

---

## 6. inventory: 流用可 / 改修必要 / 新規

### 6.1 流用可 (変更禁止)

| 区分 | パス | 用途 |
| --- | --- | --- |
| primitive | `apps/web/src/components/ui/{Card,Button,Badge}.tsx` | About カード / CTA |
| primitive | `apps/web/src/components/feedback/EmptyState.tsx` | Timeline / Featured empty |
| public | `apps/web/src/components/public/{CallToActionCTA,PublicHeader,PublicFooter,MemberCard}.tsx` | 流用 |
| api client | `apps/web/src/lib/api/public.ts` (`getStats`, `listMembersRaw`, `PUBLIC_API_REVALIDATE`) | data fetch |
| constants | `apps/web/src/lib/constants/form.ts` (`FORM_RESPONDER_URL`) | CTA URL |
| schema | `@ubm-hyogo/shared` (`PublicStatsViewZ`) | type |

### 6.2 改修必要

| ファイル | 改修内容 |
| --- | --- |
| `apps/web/app/page.tsx` | Hero copy / eyebrow を `UBM HYOGO · CHAPTER SITE` + serif h1 + body コピーに変更。primary CTA `メンバー一覧を見る → /members`、secondary CTA `会員ログイン → /login`。新規 `<AboutUbm />` を Hero/Stats と ZoneIntro の間 (もしくは ZoneIntro 廃止後の代替) に配線。Featured Members を `items.length === 0` でも heading を render する形に再構成。 |
| `apps/web/src/components/public/Hero.tsx` | gradient panel → card-on-canvas (Card primitive を root) + radial-gradient overlay (OKLch token 経由 `color-mix(in oklch, var(--ubm-color-accent) 14%, transparent)`) + serif h1 (`data-role="title-serif"`)。primary / secondary の variant 名を維持。 |
| `apps/web/src/components/public/Stats.tsx` | label を `Members / Zones / Meetings/yr / Last sync` に変更。`stats.memberCount` (visible) / 固定 `3` / 固定 `12` / `lastSyncLabel`。各 stat に `data-role="sub"` を 1 行追加 (`公開中のメンバー` / `0→1 / 1→10 / 10→100` / `毎月の支部会` / `<span data-role="badge-sync">Forms 同期中</span>`)。 |
| `apps/web/src/components/public/ZoneIntro.tsx` | About と並ぶ 2 列構成への変更は `AboutUbm` に吸収するため、`ZoneIntro` 自体は今回は **そのまま残置 (改修最小)** とする。app/page.tsx から `<ZoneIntro />` を削除し、代わりに `<AboutUbm />` を配線。`ZoneIntro` は別画面 / 将来再利用に備えコード保持。 |
| `apps/web/src/components/public/MemberGrid.tsx` | 自体は wrapper に専念し変更最小。Featured セクションの heading / eyebrow / 全員見る CTA / `items.length === 0` の empty state は **`app/page.tsx` 側 wrapper** で実装 (CONST_007 1 PR 完結のため新 component は最小化)。 |
| `apps/web/src/components/public/Timeline.tsx` | eyebrow `RECENT MEETINGS` + h2 「最近の支部会」 + chip `毎月第2木曜開催` + tl-row layout (`data-role="tl-row"`)。row 内に `tl-date` (yyyy-MM / dd) / `tl-label` / `tl-note` (optional) / `tl-attendees` (optional)。API に `note` / `attendees` が無い場合は要素自体を omit。 |
| `apps/web/src/styles/legacy-public.css` | hero card (`[data-component="hero"][data-variant="card"]`) / stat-sub / about-grid (`[data-component="about-ubm"]`) / featured-grid (`[data-component="featured-members"]`) / timeline tl-row / badge-sync スタイル追加。HEX 禁止、OKLch token 経由のみ。 |

### 6.3 新規 (2 file + spec)

| ファイル | 責務 |
| --- | --- |
| `apps/web/src/components/public/AboutUbm.tsx` | About カード (UBM 説明) + Three Zones row-list の 2-card grid セクション |
| `apps/web/src/components/public/__tests__/AboutUbm.spec.tsx` | unit test |

---

## 7. プロトタイプ vs 実装の主要 gap (6 件)

| # | gap | プロトタイプ参照 | 現状 | 影響 |
| --- | --- | --- | --- | --- |
| GAP-1 | Hero の card 化 + radial accent + serif h1 | `pages-public.jsx` L11-35 | `Hero.tsx` は gradient panel のみ。eyebrow / serif / radial overlay すべて欠落 | R1 |
| GAP-2 | Stats の `Members/Zones/Meetings/yr/Last sync` label + sub 1 行 + badge-sync | `pages-public.jsx` L38-59 | `Stats.tsx` は `total/public/zones/sync` で sub line・badge いずれも欠落 | R1 |
| GAP-3 | About + Three Zones の 2-card grid セクション | `pages-public.jsx` L62-92 | 未実装 (`ZoneIntro` 単独セクションのみ存在し、About は欠落) | R1 |
| GAP-4 | Featured Members の eyebrow / h2 / 全員見る CTA / 件数 0 でも heading 維持 | `pages-public.jsx` L95-108 | `items.length === 0` で section ごと非表示。eyebrow / 全員見る CTA 欠落 | R1 |
| GAP-5 | Recent Meetings の eyebrow / chip / tl-row / note / attendees | `pages-public.jsx` L111-134 | `Timeline.tsx` は単純 `<ol>` のみ。eyebrow / chip / note / attendees 欠落 | R1 |
| GAP-6 | `legacy-public.css` に hero card / stat-sub / about-grid / featured / timeline 拡張のスタイル不足 | `styles.css` (prototype) | (現行 CSS には未追加) | R1 |

---

## 8. 受入条件 (Phase 1 で固定)

1. R1 の `implementation_mode` 区分が表 5 で固定済み。
2. 1 個の新規 component (`AboutUbm.tsx`) の責務が表 6.3 で固定済み (Props 詳細は Phase 2)。
3. GAP リスト (6 件) が個別 acceptance に解消されること。具体 acceptance は Phase 2 design table と紐付ける。
4. API response 拡張は禁止。`note` / `attendees` / `meetingsPerYear` が data shape に無い場合は **UI 側で graceful fallback** すること (要素 omit または静的 placeholder)。
5. `verify-design-tokens` CI gate を pass すること (HEX 直書き 0 件)。

---

## 9. リスク・前提

| 区分 | 内容 | 軽減策 |
| --- | --- | --- |
| リスク | プロトタイプの `attendees`・`note` データが API response に存在しない | Phase 2 で fallback 設計 (Timeline は要素 omit) を確定 |
| リスク | `Meetings / yr = 12` がハードコード化される | Phase 2 で「年次定例数を `<small data-role="hint">` として記載」を明示。`Stats` の `value` は固定 12 で許容 (constants 経由) |
| リスク | `last sync = 数分前` 相対表現を入れたくなる | 非ゴールに明記 (CONST_007 スコープ厳守)。relative formatter は採用せず、既存 `lastSyncLabel` / 固定 label で吸収 |
| リスク | Hero の card 化で既存 `[data-component="hero"]` selector を参照する CSS / test に影響 | `data-variant="card"` を追加して既存 selector を残す |
| 前提 | `getStats({ revalidate: 60 })` / `listMembersRaw("limit=6&sort=recent", { revalidate: 30 })` の現行 contract は不変 | 不変条件 #1 |
| 前提 | OKLch token (`--ubm-color-accent`, `--ubm-color-zone-{a,b,c}`, `--ubm-color-text`, `--ubm-color-panel`) は既存 | `tokens.css` 既存値は変更禁止、追加のみ可 |

---

## 10. タスク分類 (Feedback 3 対応)

- **task type**: `UI task`
- **visual evidence**: `VISUAL` (Phase 11 で screenshot 必須)
- **implementation_mode**: `verify_existing` (1 component のみ `new`)
- **spec classification**: `implementation_spec` (docs-only 例外なし)

---

## 11. Phase 4 で targeted vitest 対象になるテストファイル候補 (FB-UI-02-2)

新規 spec (1 個 + 既存 5 個拡張):

```
apps/web/src/components/public/__tests__/AboutUbm.spec.tsx          (新規)
apps/web/src/components/public/__tests__/Hero.spec.tsx              (拡張)
apps/web/src/components/public/__tests__/Stats.spec.tsx             (拡張)
apps/web/src/components/public/__tests__/Timeline.spec.tsx          (拡張)
apps/web/src/components/public/__tests__/MemberGrid.spec.tsx        (拡張: featured wrapper)
apps/web/app/__tests__/page.spec.tsx                                (route-level smoke / 新規)
```

Playwright (Phase 11):

```
apps/web/playwright/tests/public-home-visual.spec.ts (新規)
```

→ Phase 4 で targeted vitest 起動コマンド (`pnpm --filter @ubm-hyogo/web exec vitest run <files>`) に渡す。

---

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 1
- workflow_state: `spec_created`

## 目的

公開トップ `/` の UI alignment 要件、対象 route、既存資産、受入条件を固定する。

## 実行タスク

- 対象 1 route と implementation mode を確定する
- 6 GAP を identify し Phase 2 design 入力にする
- API / D1 / auth 仕様変更なしの境界を固定する

## 参照資料

- `index.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L4-152

## 成果物/実行手順

- 本ファイルの GAP / route inventory / AC を Phase 2 以降の入力にする
- `artifacts.json.metadata.taskType=implementation` と `visualEvidence=VISUAL` を維持する

## 統合テスト連携

- Phase 4 で `AboutUbm` spec、`Hero/Stats/Timeline` 拡張 specs、`app/page.spec.tsx` route smoke、Playwright `public-home-visual.spec.ts` へ展開する

## 完了条件

- [ ] 対象 route / 不変条件 / 受入条件 / テスト候補が矛盾なく定義されている
- [ ] GAP 6 件と AC が 1 対 1 で対応する
