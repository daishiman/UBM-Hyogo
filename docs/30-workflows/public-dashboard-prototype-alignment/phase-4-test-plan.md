---
実装区分: 実装仕様書
状態: spec_created
Phase: 4
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-3-design-review.md](./phase-3-design-review.md)
次: [phase-5-implementation.md](./phase-5-implementation.md)
---

# Phase 4: テスト計画

## 1. 目的

Phase 2 設計で定義した 7 component (改修 + 新規) と、`/` route 配線、`legacy-public.css` 追加分、prototype 整合に対する **テスト戦略・テストケース・mock 戦略・カバレッジ目標・vitest 実行コマンド** を定義する。

## 2. テスト戦略 (4 層)

| 層 | 対象 | ツール | 配置 | 目的 |
| --- | --- | --- | --- | --- |
| Unit | `public/{Hero,Stats,AboutUbm,Timeline,MemberGrid}.tsx` | vitest + @testing-library/react | `apps/web/src/components/public/__tests__/*.spec.tsx` | props ⇄ DOM 写像、fallback / edge |
| Component (server) | `app/page.tsx` | vitest (server-component test) | `apps/web/app/__tests__/page.spec.tsx` | section 配線 / API mock |
| Visual gate (静的) | `verify-design-tokens` | shell + grep | CI (`.github/workflows/verify-design-tokens.yml`) | HEX 直書き 0 件 |
| Smoke (E2E) | `/` route が 200 + 全 section render | Playwright | `apps/web/playwright/tests/public-home-visual.spec.ts` | 200 + heading + 4 viewport screenshot |

> Visual regression (pixel diff) は **Phase 11** に分離。本 Phase は DOM / aria / 文言 / token class のみ assert。

## 3. 共通コンポーネント test 一覧

### 3.1 `Hero.spec.tsx` (拡張)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-HERO-001 | `variant="card"` + eyebrow + title | `[data-variant="card"]` / `[data-role="eyebrow"]` / `<h1>` が render | prop → DOM |
| TC-HERO-002 | `variant="panel"` (既存互換) | `[data-variant="panel"]` で gradient panel が render | backward compat |
| TC-HERO-003 | `primaryCta` + `secondaryCta` | 2 つの `<a>` が `[data-variant="primary"]` / `[data-variant="secondary"]` で render | CTA |
| TC-HERO-004 | `eyebrow` 未指定 | `[data-role="eyebrow"]` が DOM に存在しない | conditional |
| TC-HERO-005 | radial accent 要素 | `[data-role="accent"][aria-hidden="true"]` が card variant のみで存在 | a11y |
| TC-HERO-006 | h1 の text | `title` が `<h1>` 内に正確に出力 | content |

### 3.2 `Stats.spec.tsx` (拡張)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-STATS-001 | `stats={memberCount: 30, publicMemberCount: 24, zoneBreakdown: [...], generatedAt}` | 4 stat (`members/zones/meetings/sync`) が render | structure |
| TC-STATS-002 | `data-stat="members"` の value | `24` (publicMemberCount) | mapping |
| TC-STATS-003 | `data-stat="zones"` の value | 固定 `3` | constant |
| TC-STATS-004 | `data-stat="meetings"` の value | 固定 `12` | constant |
| TC-STATS-005 | 全 stat に `[data-role="sub"]` が存在 | sub 1 行 4 個 | DOM |
| TC-STATS-006 | sync stat の sub 内 `[data-role="badge-sync"]` | badge + dot が render | badge |
| TC-STATS-007 | `generatedAt` invalid | `lastSyncLabel` が `"未同期"` | fallback |
| TC-STATS-008 | sub 文言 (`公開中のメンバー` 等) が prototype 一致 | text 完全一致 | copy |

### 3.3 `AboutUbm.spec.tsx` (新規)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-ABOUT-001 | default props | `[data-component="about-ubm"]` + about-card + zones-card | structure |
| TC-ABOUT-002 | About カードの eyebrow + h2 + 2 段 copy | text 一致 (prototype) | copy |
| TC-ABOUT-003 | Three Zones row 3 個 (0_to_1 / 1_to_10 / 10_to_100) | `[data-zone="..."]` 3 件 | zones |
| TC-ABOUT-004 | 各 zone-row の chip / label / desc | 3 sub-element | structure |
| TC-ABOUT-005 | `showZones={false}` | zones-card が render されない | conditional |
| TC-ABOUT-006 | `aboutCopy` カスタム ReactNode | default copy が上書き | slot |
| TC-ABOUT-007 | grid-2 layout | `[data-component="about-ubm"][data-role="grid-2"]` | class |

### 3.4 `Timeline.spec.tsx` (拡張)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-TL-001 | entries 3 件 (note / attendees 全あり) | tl-row 3 + tl-note + tl-attendees | full data |
| TC-TL-002 | entries 1 件 (note なし) | `[data-role="tl-note"]` 非存在 | fallback |
| TC-TL-003 | entries 1 件 (attendees なし) | `[data-role="tl-attendees"]` 非存在 | fallback |
| TC-TL-004 | entries 空 | EmptyState 表示 | edge |
| TC-TL-005 | header の eyebrow `RECENT MEETINGS` + h2 + chip `毎月第2木曜開催` | DOM | header |
| TC-TL-006 | `cadenceLabel="毎月第1水曜開催"` | chip 文言が override | prop |
| TC-TL-007 | `yyyyMm("2026-05-22")` | `"2026-05"` | utility |
| TC-TL-008 | `dd("2026-05-22")` | `"22"` | utility |

### 3.5 `MemberGrid.spec.tsx` (拡張)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-MG-001 | items 6 件 + density="comfy" | `[data-component="member-grid"][data-density="comfy"]` + `<li>` 6 個 | existing |
| TC-MG-002 | items 0 件 | `<li>` 0 個 (wrapper は親で制御) | edge |

> Featured wrapper の test は `app/__tests__/page.spec.tsx` で扱う (MemberGrid 自体は責務分離)。

### 3.6 utility / private function テスト方針

- `Timeline.tsx` の `yyyyMm` / `dd` は同ファイル内 `export function` として export し、`Timeline.spec.tsx` 内で direct test。private を test するためにモジュール内部に reach しない。

## 4. Page レベル test (`apps/web/app/__tests__/page.spec.tsx`)

| TC | 入力 | 期待 | 観点 |
| --- | --- | --- | --- |
| TC-PAGE-001 | `getStats` mock 正常 + `listMembersRaw` 6 件 | Hero/Stats/AboutUbm/FeaturedMembers/Timeline/CallToActionCTA がこの順で render | section ordering |
| TC-PAGE-002 | members 0 件 | `[data-component="featured-members"]` の heading は存在、内部に EmptyState | GAP-4 解消 |
| TC-PAGE-003 | Hero copy が prototype の eyebrow / title / subtitle / CTA labels と一致 | text 完全一致 | copy |
| TC-PAGE-004 | `<ZoneIntro />` が呼び出されていない | DOM に `[data-component="zone-intro"]` 不在 | refactor |
| TC-PAGE-005 | `<AboutUbm />` が `<Stats />` の直後に存在 | DOM 順序 | ordering |
| TC-PAGE-006 | revalidate 設定 (`export const revalidate = 60`) | module export 検証 | cache |

## 5. Playwright smoke (`apps/web/playwright/tests/public-home-visual.spec.ts`)

新規実装する。認証不要 (public route)。

| TC | URL | 期待 |
| --- | --- | --- |
| TC-SMK-001 | `/` (desktop 1440x900) | 200 / `<h1>` 存在 / 6 section (`hero/stats/about-ubm/featured-members/timeline/cta-for-members`) 全 render |
| TC-SMK-002 | `/` (mobile 375x812) | 200 / レイアウト 1 列にスタック / Hero の radial accent が見える |
| TC-SMK-003 | `/` (tablet 768x1024) | 200 / About 2-card が 1 列 (`max-width: 768`) に degrade |
| TC-SMK-004 | `/` (laptop 1024x768) | 200 / Stats 4 列 or 2 列 (`max-width: 1024`) |

## 6. Fail path 想定

| 種別 | 発生源 | テストでの再現 |
| --- | --- | --- |
| API 500 (`/public/stats`) | `getStats` reject | `vi.mock("@/lib/api/public", () => ({ getStats: vi.fn().mockRejectedValue(new Error("HTTP 500")), ... }))`。boundary は既存 `apps/web/app/(public)/error.tsx` (`issue-880`) が吸収するため、本 PR では fail UI 自体は変更しない。代わりに「fail 時にも `<PublicHeader />` は render される」を `(public)/error.tsx` 既存 spec で担保 (本 PR では追加しない) |
| `recentMeetings` 空 | mock で `recentMeetings: []` | Timeline EmptyState |
| `members` 空 | mock で `items: []` | Featured EmptyState |
| `note` / `attendees` 欠落 | mock で undefined | 要素 omit (TC-TL-002/003) |

## 7. Mock 戦略

| 対象 | 配置 | 方針 |
| --- | --- | --- |
| `getStats` | `vi.mock("@/lib/api/public")` (test-local) | `mockResolvedValue` で stats 形を渡す |
| `listMembersRaw` | 同上 | `mockResolvedValue({ items: [...], total })` |
| `next/server` (`connection`) | `vi.mock("next/server")` | no-op |
| `next/headers` | 本 task では参照しない | — |

mock fixtures は `apps/web/src/__fixtures__/public-stats.ts` (新規) に集約。

## 8. Visual regression 非依存

- Phase 4 / Phase 6 の自動テストは DOM 構造 / aria 属性 / 文言 / data-* attribute のみ assert。
- pixel diff (screenshot) は **Phase 11** で 4 viewport × 1 key screen + empty/full 状態 = 計 6 枚を取得し別評価。
- 自動テストが flaky 化しないよう `screenshot()` API は本 Phase で禁止。

## 9. カバレッジ目標 (Phase 7 で実測)

| 対象 | line | branch | function | statement |
| --- | --- | --- | --- | --- |
| `apps/web/src/components/public/AboutUbm.tsx` | **95%** | **90%** | 100% | 95% |
| `apps/web/src/components/public/Hero.tsx` (改修ブロック) | **95%** | **90%** | 100% | 95% |
| `apps/web/src/components/public/Stats.tsx` (改修ブロック) | **95%** | **90%** | 100% | 95% |
| `apps/web/src/components/public/Timeline.tsx` (改修ブロック) | **95%** | **90%** | 100% | 95% |
| `apps/web/app/page.tsx` (改修ブロック) | **90%** | **85%** | 90% | 90% |

> 既存 (本タスクで変更しない) 行は対象外。`pnpm coverage --changed` ベースで実測する。

## 10. targeted vitest コマンド (FB-UI-02-2 対応)

```bash
# public unit + page smoke
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/Hero.spec.tsx \
  apps/web/src/components/public/__tests__/Stats.spec.tsx \
  apps/web/src/components/public/__tests__/AboutUbm.spec.tsx \
  apps/web/src/components/public/__tests__/Timeline.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/app/__tests__/page.spec.tsx

# Playwright smoke (4 viewport)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/public-home-visual.spec.ts \
  --project=chromium
```

## 11. Props vs Internal state 判定マトリクス (VSCPKR-03)

| Component | selected/active state | sort state | drawer open state | loading state |
| --- | --- | --- | --- | --- |
| `Hero` | — | — | — | — |
| `Stats` | — | — | — | — |
| `AboutUbm` | — | — | — | — |
| `Timeline` | — | — | — | — |
| `MemberGrid` | — | — | — | — |

すべて pure server presentation。internal `useState` は持たない。

## 12. DoD (Phase 4)

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 4
- workflow_state: `spec_created`

## 目的

Phase 5 実装を先に壊す test contract と visual smoke の対象を定義する。

## 実行タスク

- 5 component の unit test と新規 `AboutUbm` test を定義する
- route smoke と prototype copy contract を定義する
- Playwright smoke と screenshot evidence の境界を定義する

## 参照資料

- `phase-2-design.md`
- `phase-5-implementation.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`

## 成果物/実行手順

- TC-ID と対象 file を Phase 5 / 6 / 11 へ渡す

## 統合テスト連携

- Vitest targeted commands と Playwright smoke を Phase 9 / 11 の証跡に接続する

## 完了条件

- TC-ID、対象 file、期待結果、実行コマンドが揃っている

- [ ] 本 Phase 計画の TC 表 (TC-HERO / TC-STATS / TC-ABOUT / TC-TL / TC-MG / TC-PAGE / TC-SMK) が確定している
- [ ] mock 戦略・コマンド・カバレッジ目標が明文化されている
- [ ] Phase 5 実装が本計画の TC を網羅できる test 配置を採用していること
- [ ] Phase 11 の VISUAL 評価と Phase 4 の DOM 評価が二重実装にならないこと
