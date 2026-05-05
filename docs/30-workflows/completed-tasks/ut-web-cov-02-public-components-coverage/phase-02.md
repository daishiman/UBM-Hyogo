# Phase 2: 設計 — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 2 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

対象 7 component の Vitest unit test 構造、共通 fixture、render helper、mock 方針を確定する。CONST_005 必須項目 (変更対象ファイル / 関数シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD) を網羅する。

## CONST_005 必須項目

### 1. 変更対象ファイル

```
apps/web/src/components/public/__tests__/Hero.test.tsx                 (新規)
apps/web/src/components/public/__tests__/MemberCard.test.tsx           (新規)
apps/web/src/components/public/__tests__/ProfileHero.test.tsx          (新規)
apps/web/src/components/public/__tests__/StatCard.test.tsx             (新規)
apps/web/src/components/public/__tests__/Timeline.test.tsx             (新規)
apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx  (新規)
apps/web/src/components/feedback/__tests__/EmptyState.test.tsx         (新規)
apps/web/src/test/fixtures/public.ts                                    (新規, 共通 fixture)
```

### 2. 対象 component シグネチャ (実コードから引用)

```ts
// Hero.tsx
export interface HeroProps {
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}
export function Hero(props: HeroProps): JSX.Element;

// MemberCard.tsx
export type Density = "comfy" | "dense" | "list";
export interface MemberCardProps { member: PublicMemberListItem; density?: Density; }
export function MemberCard(props: MemberCardProps): JSX.Element;

// ProfileHero.tsx
export interface ProfileHeroProps {
  memberId: string; fullName: string; nickname: string;
  occupation: string; location: string;
  ubmZone: string | null; ubmMembershipType: string | null;
}
export function ProfileHero(props: ProfileHeroProps): JSX.Element;

// StatCard.tsx
export interface StatCardProps { stats: PublicStatsView; }
export function StatCard(props: StatCardProps): JSX.Element;

// Timeline.tsx
export interface TimelineEntry { sessionId: string; title: string; heldOn: string; }
export interface TimelineProps { entries: TimelineEntry[]; }
export function Timeline(props: TimelineProps): JSX.Element | null;  // entries 0件で null

// FormPreviewSections.tsx
export interface FormPreviewSectionsProps { preview: FormPreviewView; }
export function FormPreviewSections(props: FormPreviewSectionsProps): JSX.Element;

// EmptyState.tsx
export interface EmptyStateProps {
  title: string; description?: string;
  resetHref?: string; resetLabel?: string;
  children?: ReactNode;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
```

### 3. 入出力 (代表例)

- Hero(`title="支部会"`) → `<section data-component="hero">` 内に `<h1>支部会</h1>`、subtitle 未指定時 `<p>` 不在、cta なしで `<a>` 不在。
- MemberCard(member, density="list") → `data-density="list"` かつ `data-role="occupation"` 不在、`<a href="/members/${memberId}">`。
- StatCard(stats with zoneBreakdown=[]) → `<dl data-role="zone">` は空でもレンダリング、`memberCount` 表示。
- Timeline(entries=[]) → `null` を返す (assert で `container.firstChild === null`)。
- FormPreviewSections(preview) → 同 `sectionKey` を持つ field を 1 セクションに集約、visibility ラベルが日本語 (`公開`/`会員のみ`/`管理者のみ`) に変換、未知 visibility は raw 文字列を表示。
- EmptyState(resetHref present, resetLabel 既定) → `<a data-role="reset">絞り込みをクリア</a>` を出力。

### 4. テスト方針

- フレームワーク: Vitest + `@testing-library/react` + `@testing-library/user-event` + `jsdom` (root `vitest.config.ts` 既定)。
- Render helper: `apps/web/src/test/render.tsx` (既存 helper があればそれを使用、無ければ `apps/web/src/test/render.tsx` を新規追加し `render` を re-export)。
- 共通 fixture: `apps/web/src/test/fixtures/public.ts` に `makeMember`, `makeStats`, `makeFormPreview`, `makeTimelineEntry` を定義。`@ubm-hyogo/shared` の Zod schema を `parse` して型整合を保証する。
- Mock 方針:
  - `next/image`, `next/link`, `framer-motion` — 対象コンポーネントで未使用のため mock 不要。
  - `@ubm-hyogo/shared` — 実体を import (型と Zod schema を契約として利用、不変条件 #5 を満たす)。
  - 内部依存 `Avatar` (components/ui/Avatar) — 実体を import (純粋関数で副作用なし)。`role="img"` と `aria-label` を assertion で利用。
  - DOM API / fetch / D1 — 不要。本タスクは純粋 presentation component のみ。
- アサーション: `getByRole`, `getByText`, `queryByText`, `getByLabelText`, `toHaveAttribute`, `toHaveTextContent`。`toMatchSnapshot` 禁止。

### 5. ローカル実行コマンド

```bash
# 個別 (pattern を渡す)
mise exec -- pnpm --filter @ubm-hyogo/web test -- Hero.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberCard.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- ProfileHero.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- StatCard.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- Timeline.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- FormPreviewSections.test
mise exec -- pnpm --filter @ubm-hyogo/web test -- EmptyState.test

# coverage 全件
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

> 実 filter 名は `@ubm-hyogo/web`、test script 名は `test`（`test` alias は Phase 5 で `apps/web/package.json` に追加するか、`pnpm --filter @ubm-hyogo/web test -- <pattern>` に置換する）。

### 6. DoD

- 7 テストファイルが green
- per-file coverage が AC-1 を満たす
- 既存 web test suite に regression なし
- snapshot 依存 0 件 (`grep -r toMatchSnapshot apps/web/src/components/{public,feedback}/__tests__` が 0)

## テスト構造設計

### ディレクトリレイアウト

```
apps/web/src/
├── components/
│   ├── feedback/
│   │   ├── EmptyState.tsx
│   │   └── __tests__/
│   │       └── EmptyState.test.tsx          (新規)
│   └── public/
│       ├── Hero.tsx
│       ├── MemberCard.tsx
│       ├── ProfileHero.tsx
│       ├── StatCard.tsx
│       ├── Timeline.tsx
│       ├── FormPreviewSections.tsx
│       └── __tests__/                        (新規ディレクトリ)
│           ├── Hero.test.tsx
│           ├── MemberCard.test.tsx
│           ├── ProfileHero.test.tsx
│           ├── StatCard.test.tsx
│           ├── Timeline.test.tsx
│           └── FormPreviewSections.test.tsx
└── test/
    ├── render.tsx                             (helper)
    └── fixtures/
        └── public.ts                          (新規 fixture)
```

### 共通 fixture (`apps/web/src/test/fixtures/public.ts`) のシグネチャ

```ts
export function makeMember(overrides?: Partial<PublicMemberListItem>): PublicMemberListItem;
export function makeStats(overrides?: Partial<PublicStatsView>): PublicStatsView;
export function makeFormPreview(overrides?: Partial<FormPreviewView>): FormPreviewView;
export function makeTimelineEntry(overrides?: Partial<TimelineEntry>): TimelineEntry;
```

すべて `Z.parse(...)` 経由で生成し、shared の Zod 契約に整合させる。

### Render helper (`apps/web/src/test/render.tsx`)

```ts
export { render, screen, within } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
```

### Mock 方針サマリ

| 依存 | 対象 component | 方針 | 理由 |
| --- | --- | --- | --- |
| next/image | なし | 不要 | 対象コードで未使用 |
| next/link | なし | 不要 | 対象は plain `<a>` 使用 |
| framer-motion | なし | 不要 | 対象で未使用 |
| @ubm-hyogo/shared | StatCard / MemberCard / FormPreviewSections | 実体 import | 契約として利用、不変条件 #5 |
| components/ui/Avatar | MemberCard / ProfileHero | 実体 import | 純粋関数、`role="img"` を assert に活用 |
| D1 / fetch | なし | 不要 (禁止) | 不変条件 #6 |

## 各コンポーネントの想定テストケース (最低 3 ケース)

### Hero.test.tsx
1. happy: 全 props 指定で `<h1>`/`<p>`/primary `<a>`/secondary `<a>` 全表示
2. empty: subtitle / cta 全省略時に対応 element が存在しない
3. variant: primaryCta のみ指定時、secondary `<a>` 不在 / primary href が正しい

### MemberCard.test.tsx
1. happy: density="comfy" で name/occupation/location/zone/status 全表示
2. empty: nickname/ubmZone/ubmMembershipType を null/undefined にしたとき各 element 不在
3. interaction/variant: density="list" で occupation 非表示、`<a href="/members/${memberId}">` リンク先確認

### ProfileHero.test.tsx
1. happy: 全 props で fullName/nickname/occupation/location/zone/status 表示
2. empty: ubmZone=null, ubmMembershipType=null, nickname="" で badge / nickname element 不在
3. variant: Avatar が `aria-label={fullName}` で size="lg" 属性を持つ

### StatCard.test.tsx
1. happy: memberCount/publicMemberCount/meetingCountThisYear 表示 + zoneBreakdown 各 zone の dt/dd
2. empty: zoneBreakdown=[] で `<dl>` は存在するが子 `<div>` 0 個
3. variant: 数値 0 の memberCount を含む stats でも 0 が表示される (falsy 表示確認)

### Timeline.test.tsx
1. happy: 3 件 entries で `<ol>` 内に 3 `<li>`、`<time dateTime>` 属性が heldOn
2. empty: entries=[] で `container.firstChild === null`
3. variant: 1 件のみで heading "最近の支部会" と単一 `<li>` 表示

### FormPreviewSections.test.tsx
1. happy: 2 セクション × 各 2 field を渡し、`data-section-key` 単位で集約 / `data-stable-key` を保持 / visibility 日本語ラベル変換
2. empty: fields=[] で `<p>` のみ表示 (sectionCount テキスト含む) / `<section data-section-key>` 不在
3. variant: required=true / false の混在、未知 visibility 値の raw 表示 fallback (`VISIBILITY_LABEL[v] ?? v`)

### EmptyState.test.tsx
1. happy: title + description + resetHref 指定で reset link 表示 (`resetLabel` 既定 "絞り込みをクリア")
2. empty: description / resetHref 省略で対応 element 不在
3. variant: children を渡したときに children が描画される / カスタム `resetLabel` 反映 / `role="status"`

## テストアーキテクチャ図 (mermaid)

```mermaid
flowchart TD
  T[Test files] --> RH[render helper<br/>apps/web/src/test/render.tsx]
  T --> FX[fixtures<br/>apps/web/src/test/fixtures/public.ts]
  FX --> SH["@ubm-hyogo/shared (Zod parse)"]
  T --> COMP[Public/Feedback Components]
  COMP --> AV[Avatar (実体)]
  COMP -. 不要 .-> NI[next/image]
  COMP -. 不要 .-> NL[next/link]
  COMP -. 禁止 .-> D1[(D1 binding)]
  T --> COV[apps/web/coverage/coverage-summary.json]
```

## 多角的チェック観点

- #2 responseId/memberId separation — fixture で `memberId` のみ生成し、responseId と混同しない
- #5 public/member/admin boundary — admin/member component を import しない
- #6 apps/web D1 direct access forbidden — テストから DB binding を呼ばない
- coverage exclude 追加禁止
- 未知 visibility 値などの fallback 経路を含めて branch カバレッジ ≥80% を狙う

## サブタスク管理

- [ ] 各 component の props と expected output を実コードと突き合わせ済み
- [ ] 共通 fixture / render helper を Phase 5 で実装可能な詳細度まで設計済み
- [ ] mock 方針が不要 mock を含まないことを確認済み
- [ ] outputs/phase-02/main.md を作成済み

## 成果物

- outputs/phase-02/main.md

## 完了条件

- 全対象 Stmts/Lines/Funcs ≥85% / Branches ≥80%
- 各 component に happy / empty-or-null-data / interaction-or-prop-variant の最低 3 ケース
- snapshot 依存ではなく明示 assertion
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] CONST_005 必須 6 項目すべて記載済み
- [ ] 対象 7 ファイルの test ケースを最低 3 ずつ列挙済み
- [ ] mock 方針が不変条件 #2/#5/#6 に抵触しない

## 次 Phase への引き渡し

Phase 3 へ、テスト構造、fixture/helper 配置、mock マトリクス、各 component 想定ケース表、CONST_005 一式を渡す。
