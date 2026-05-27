# Phase 4: テスト計画 — issue-924 style-src-attr 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

---

## 1. テスト方針

| レイヤ | 目的 | tool |
|--------|------|------|
| unit | `buildCspDirective` 出力に `style-src-attr` が含まれないことを契約として固定 | Vitest |
| HTTP smoke | 実 response の CSP ヘッダで `style-src-attr` 不在を保証 | Playwright |
| grep gate | `style={{...}}` 新規追加を物理的に禁止 | shell script (lefthook + GitHub Actions) |
| visual regression | 17 ファイル refactor 後の描画退行 0 を保証 | Playwright visual |
| 動的ケース component test | Avatar bucket / Icon data-size / ZoneDistribution SVG の描画契約 | React Testing Library + Vitest |

---

## 2. 追加・更新するテストファイル

### 2.1 unit テスト

**ファイル**: `apps/web/src/lib/__tests__/security-headers.spec.ts`（既存・assertion 追加）

追加内容:

```ts
describe('buildCspDirective — style-src-attr retirement (issue-924)', () => {
  it('does not include style-src-attr when nonce is provided', () => {
    const csp = buildCspDirective({ ...baseCfg, nonce: 'abc123' });
    expect(csp).not.toContain('style-src-attr');
  });

  it('does not include style-src-attr when nonce is absent', () => {
    const csp = buildCspDirective({ ...baseCfg });
    expect(csp).not.toContain('style-src-attr');
  });

  it('preserves style-src and style-src-elem nonce directives', () => {
    const csp = buildCspDirective({ ...baseCfg, nonce: 'abc123' });
    expect(csp).toContain("style-src 'self' 'nonce-abc123'");
    expect(csp).toContain("style-src-elem 'self' 'nonce-abc123'");
  });
});
```

### 2.2 Playwright HTTP smoke

**ファイル**: `apps/web/tests/security-headers.smoke.spec.ts`（既存・assertion 追加）

追加内容:

```ts
test.describe('CSP style-src-attr retirement (issue-924)', () => {
  for (const path of ['/', '/login', '/(public)/members', '/(admin)/admin']) {
    test(`response CSP for ${path} omits style-src-attr`, async ({ request }) => {
      const res = await request.get(path);
      const csp = res.headers()['content-security-policy-report-only']
               ?? res.headers()['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).not.toMatch(/style-src-attr/);
    });
  }
});
```

### 2.3 grep gate (新規)

**ファイル**: `scripts/verify-no-inline-style.sh`（新規）

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_DIRS=(apps/web/src apps/web/app)
PATTERN='style=\{\{'

hits=$(rg -l --type tsx --type ts "$PATTERN" "${TARGET_DIRS[@]}" 2>/dev/null || true)

if [[ -n "$hits" ]]; then
  echo "[verify-no-inline-style] FAIL — inline style={{...}} detected:" >&2
  echo "$hits" >&2
  echo "" >&2
  echo "Refer to docs/30-workflows/issue-924-style-src-attr-retirement/ for migration guide." >&2
  exit 1
fi

echo "[verify-no-inline-style] OK — no inline style={{...}} hits"
```

連携:
- `lefthook.yml` の `pre-push` block に新規 step として登録
- `.github/workflows/verify-style.yml`（新規）または既存 verify workflow に追加し PR ごとに実行

### 2.4 component テスト（動的ケース）

**ファイル**: `apps/web/src/components/ui/__tests__/Avatar.spec.tsx`（既存または新規）

```ts
it('renders data-hue in 0..11 range for any seed', () => {
  const { container } = render(<Avatar seed="user-1" />);
  const el = container.querySelector('[data-hue]');
  const hue = Number(el?.getAttribute('data-hue'));
  expect(hue).toBeGreaterThanOrEqual(0);
  expect(hue).toBeLessThanOrEqual(11);
});

it('does not emit inline style attribute', () => {
  const { container } = render(<Avatar seed="user-1" />);
  const el = container.querySelector('[data-hue]') as HTMLElement;
  expect(el.getAttribute('style')).toBeNull();
});
```

**ファイル**: `apps/web/src/components/ui/__tests__/Icon.spec.tsx`

```ts
it('renders data-icon-size attribute instead of inline style', () => {
  const { container } = render(<Icon size={24}>...</Icon>);
  const el = container.querySelector('[data-icon-size]') as HTMLElement;
  expect(el.getAttribute('data-icon-size')).toBe('24');
  expect(el.getAttribute('style')).toBeNull();
});
```

**ファイル**: `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx`

```ts
it('renders svg rect width attribute instead of inline style gradient', () => {
  const { container } = render(<ZoneDistribution data={mockSegments} />);
  expect(container.querySelector('svg rect')).toBeTruthy();
  expect(container.querySelector('[style*="linear-gradient"]')).toBeNull();
});
```

### 2.5 visual regression（既存 spec 流用）

- `apps/web/tests/visual/**` の既存 19 routes baseline を退行確認に使用。
- Avatar / Icon / ZoneDistribution は色値 / 段階配置が変わるため、Phase 11 で baseline 更新の要否を判定。更新する場合は `-linux.png` を正本として更新する。

---

## 3. ローカル実行コマンド

```bash
# unit
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/lib/__tests__/security-headers.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/ui/__tests__/Avatar.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/ui/__tests__/Icon.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test --run apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx

# HTTP smoke
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/security-headers.smoke.spec.ts

# grep gate
bash scripts/verify-no-inline-style.sh

# visual regression
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual --project=chromium
```

---

## 4. 期待結果

| テスト | 期待 |
|--------|------|
| security-headers.spec.ts | `style-src-attr` not present (3 cases) |
| security-headers.smoke.spec.ts | 4 routes すべてで CSP に `style-src-attr` 不在 |
| verify-no-inline-style.sh | hits = 0 |
| Avatar/Icon/ZoneDistribution unit | inline style 属性 null / data-* 属性で描画 |
| visual regression | pixel diff ≤ tolerance（既存 baseline 維持）または承認の上 baseline 更新 |

---

## 5. テスト範囲外

- CSP `enforce` 切替（別 followup）
- `Reporting-Endpoints` 仕様（別 followup）
- API 側ヘッダ（apps/api スコープ外）
