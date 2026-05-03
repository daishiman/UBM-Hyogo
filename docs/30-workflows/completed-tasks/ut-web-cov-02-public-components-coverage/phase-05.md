# Phase 5: 実装ランブック — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 5 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 4 のテスト戦略を 1 ファイル単位の実装手順に展開し、AAA (Arrange/Act/Assert) パターンに従ったテストファイルを順次新規作成するためのランブックを確定する。

## 共通前提

- 既存 admin test (`apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx` など) と同じ import 規約。
- `render` / `screen` / `fireEvent` / `cleanup` は `@testing-library/react` から import。
- 各テストファイル冒頭で `afterEach(() => cleanup())` を配置。
- presentational のため `vi.mock` は原則不要。`Avatar` も実装をそのまま render。
- fixture は Phase 8 で導入する `apps/web/src/test-utils/fixtures/public.ts` から import (Phase 8 が先行できない場合は inline fixture から開始可)。

## CONST_005 必須項目 (ランブック総括)

### 変更対象ファイル一覧

| パス | 区分 | 概要 |
| --- | --- | --- |
| apps/web/src/components/public/__tests__/Hero.test.tsx | 新規 | Hero の 3 ケース |
| apps/web/src/components/public/__tests__/MemberCard.test.tsx | 新規 | MemberCard の 3 ケース |
| apps/web/src/components/public/__tests__/ProfileHero.test.tsx | 新規 | ProfileHero の 3 ケース |
| apps/web/src/components/public/__tests__/StatCard.test.tsx | 新規 | StatCard の 3 ケース |
| apps/web/src/components/public/__tests__/Timeline.test.tsx | 新規 | Timeline の 3 ケース |
| apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx | 新規 | FormPreviewSections の 3 ケース |
| apps/web/src/components/feedback/__tests__/EmptyState.test.tsx | 新規 | EmptyState の 3 ケース |

### 主要な関数・型のシグネチャ

Phase 4 の表に従う。各 component の named export を直接 import する。

### 入力・出力・副作用

- 入力: render に渡す props のみ。
- 出力: DOM への描画 (`data-component` / `data-role` 属性で assertion)。
- 副作用: なし。fetch / timer / storage は触らない。

### テスト方針

- AAA: Arrange (props 構築) → Act (`render`) → Assert (`screen.getByX` / `queryByX`)。
- snapshot 禁止。明示 assertion (`toHaveTextContent`, `toHaveAttribute`, `toBeNull`, `toHaveLength`) を使用。

### ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/Hero.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/MemberCard.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/ProfileHero.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/StatCard.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/Timeline.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/FormPreviewSections.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/feedback/__tests__/EmptyState.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

### DoD

- 7 ファイル × 3 ケース = 21 case 以上が green。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` / `lint` / `test` が PASS。
- file-level coverage Stmts/Lines/Funcs ≥85% / Branches ≥80%。

---

## ファイル別ランブック

### F-1. Hero.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/Hero.test.tsx`
- import: `vitest` (`describe, it, expect, afterEach`), `@testing-library/react` (`render, screen, cleanup`), `../Hero` (`Hero`)
- mock: なし
- AAA 骨格:
  - `it("renders title and subtitle and both CTAs")` — Arrange: `props={title,subtitle,primaryCta,secondaryCta}`. Act: `render(<Hero {...props} />)`. Assert: `getByRole("heading",{level:1})`, subtitle text, link × 2 と `data-variant`。
  - `it("omits subtitle and CTA items when not provided")` — Arrange: title のみ。Assert: subtitle が null、`[data-role="cta"]` の `<a>` 数が 0。
  - `it("renders only primary CTA when secondary is missing")` — Assert: `data-variant="primary"` 1, `data-variant="secondary"` 0。
- DoD: 3 ケース green、Hero.tsx の lines/branches ≥85/80。

### F-2. MemberCard.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/MemberCard.test.tsx`
- import: vitest, RTL, `../MemberCard` (`MemberCard`), `../../../test-utils/fixtures/public` (`buildMember`)
- mock: なし (Avatar は実装そのまま)
- AAA 骨格:
  - `it("renders all member fields and link to detail page")` — Arrange: `buildMember()`. Assert: `getByRole("link")` の `href === "/members/{memberId}"`、name/nickname/occupation/location/zone/status text。
  - `it("hides optional fields when nickname/zone/membershipType are null")` — Assert: それぞれ `data-role` が存在しない。
  - `it("changes layout per density")` — `comfy/dense/list` を順に render & cleanup。Assert: `data-density` 属性、`list` 時 occupation 非表示。
- DoD: 3 ケース green、MemberCard.tsx Branches ≥80。

### F-3. ProfileHero.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/ProfileHero.test.tsx`
- import: vitest, RTL, `../ProfileHero`
- mock: なし
- AAA 骨格:
  - `it("renders all fields and badges when zone and membershipType present")` — Assert: `<h1>` text、`[data-key="zone"]` / `[data-key="status"]`。
  - `it("renders empty badges container when zone and membershipType are null")` — Assert: `[data-role="badges"]` の childElementCount === 0。
  - `it("omits nickname row when nickname is empty string")` — Assert: `queryByText(/^@/)` === null。
- DoD: 3 ケース green、ProfileHero.tsx coverage 達成。

### F-4. StatCard.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/StatCard.test.tsx`
- import: vitest, RTL, `../StatCard`, `../../../test-utils/fixtures/public` (`buildStats`)
- mock: なし
- AAA 骨格:
  - `it("renders counts and zoneBreakdown rows")` — Arrange: 3 zones。Assert: `[data-key="member-count"]` 等の text、`dl > div` count === 3。
  - `it("renders empty zone list when zoneBreakdown=[]")` — Assert: `dl[data-role="zone"]` childElementCount === 0。
  - `it("renders zero counts as '0'")` — Assert: `[data-key="member-count"]` の text === "0"。
- DoD: 3 ケース green、StatCard.tsx coverage 達成。

### F-5. Timeline.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/Timeline.test.tsx`
- import: vitest, RTL, `../Timeline`
- mock: なし
- AAA 骨格:
  - `it("renders entries in given order with time[dateTime]")` — 3 entries。Assert: `getAllByRole("listitem").length === 3`、`time` の `dateTime`。
  - `it("returns null when entries=[] (no section rendered)")` — Assert: `container.querySelector('[data-component="timeline"]') === null`。
  - `it("uses sessionId as key without warning")` — Arrange: `vi.spyOn(console,'error')`. Assert: warning 0 件、title text 表示。
- DoD: 3 ケース green、Timeline.tsx Branches ≥80 (early-return 含む)。

### F-6. FormPreviewSections.test.tsx

- 対象 path: `apps/web/src/components/public/__tests__/FormPreviewSections.test.tsx`
- import: vitest, RTL, `../FormPreviewSections`, `../../../test-utils/fixtures/public` (`buildPreview`)
- mock: なし
- AAA 骨格:
  - `it("groups fields by sectionKey and shows visibility label")` — Arrange: 同 sectionKey 2 + 別 sectionKey 1。Assert: section 2 個、`公開` text、`required` バッジ。
  - `it("renders only header copy when fields=[]")` — Assert: `[data-stable-key]` 0 件、概要 `<p>` 表示。
  - `it("falls back to raw visibility string when label map miss")` — Arrange: `visibility="unknown"`. Assert: textContent === "unknown"。
- DoD: 3 ケース green、FormPreviewSections.tsx Branches ≥80。

### F-7. EmptyState.test.tsx

- 対象 path: `apps/web/src/components/feedback/__tests__/EmptyState.test.tsx`
- import: vitest, RTL, `../EmptyState`
- mock: なし
- AAA 骨格:
  - `it("renders title, description, and reset link with default label")` — Assert: `getByRole("status")`、reset `<a>` text === "絞り込みをクリア"。
  - `it("renders only title when description/resetHref/children are absent")` — Assert: description / reset / children 全て null。
  - `it("uses custom resetLabel and renders children slot")` — Arrange: `resetLabel="リセット"`, `children=<button>`。Assert: link text と `getByRole("button")`。
- DoD: 3 ケース green、EmptyState.tsx coverage 達成。

## 参照資料

- Phase 4 テスト戦略
- 既存 test 例: `apps/web/src/components/ui/__tests__/primitives.test.tsx`, `apps/web/src/components/admin/__tests__/MemberDrawer.test.tsx`
- `@ubm-hyogo/shared` の `PublicMemberListItemZ`, `PublicStatsViewZ`, `FormPreviewViewZ`

## 統合テスト連携

- 上流: 04a-parallel-public-directory-api-endpoints
- 下流: 09a-A-staging-deploy-smoke-execution

## 多角的チェック観点

- #2 responseId/memberId separation: fixture に responseId を含めない。
- #5 public/member/admin boundary: public/feedback のみ対象。member/admin import 禁止。
- #6 apps/web D1 direct access forbidden: テスト中 fetch / D1 mock 不要。

## サブタスク管理

- [ ] refs を確認する
- [ ] 各ファイルのテストケース骨格を実装する
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- 7 テストファイルが新規追加され合計 21 case 以上 green。
- file-level coverage 閾値達成。
- 既存 test に regression なし。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない (本仕様書作成段階)

## 次 Phase への引き渡し

Phase 6 へ、各 component の異常入力検証ケースを引き渡す。
