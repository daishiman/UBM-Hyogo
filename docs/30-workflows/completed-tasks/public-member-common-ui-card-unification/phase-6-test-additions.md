---
spec_classification: implementation_spec
state: spec_created
phase: 6
phase_name: テスト拡充
task_id: public-member-common-ui-card-unification
---

# Phase 6: テスト拡充

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 目的 | Phase 4 の正常系に対し、(1) fail path / 既定値 / 回帰 guard、(2) 既存8画面 spec の GREEN 維持、(3) ButtonLink ↔ Button 視覚等価 snapshot を追加 |
| 追加先 | Phase 4 で作成済みの S1〜S6 spec に describe を追記（新規ファイルは増やさない） |
| 環境 | jsdom（`@media` 非適用・data 属性 / role / className で検証） |

---


## 目的

fail path・回帰 guard・ButtonLink↔Button 視覚等価 snapshot を追加し、移行後も既存8画面 spec が GREEN を保つことを担保する。

## 実行タスク

1. fail path / 回帰 guard のテストケース（TC-6-N）を S1〜S6 spec に追加する。
2. 既存8画面 spec が移行後も GREEN を維持することを確認するコマンドと観点を確定する。
3. ButtonLink ↔ Button の視覚等価 snapshot（className 一致）を追加する。

---

## 1. fail path / 既定値 / 回帰 guard（TC-6-N）

| TC | 対象 spec | render 入力 | 期待（回帰 guard） |
|----|-----------|------------|-------------------|
| TC-6-1 | PageShell / SectionCard / ContentCard / Prose | variant 系 prop 未指定 | 既定値が data 属性に出る（`data-max-width="default"` / `data-bg="base"` / `data-gap="lg"` / `data-tone="default"` / `data-padding="md"` / `data-size="default"`）。**未指定で undefined を出さない** |
| TC-6-2 | ContentCard | `href` なし | root tagName が `ARTICLE`（`<a>` にならない）。`screen.queryByRole("link")` が null |
| TC-6-3 | ContentCard | `href` あり + `interactive={false}`（または未指定） | `data-interactive` 属性が **付かない**（hover 演出 CSS が当たらない）。`el.getAttribute("data-interactive")` が null |
| TC-6-4 | Prose | `size="compact"` | `data-size="compact"`。既定 `default` と区別される |
| TC-6-5 | SectionCard | `title` なし | `.ui-section-card__head` が DOM に出ない（枠のみ）。`querySelector(".ui-section-card__head")` が null |
| TC-6-6 | PageHeader | `eyebrow` / `lead` 未指定 | `.ui-page-header__eyebrow` / `.ui-page-header__lead` が共に null（条件描画） |
| TC-6-7 | SectionCard | `as` 未指定 vs `as="div"` | 既定 `SECTION` / 指定時 `DIV`（タグ切替の回帰） |
| TC-6-8 | SectionCard | `data-testid="x"` + `data-component="login-card"` を spread | root の `data-testid="x"` かつ `data-component="login-card"`（既定 `section-card` を上書き・I-7 透過の回帰） |
| TC-6-9 | ButtonLink | `block` 未指定 | className に `ui-button-block` を **含まない**（既定 false） |
| TC-6-10 | ContentCard | `media` / `heading` / `footer` 全て未指定 | 対応 slot（`.ui-content-card__media` 等）が出ず、`.ui-content-card__body` のみ存在（条件描画の回帰） |

---

## 2. ButtonLink ↔ Button 視覚等価 snapshot

> Phase 3 リスク表「ButtonLink と Button の見た目差異（低）」対策。className が完全一致することを機械保証する。snapshot は className 文字列の一致で代替（DOM snapshot より selector が安定）。

| TC | 対象 spec | 入力 | 期待 |
|----|-----------|------|------|
| TC-6-11 | ButtonLink.spec | `variant`/`size`/`block` の全組合せの代表（primary/md、accent/lg+block、ghost/sm） | `ButtonLink` の root className === `buttonVariants({ variant, size, block })`。`Button` と同一文字列 |
| TC-6-12 | ButtonLink.spec | `<ButtonLink variant="primary">x</ButtonLink>` の className を snapshot | `toMatchInlineSnapshot('"ui-button ui-button-primary ui-button-md"')`（Button と同一の出力を固定） |

```tsx
// TC-6-11 例
import { buttonVariants } from "../Button";
it("ButtonLink は Button と同一 className（視覚等価）", () => {
  render(<ButtonLink href="/x" variant="accent" size="lg" block>登録</ButtonLink>);
  const a = screen.getByRole("link", { name: "登録" });
  expect(a.className).toBe(buttonVariants({ variant: "accent", size: "lg", block: true }));
});
```

---

## 3. 既存8画面 spec の回帰（GREEN 維持・AC-7）

> 新規テストは追加しない。Phase 4 §3 で棚卸しした固定契約 selector が、移行後も全て解決すること（= 既存 spec GREEN）を確認する。これが I-7 / AC-7 の検証。

| 画面 | 回帰確認 spec（既存） | 不変であるべき selector |
|------|---------------------|----------------------|
| `/` | `apps/web/app/(public)/page.spec.tsx` | `getByText("活動指標を読み込めませんでした")` / `getByText("メンバー情報を読み込めませんでした")` |
| `/members` | `apps/web/app/(public)/members/page.spec.tsx` | `getByRole("search")` / `getByRole("alert")` / `getByRole("status")` |
| `/members/[id]` | `apps/web/app/(public)/members/[id]/page.spec.tsx` | `getByRole("alert")` |
| `/register` | `apps/web/app/(public)/register/page.spec.tsx`（存在時） | page 見出し / callout の role |
| `/privacy`・`/terms` | LegalProse 関連 spec（存在時） | h1 / 本文見出しテキスト |
| `/profile` | `EditCta.component.spec.tsx` / `ProfileHeader.component.spec.tsx` / `RequestActionPanel.*.spec.tsx` 他 | `getByRole("button", { name: /情報を更新する/ })` / `getByRole("dialog")` / 各 _components の role/testid |
| `/login` | `LoginCard.component.spec.tsx` / `LoginPanel.component.spec.tsx` | `getByTestId("login-card")` / `data-component="login-card"` / `data-state` / `getByRole("heading", { level: 1 })` |

回帰確認コマンド:

```bash
# 移行後、各画面 spec の GREEN を確認（壊れた selector を即検出）
mise exec -- pnpm vitest run --config vitest.config.ts \
  "apps/web/app/(public)" \
  "apps/web/app/(member)/profile" \
  "apps/web/app/(auth)/login"
```

> 1件でも RED なら、当該 selector の引き継ぎ漏れ（Phase 5 §4 の透過 props 未適用）。修正は新層を変えず、移行側で `data-*` / `id` / role を補う。

---

## 4. 実行コマンド

```bash
# 新層 + ButtonLink（TC-4 + TC-6 全体）
mise exec -- pnpm vitest run --config vitest.config.ts \
  apps/web/src/components/ui/layout \
  apps/web/src/components/ui/__tests__/ButtonLink.spec.tsx

# 既存8画面回帰（AC-7）
mise exec -- pnpm vitest run --config vitest.config.ts \
  "apps/web/app/(public)" "apps/web/app/(member)/profile" "apps/web/app/(auth)/login"

# 全 apps/web（最終確認）
mise exec -- pnpm --filter @ubm/web test
```

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| Phase 4 | `phase-4-test-plan.md` | TC-4 正常系・selector 棚卸しの土台 |
| Phase 5 | `phase-5-implementation.md` §4 | 機械可読 ID 引き継ぎ（回帰 guard の根拠） |
| 視覚等価の根拠 | `apps/web/src/components/ui/Button.tsx`（`buttonVariants`） | TC-6-11/12 の期待値導出 |
| 既存画面 spec | `apps/web/app/(public)/**/page.spec.tsx` / `apps/web/app/(auth)/login/_components/__tests__/*.spec.tsx` | 回帰確認対象 |

---


## 成果物

- `phase-6-test-additions.md`（TC-6-N / 視覚等価 snapshot / 既存8画面 GREEN 確認観点）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] fail path / 既定値 / 回帰 guard（TC-6-1..TC-6-10）が S1〜S6 spec に追加され、期待値が確定している。
- [ ] ButtonLink ↔ Button 視覚等価 snapshot（TC-6-11/12）が定義されている。
- [ ] 既存8画面 spec の GREEN 維持（AC-7）の確認観点とコマンドが確定している。
- [ ] 実行コマンド（新層 + 回帰 + 全体）が記述されている。
