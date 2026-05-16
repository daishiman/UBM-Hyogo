# Phase 4: テスト作成

> Phase: 4 / 13

---

## 目的

G3-1/2/3 の振る舞いを TDD Red として確定するテストを作成する。

---

## 4.1 Vitest + Testing Library

### signature inventory gate

Phase 4 着手前に現行 component signature を確認し、既存 spec suffix に合わせる。

```bash
sed -n '1,180p' apps/web/src/components/public/MemberFilters.client.tsx
sed -n '1,180p' apps/web/src/components/public/MemberDetailSections.tsx
ls apps/web/src/components/public/__tests__/*MemberFilters* apps/web/src/components/public/__tests__/*MemberDetailSections*
```

### `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`

```ts
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MemberFilters from '../MemberFilters.client';

describe('MemberFilters tag pill', () => {
  it('selected tag has aria-pressed="true", data-selected="true", and data-component="tag-pill"', () => {
    render(<MemberFilters initial={{ tag: ['piano'], q: '', zone: 'all', status: 'public', sort: 'recent', density: 'comfy' }} />);
    const pianoBtn = screen.getByRole('button', { name: /piano/i });
    expect(pianoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(pianoBtn).toHaveAttribute('data-selected', 'true');
    expect(pianoBtn).toHaveAttribute('data-component', 'tag-pill');
    expect(pianoBtn).not.toHaveAttribute('aria-selected');
  });
});
```

> `MemberFilters` の現行 props 形に合わせて render 引数を調整すること。Phase 5 着手前にコンポーネント実 signature を確認する。

### `apps/web/src/components/public/__tests__/MemberDetailSections.component.spec.tsx`

```ts
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MemberDetailSections from '../MemberDetailSections';

describe('MemberDetailSections visibility marker', () => {
  it('renders data-visibility="public" by default', () => {
    const { container } = render(<MemberDetailSections sections={[{ key: 'profile', title: 'プロフィール', items: [] }]} />);
    const section = container.querySelector('[data-section="profile"]');
    expect(section).toHaveAttribute('data-visibility', 'public');
  });

  it('respects explicit visibility value', () => {
    const { container } = render(<MemberDetailSections sections={[{ key: 'admin-only', title: '管理', items: [], visibility: 'admin' }]} />);
    expect(container.querySelector('[data-section="admin-only"]')).toHaveAttribute('data-visibility', 'admin');
  });
});
```

---

## 4.2 Playwright（visual / interaction）

`apps/web/playwright/tests/visual/visual-feedback.spec.ts`（新規）

- `/members?tag=kobe` で active tag pill → 該当 button の computed style `background-color` が `var(--ubm-color-text-primary)` 解決値と一致
- member card に hover → `border-color` と `box-shadow` が transition 後に変化（`page.evaluate` で getComputedStyle 比較）
- `/(public)/members/[id]` で section に `border-left` の太さ 4px・color が token 解決値
- `member` / `admin` visibility は production API 未提供のため component fixture または mock route で `data-visibility` を注入し、runtime page の public fallback と混同しない。

---

## 4.3 a11y（jest-axe）

```ts
import { axe } from 'jest-axe';

it('MemberFilters has no a11y violations', async () => {
  const { container } = render(<MemberFilters .../>);
  expect(await axe(container)).toHaveNoViolations();
});
```

---

## 4.4 実行コマンド（Red 確認）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberFilters.client.spec
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDetailSections.component.spec
PLAYWRIGHT_EVIDENCE_TASK=parallel-03-prototype-ux-css PLAYWRIGHT_BASE_URL=http://localhost:3017 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-chromium playwright/tests/visual/visual-feedback.spec.ts
```

Phase 4 完了時点では Red（fail）が期待結果。Phase 5 実装で Green 化。
