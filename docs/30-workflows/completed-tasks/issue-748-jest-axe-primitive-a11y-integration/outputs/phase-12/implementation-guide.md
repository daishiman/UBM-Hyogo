# Implementation Guide

## Part 1 — 中学生レベル

この作業は、学校の避難経路チェックに似ています。教室に「出口」と書いた紙が貼ってあるだけでは十分ではなく、本当に通れるか、案内が分かりやすいかも確認する必要があります。

今回のUI部品も同じです。これまでは「名前の札が付いているか」を主に見ていました。そこへ `axe` という自動チェックを足し、入力欄、空っぽ表示、ページ送り、アイコン、パンくずが、読み上げソフトなどでも壊れにくい形かを毎回テストで確認します。

| 用語 | やさしい説明 |
| --- | --- |
| a11y | いろいろな人が使いやすいか |
| axe | 使いやすさの自動点検機 |
| jsdom | 本物のブラウザの代わりをする軽い箱 |
| primitive | 何度も使う小さなUI部品 |
| rule baseline | どの点検項目を見るかの約束 |

## Part 2 — 技術者向け

### Interface

```ts
import { configureAxe } from "jest-axe";

export const axe = configureAxe({
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
  },
});
```

### Usage

```ts
const results = await axe(render(<Pagination current={1} hasNext hasPrev onNext={fn} onPrev={fn} />).container);
expect(results.violations).toHaveLength(0);
```

### Rule Boundary

`color-contrast` is disabled because jsdom cannot calculate the OKLch token cascade as a real browser. `region` and `landmark-one-main` are disabled because primitive tests render isolated fragments; page-level landmark coverage belongs to Playwright/Lighthouse.

The implementation deliberately avoids `expect.extend(toHaveNoViolations)` and follows the existing admin component pattern: `results.violations.toHaveLength(0)`. This keeps `vitest.config.ts` unchanged and avoids Jest matcher type augmentation. The source AC is treated as a canonical replacement: the invariant is "axe violations are zero", not the matcher API shape.

### Edge Cases

Decorative icons, labelled icons, error states, disabled pagination buttons, and breadcrumb current-page semantics keep explicit contract assertions. Axe detects rule violations; these assertions preserve component-specific API behavior.
