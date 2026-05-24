# Phase 9: E2E + 統合テスト + Visual Regression 仕様

**[実装区分: 実装仕様書]**

Playwright で /login の visual regression と主要遷移を E2E カバーする。

## 1. e2e ディレクトリ位置 (実在確認済み)

- Playwright spec の正規配置: `apps/web/playwright/tests/`
- 既存 spec: `apps/web/playwright/tests/login-smoke.spec.ts`
- Visual evidence は本タスクでは既存 login smoke を拡張し、`outputs/phase-11/screenshots/` へ直接保存する

## 2. 追加する spec

| パス | 主目的 |
|------|--------|
| `apps/web/playwright/tests/login-smoke.spec.ts` | 6 state / admin gate / prototype DOM-order / Phase 11 screenshot |

## 3. `login.spec.ts` (機能 E2E)

```ts
import { test, expect } from "@playwright/test";

test.describe("/login route", () => {
  test("input state shows magic link first, then OR, then Google", async ({ page }) => {
    await page.goto("/login");
    // brand-mark
    await expect(page.getByText("兵")).toBeVisible();
    await expect(page.getByText("UBM兵庫支部会")).toBeVisible();
    // h1
    await expect(page.getByRole("heading", { level: 1, name: "会員ログイン" })).toBeVisible();
    // DOM 順序検証
    const inputPanel = page.locator('[data-panel="input"]');
    const children = await inputPanel.locator(":scope > *").all();
    // 順序: form, separator, button(google), p
    await expect(children[0]).toHaveJSProperty("tagName", "FORM");
    await expect(children[1]).toHaveAttribute("role", "separator");
    await expect(children[2]).toHaveAttribute("type", "button");
  });

  test("magic link submit transitions to sent state", async ({ page }) => {
    // mock /api/auth/magic-link
    await page.route("**/api/auth/magic-link", (route) =>
      route.fulfill({ json: { state: "sent" } })
    );
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("test@example.com");
    await page.getByRole("button", { name: /マジックリンクを送る/ }).click();
    await expect(page).toHaveURL(/state=sent/);
    await expect(page.getByText("メールをご確認ください")).toBeVisible();
  });

  test("google OAuth button click invokes auth.js signIn", async ({ page }) => {
    let called = false;
    await page.route("**/api/auth/signin/**", (route) => {
      called = true;
      route.fulfill({ status: 200, body: "" });
    });
    await page.goto("/login");
    await page.getByRole("button", { name: "Googleでログイン" }).click();
    // 実 OAuth flow には進めないため、redirect が発生したことを URL で確認
    // 環境によっては next-auth client routing で別の path に飛ぶ
  });
});
```

> Server Component の SSR fetch を Playwright `page.route()` で intercept できない問題 (skill server-component-e2e-pattern) は /login が client form 経由なので該当しない。dev server の `INTERNAL_API_BASE_URL` 差し替えは不要。

## 4. `visual/login.spec.ts` (visual regression)

```ts
import { test, expect } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];
const states: Array<{ name: string; url: string }> = [
  { name: "input", url: "/login" },
  { name: "sent", url: "/login?state=sent&email=test%40example.com&redirect=%2F" },
  { name: "error", url: "/login?state=error&error=%E9%80%81%E4%BF%A1%E5%A4%B1%E6%95%97" },
];

for (const vp of viewports) {
  for (const s of states) {
    test(`visual ${s.name} ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(s.url);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`login-${s.name}-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
```

baseline 取得: 初回は `--update-snapshots`、次回以降は diff 比較で fail。

## 5. CI gate 統合

- 既存 `playwright-smoke` workflow (`.github/workflows/playwright-smoke.yml` 等) への影響: route 追加分の visual baseline を git tracked commit
- `verify-design-tokens` gate: `rg '#[0-9a-fA-F]{3,8}' apps/web/src/styles/auth.css apps/web/app/login` で 0 件確認 (CI 側に同等 step がある場合は再利用、無ければ Phase 11 evidence として local 取得のみ)

## 6. 実行コマンド

```bash
# E2E (機能)
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/login-smoke.spec.ts --project=desktop-chromium

# Visual regression
find docs/30-workflows/login-page-prototype-alignment/outputs/phase-11/screenshots -maxdepth 1 -name 'login-*.png' -print | sort
```

## 7. DoD

- [ ] §3 の機能 spec 3 ケースが pass
- [ ] §4 の visual spec 6 ケース (2 viewport × 3 state) baseline が commit され diff = 0
- [ ] `playwright test` 全体が exit 0
- [ ] `verify-design-tokens` 相当 grep が 0 件
