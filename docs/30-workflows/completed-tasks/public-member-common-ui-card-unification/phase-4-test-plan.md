---
spec_classification: implementation_spec
state: spec_created
phase: 4
phase_name: テスト作成
task_id: public-member-common-ui-card-unification
---

# Phase 4: テスト作成（TDD Red）

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | 新プリミティブ6種の component spec 新規作成 + 既存8画面 spec の selector 棚卸し |
| TDD フェーズ | Red（実装前に spec を書き、`*.spec.tsx` が FAIL することを確認） |
| テスト環境 | jsdom（`@media` 非適用前提・data 属性 / role / className の構造検証） |
| 新規 spec ファイル規約 | `*.spec.tsx` のみ（`*.test.*` は I-9 で禁止）/ PascalCase コンポーネント名 |

> 新層6プリミティブは全て **presentational / stateless**（Phase 2「状態所有権」表）。よって全テストケースの操作対象は **external prop**（render 入力）であり、**internal state は 0**。各 TC に「prop / state」列を明記する。

---


## 目的

新プリミティブの component spec（TDD Red）と、既存8画面 spec の selector 棚卸し（I-7 機械可読 ID 保全）を設計する。

## 実行タスク

1. 新プリミティブ6種それぞれの component spec ファイルを設計し、テストケース表（TC-4-N）を確定する。
2. 既存8画面 spec の selector（`getByRole` / `getByTestId` / `data-component`）を棚卸しし、移行で壊さない「固定契約」として一覧化する（I-7）。
3. TDD Red を確認する実行コマンド（focused vitest）を確定する。

---

## 1. 新規 spec ファイル一覧

| # | spec ファイル（新規） | 対象コンポーネント | 種別 |
|---|----------------------|------------------|------|
| S1 | `apps/web/src/components/ui/layout/__tests__/PageShell.spec.tsx` | `PageShell` | stateless |
| S2 | `apps/web/src/components/ui/layout/__tests__/PageHeader.spec.tsx` | `PageHeader` | stateless |
| S3 | `apps/web/src/components/ui/layout/__tests__/SectionCard.spec.tsx` | `SectionCard` | stateless |
| S4 | `apps/web/src/components/ui/layout/__tests__/ContentCard.spec.tsx` | `ContentCard` | stateless |
| S5 | `apps/web/src/components/ui/layout/__tests__/Prose.spec.tsx` | `Prose` | stateless |
| S6 | `apps/web/src/components/ui/__tests__/ButtonLink.spec.tsx` | `ButtonLink` | stateless |

> spec の書き方規約は既存 `apps/web/src/components/ui/__tests__/primitives.component.spec.tsx` に準拠:
> - `import { describe, it, expect, afterEach } from "vitest";`
> - `import { render, screen, cleanup } from "@testing-library/react";` + `afterEach(() => cleanup());`
> - `data-*` 検証は `el.getAttribute("data-xxx")`、role 検証は `screen.getByRole(...)`、className 検証は `el.className` を使う。

---

## 2. テストケース表（TC-4-N）

> 列「対象」: 全プリミティブは props 受領のみ。よって全件 `prop`（external）。`state` は 0 件。

### S1. PageShell（`data-component="page-shell"`）

| TC | 対象 | render 入力 | 期待（assert） |
|----|------|------------|---------------|
| TC-4-1 | prop | `<PageShell>x</PageShell>`（既定） | root に `data-component="page-shell"` / `data-max-width="default"` / `data-bg="base"` / `data-gap="lg"` が付与。`className` に `ui-page-shell` を含む |
| TC-4-2 | prop | `maxWidth="narrow"` | `data-max-width="narrow"` |
| TC-4-3 | prop | `background="bare"` | `data-bg="bare"` |
| TC-4-4 | prop | `gap="sm"` | `data-gap="sm"` |
| TC-4-5 | prop | `className="x-extra"` | className に `ui-page-shell` と `x-extra` の両方を含む（透過） |
| TC-4-6 | prop | `<PageShell><p>child</p></PageShell>` | children（`child`）が描画される |

### S2. PageHeader（`data-component="page-header"`）

| TC | 対象 | render 入力 | 期待 |
|----|------|------------|------|
| TC-4-7 | prop | `title="会員一覧"` | `screen.getByRole("heading", { level: 1, name: "会員一覧" })` が存在（h1 / serif の正本） |
| TC-4-8 | prop | `eyebrow="MEMBERS"` + title | `ui-page-header__eyebrow` を持つ要素に `MEMBERS` が描画 |
| TC-4-9 | prop | `lead="紹介文"` + title | `ui-page-header__lead` に `紹介文` が描画 |
| TC-4-10 | prop | `actions={<button>密度</button>}` + title | actions slot（`ui-page-header__actions`）内に `button[name=密度]` が存在 |
| TC-4-11 | prop | 既定 | root に `data-align="start"` |
| TC-4-12 | prop | `align="center"` | `data-align="center"` |
| TC-4-13 | prop | eyebrow / lead 未指定 | eyebrow / lead 要素が DOM に出ない（`querySelector(".ui-page-header__eyebrow")` が null） |

### S3. SectionCard（`data-component="section-card"`）

| TC | 対象 | render 入力 | 期待 |
|----|------|------------|------|
| TC-4-14 | prop | 既定 + children | root に `data-component="section-card"` / `data-tone="default"` / `data-padding="md"`。className に `ui-section-card` |
| TC-4-15 | prop | `tone="accent"` | `data-tone="accent"` |
| TC-4-16 | prop | `padding="lg"` | `data-padding="lg"` |
| TC-4-17 | prop | `title="事業概要"` | `ui-section-card__head` 内に title。`screen.getByText("事業概要")` 存在 |
| TC-4-18 | prop | `description="補足"` + title | `ui-section-card__head` 内に description |
| TC-4-19 | prop | `actions={<a>more</a>}` + title | head の actions slot に `a` が存在 |
| TC-4-20 | prop | title 未指定 | head（`.ui-section-card__head`）が DOM に出ない（枠のみ） |
| TC-4-21 | prop | `as="article"` | root の tagName が `ARTICLE` |
| TC-4-22 | prop | 既定（`as` 未指定） | root の tagName が `SECTION` |
| TC-4-23 | prop | `id="member-detail-business"` | root に `id="member-detail-business"`（機械可読 ID 透過・I-7） |
| TC-4-24 | prop | children | `ui-section-card__body` 内に children が描画 |

### S4. ContentCard（`data-component="content-card"`）

| TC | 対象 | render 入力 | 期待 |
|----|------|------------|------|
| TC-4-25 | prop | children のみ（href なし） | root tagName が `ARTICLE`。`data-component="content-card"`。className に `ui-content-card` |
| TC-4-26 | prop | `href="/members/abc"` | root tagName が `A`。`screen.getByRole("link")` が存在し `href` 末尾が `/members/abc` |
| TC-4-27 | prop | `href` + `interactive` | root に `data-interactive="true"` |
| TC-4-28 | prop | `href` のみ（`interactive` 未指定） | `data-interactive` が付かない（hover 演出なし。回帰は Phase 6 TC-6-3） |
| TC-4-29 | prop | `heading="氏名"` | heading slot に `氏名` |
| TC-4-30 | prop | `media={<span data-testid="m" />}` | media slot 内に `[data-testid=m]` が存在 |
| TC-4-31 | prop | `footer={<span>meta</span>}` | footer slot に `meta` |
| TC-4-32 | prop | `tone="subtle"` | `data-tone="subtle"` |
| TC-4-33 | prop | `padding="sm"` | `data-padding="sm"` |
| TC-4-34 | prop | 既定 | `data-tone="default"` / `data-padding="md"` |

### S5. Prose（`data-component="prose"`）

| TC | 対象 | render 入力 | 期待 |
|----|------|------------|------|
| TC-4-35 | prop | `<Prose><h2>条項</h2><p>本文</p></Prose>` | root に `data-component="prose"`。className に `ui-prose` |
| TC-4-36 | prop | 既定 | `data-size="default"` |
| TC-4-37 | prop | `size="compact"` | `data-size="compact"`（回帰は Phase 6 TC-6-4） |
| TC-4-38 | prop | 子に `<h2>` `<p>` `<a>` | 子孫タイポ適用の前提として `.ui-prose` 配下に `h2` / `p` / `a` が DOM 上に存在（jsdom は CSS 非適用のため、適用は構造で検証） |
| TC-4-39 | prop | `className="legal"` | className に `ui-prose` と `legal` 両方 |

### S6. ButtonLink（既存 `ui/__tests__/ButtonLink.spec.tsx`）

> **正本契約**: ButtonLink は `Button.buttonVariants()` と同一の className を anchor で出す。テストでは `buttonVariants` を import して期待値を導出する（手書きの文字列比較ではなく `buttonVariants` の出力一致を assert）。これにより Button/ButtonLink の視覚等価を機械的に保証（Phase 3 リスク表「ButtonLink と Button の見た目差異」対策）。

| TC | 対象 | render 入力 | 期待 |
|----|------|------------|------|
| TC-4-40 | prop | `<ButtonLink href="/x">登録</ButtonLink>`（既定 variant=`ghost` / size=`md`） | `screen.getByRole("link", { name: "登録" })` が存在 |
| TC-4-41 | prop | 既定 | root の className が `buttonVariants({ variant: "ghost", size: "md" })` と一致（= `ui-button ui-button-ghost ui-button-md`） |
| TC-4-42 | prop | `variant="primary"` | className が `buttonVariants({ variant: "primary", size: "md" })` と一致。`data-variant="primary"` |
| TC-4-43 | prop | `size="lg"` | className が `buttonVariants({ variant: "ghost", size: "lg" })` と一致 |
| TC-4-44 | prop | `block` | className に `ui-button-block` を含む |
| TC-4-45 | prop | `href="/register"` | root tagName が `A`、`href` 末尾が `/register`（anchor 正本） |
| TC-4-46 | prop | `leftIcon={<span data-testid="li" />}` | `[data-testid=li]` が描画され `aria-hidden="true"` ラッパ内 |
| TC-4-47 | prop | `rightIcon={<span data-testid="ri" />}` | `[data-testid=ri]` が `aria-hidden="true"` ラッパ内 |
| TC-4-48 | prop | `target="_blank"` 等の `...rest` 透過 | root に `target="_blank"` が付与（`AnchorHTMLAttributes` 透過） |

---

## 3. 既存8画面 spec の selector 棚卸し（I-7 固定契約）

> **目的**: 移行で `getByRole` / `getByTestId` / `data-component` が壊れないことを移行前に確定する。新プリミティブでラップ／置換する際、下表の selector は **必ず引き継ぐ**（SectionCard の `id` / ContentCard の透過 props / Button の機械可読 ID）。

### 棚卸しコマンド（移行前に実行・差分を Phase 9 で再確認）

```bash
# 8画面 page.spec + 関連コンポーネント spec の selector を全列挙
grep -rn "data-testid\|getByRole\|getByTestId\|data-component\|getByLabelText" \
  "apps/web/app/(public)" \
  "apps/web/app/(member)/profile" \
  "apps/web/app/(auth)/login" \
  apps/web/src/components/public \
  apps/web/src/components/legal
```

### 固定契約一覧（壊してはいけない selector）

| 画面 / spec | selector（契約） | 引き継ぎ方法（移行時） |
|------------|-----------------|----------------------|
| `/`（`(public)/page.spec.tsx`） | `[data-component="public-header"]` / `[data-component="public-footer"]`（layout 由来・本移行では非接触）、`getByText("活動指標を読み込めませんでした")` / `getByText("メンバー情報を読み込めませんでした")` | エラー文言は SectionCard 内に移動しても **テキスト不変**。layout の header/footer は移行対象外 |
| `/members`（`members/page.spec.tsx`） | `getByRole("search")`（MemberFilters 内）、`getByRole("alert")`（エラー）、`getByRole("status")`（live region） | MemberFilters を SectionCard でラップしても `role=search` は内側コンポーネントに残す。alert/status はテキスト不変で SectionCard 内に移動 |
| `/members/[id]`（`members/[id]/page.spec.tsx`） | `getByRole("alert")`（エラー文言） | エラー Banner はカード内へ移動してもテキスト/role 不変 |
| `/login`（`LoginCard.component.spec.tsx`） | `getByRole("heading", { level: 1 })`、`getByTestId("login-card")` + `data-component="login-card"` + `data-state` | **重要**: LoginCard を SectionCard(auth) に置換する際、`data-testid="login-card"` / `data-component="login-card"` / `data-state` を SectionCard の透過 props（`id` 不可、`data-*` は spread）で必ず保持。h1 は PageHeader か SectionCard title 経由で `level:1` 維持 |
| `/profile`（`EditCta.component.spec.tsx`） | `getByRole("button", { name: /情報を更新する/ })` / `getByRole("dialog")` / `getByRole("button", { name: /キャンセル/ })` / `getByRole("button", { name: /フォームを開いて更新/ })` | EditCta は client のまま PageHeader の `actions` slot に配置。button の name（aria-label / テキスト）不変 |
| `/profile`（`ProfileHeader.component.spec.tsx` 他 _components 群） | `getByRole` / `getByTestId`（各 _components） | 各 _components は SectionCard 内に**そのまま内包**。DOM を二重描画しない（testid 重複回避）。selector 不変 |
| `/privacy`・`/terms` | （LegalProse の見出し/本文。spec があれば role/heading） | LegalProse → `Prose` 縮退時、h1 は PageHeader へ、h2/h3/本文は Prose 内に**テキスト不変**で移動 |

> **検証**: 上記 selector が移行後も全て解決すること（= 既存 spec GREEN）が AC-7。Phase 6 で回帰テストとして再確認、Phase 9 で grep diff 確認。

---

## 4. TDD Red 期待

- S1〜S6 の spec は **実装ファイル（`PageShell.tsx` 等 + `index.ts` barrel + `ButtonLink.tsx`）が存在しない／export されていない**ため、import 解決失敗で RED になる（TDD Red 確認）。
- 命名規則整合（実装前に確定）:
  - コンポーネント: PascalCase（`PageShell` / `ContentCard` / `ButtonLink`）。
  - spec ファイル: `*.spec.tsx`（`*.test.*` 禁止・I-9）。
  - CSS クラス: `.ui-page-shell` / `.ui-page-header` / `.ui-section-card` / `.ui-content-card` / `.ui-prose` / `.ui-button-link`（`.ui-*` 規則・Phase 1 §命名規則）。
  - barrel: `components/ui/layout/index.ts`（layout 群）/ `components/ui/index.ts` に ButtonLink 追加。
- RED → Phase 5 実装で GREEN へ遷移する。

---

## 5. 実行コマンド（focused vitest）

> focused run は **ルートの `vitest.config.ts`** を使い、spec ファイルを**ルートからのフルパス**で指定する（package dir 相対の filter は include glob に非マッチになるため・MEMORY 既知教訓）。

```bash
# 個別 spec（TDD Red 確認 → 実装後 GREEN）
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout/__tests__/PageShell.spec.tsx
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout/__tests__/PageHeader.spec.tsx
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout/__tests__/SectionCard.spec.tsx
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout/__tests__/ContentCard.spec.tsx
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout/__tests__/Prose.spec.tsx
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/__tests__/ButtonLink.spec.tsx

# 新層 + ButtonLink まとめて
mise exec -- pnpm vitest run --config vitest.config.ts apps/web/src/components/ui/layout apps/web/src/components/ui/__tests__/ButtonLink.spec.tsx

# 全 apps/web spec（最終確認・package script 経由）
mise exec -- pnpm --filter @ubm/web test
```

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| spec 規約の見本 | `apps/web/src/components/ui/__tests__/primitives.component.spec.tsx` | render/cleanup/getByRole/getAttribute の書き方 |
| variant 等価の根拠 | `apps/web/src/components/ui/Button.tsx`（`buttonVariants`） | ButtonLink className 期待値の導出元 |
| Card 合成元 | `apps/web/src/components/ui/Card.tsx` | SectionCard 内部合成の className 参照 |
| 既存画面 spec（契約棚卸し） | `apps/web/app/(public)/**/page.spec.tsx` / `apps/web/app/(auth)/login/_components/__tests__/LoginCard.component.spec.tsx` / `apps/web/app/(member)/profile/_components/__tests__/EditCta.component.spec.tsx` | I-7 固定契約の出所 |
| props シグネチャ | `phase-2-design.md` §プリミティブ設計 A-1..A-7 | テスト入力の確定 |
| vitest config | `vitest.config.ts`（リポジトリルート） | focused run の `--config` 指定先 |

---


## 成果物

- `phase-4-test-plan.md`（新規 spec ファイル一覧 / TC-4-N テストケース表 / 既存 selector 棚卸し / focused vitest コマンド）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] 新プリミティブ6種の spec ファイルパスとテストケース表（TC-4-1..TC-4-48）が確定し、各ケースに「prop / state」が明記されている（全件 prop / state 0）。
- [ ] 既存8画面 spec の selector 棚卸し（固定契約一覧）と grep コマンドが確定している（I-7）。
- [ ] TDD Red 期待（命名規則整合・import 解決失敗で RED）が記述されている。
- [ ] focused vitest 実行コマンド（ルート config + フルパス指定）が確定している。
