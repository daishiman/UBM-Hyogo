# Phase 10: a11y / UX / パフォーマンス品質ゲート

**[実装区分: 実装仕様書]**

WCAG AA / Lighthouse スコア / focus order を品質ゲートとして固定する。

## 1. a11y 自動検証 (jest-axe)

`apps/web/src/components/ui/__tests__/` で jest-axe 基盤が既存（CLAUDE.md / skill quality-gates が前提）。

各 spec に axe assertion を追加:

```ts
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("LoginCard has no a11y violations", async () => {
  const { container } = render(<LoginCard state="input" title="会員ログイン">...</LoginCard>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

対象 component:
- LoginCard
- LoginPanel (input state)
- OrDivider
- LoginStatus (sent / error)

todo / skip 残留禁止 (skill §7.3)。

## 2. Focus order 検証

| 順序 | 要素 | 確認方法 |
|------|------|---------|
| 1 | email input | Tab 1 回目で focus / `document.activeElement === emailInput` |
| 2 | Primary button (マジックリンクを送る) | Tab 2 回目 |
| 3 | Ghost button (Googleでログイン) | Tab 3 回目 |
| 4 | register link (メンバー登録) | Tab 4 回目 |

cooldown / disabled 状態の Primary button は skip され focus が次に移ること。

Playwright で:

```ts
await page.keyboard.press("Tab");
await expect(page.getByLabel("メールアドレス")).toBeFocused();
await page.keyboard.press("Tab");
await expect(page.getByRole("button", { name: /マジックリンク/ })).toBeFocused();
// ...
```

## 3. Color contrast (WCAG AA)

OKLch token 経由なので token 自体の lightness 差で AA を保証。

| ペア | 期待比 | 確認 |
|------|--------|------|
| text on surface | ≥ 7:1 (AAA) | tokens.css の `--ubm-color-text` vs `--ubm-color-surface` |
| accent-ink on accent-soft | ≥ 4.5:1 (AA Large) | brand-mark |
| ok on ok-soft | ≥ 4.5:1 | sent icon block |
| accent on surface | ≥ 4.5:1 | register link / primary button label |
| border on surface | ≥ 3:1 (UI) | 罫線視認性 |

DevTools の Accessibility Inspector で各ペアの contrast を確認、または Lighthouse の "Background and foreground colors do not have a sufficient contrast ratio" を 0 件にする。

## 4. Lighthouse スコア期待値

`/login` (input state) で Lighthouse (mobile / DevTools 既定) を実行:

| カテゴリ | 期待 |
|---------|------|
| Performance | 85+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 90+ |

Performance が 85 未満の場合: SVG icon の inline 化 / CSS の critical path を見直す（既存範囲、本 Phase で深追いしない）。

## 5. Screen reader テスト (manual ガイドライン)

- VoiceOver (macOS) / NVDA (Windows) で `/login` を開く
- 期待読み上げ順序:
  1. "UBM 兵庫支部会、メンバーポータル、見出しレベル 1、会員ログイン"
  2. 説明文 (subtitle)
  3. "メールアドレス、必須、エディット" (input)
  4. "マジックリンクを送る、ボタン" (primary)
  5. "または、区切り線" (OrDivider) ※ aria-label に依存
  6. "Google でログイン、ボタン" (ghost)
  7. "会員でない方は、メンバー登録、リンク、から"

brand-mark の "兵" は aria-hidden で読まれない。OR の line span 2 本も読まれない。

エラー state の Banner は role="alert" 相当で割り込み読み上げ。

## 6. UX 品質チェックリスト

- [ ] Click target サイズ: 全 button 44×44 px 以上 (size=lg なら 48px 高)
- [ ] visible focus ring 2px 以上
- [ ] Reduced motion: `prefers-reduced-motion: reduce` 下でアニメーション無効 (auth.css は transition なしで MVP OK)
- [ ] Color のみで状態を表現していない (error は文言 + icon + 色で 3 経路)

## 7. DoD

- [ ] §1 axe assertion 全 4 component pass
- [ ] §2 focus order Playwright 検証 pass
- [ ] §3 全 contrast ペアが AA 以上 (DevTools / Lighthouse)
- [ ] §4 Lighthouse a11y 95+ / best-practices 95+
- [ ] §6 UX チェックリスト全項目 OK
