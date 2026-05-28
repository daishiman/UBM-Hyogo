# Task G — 横断 e2e（Playwright で 3 状態 × 7 routes の auth slot 検証）

**[実装区分: 実装仕様書]**

## 1. 目的

Task A-F の DOM 契約（`data-auth-state`、`data-role="auth-cta"/member-cta/admin-cta/public-return"`）が **全ての公開系 routes と会員 / 管理ルートで一貫して成立する**ことを Playwright で網羅する。Vitest の単体テストでは検証できない「実際の Auth.js session cookie 経由でレンダーされる DOM」を担保する。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/playwright/tests/auth-slot-coverage.spec.ts` | 新規 |
| 2 | `apps/web/playwright/.auth/guest.json` | 新規（空 cookie） |
| 3 | `apps/web/playwright/.auth/member.json` | 新規 or 既存利用 |
| 4 | `apps/web/playwright/.auth/admin.json` | 新規 or 既存利用 |
| 5 | `apps/web/playwright.config.ts` | 編集（projects に `auth-slot-coverage` 追加） |

> 既存 storageState fixture (`apps/web/playwright/fixtures/auth.ts`) を確認し、storageState 形式で取り出せるなら setup spec を経由して上記 JSON を吐く。

## 3. spec 設計

```ts
// auth-slot-coverage.spec.ts
import { test, expect } from "@playwright/test";

type Route = { path: string; expect: { guest: string; member: string; admin: string } };

const ROUTES: Route[] = [
  { path: "/",            expect: { guest: "guest", member: "member", admin: "admin" } },
  { path: "/members",     expect: { guest: "guest", member: "member", admin: "admin" } },
  { path: "/register",    expect: { guest: "guest", member: "member", admin: "admin" } },
  { path: "/privacy",     expect: { guest: "guest", member: "member", admin: "admin" } },
  { path: "/terms",       expect: { guest: "guest", member: "member", admin: "admin" } },
  { path: "/profile",     expect: { guest: "redirect", member: "member", admin: "admin" } },
  { path: "/admin",       expect: { guest: "redirect", member: "redirect", admin: "admin" } },
];

for (const state of ["guest", "member", "admin"] as const) {
  test.describe(`auth-slot @${state}`, () => {
  test.use({ storageState: `playwright/.auth/${state}.json` });

    for (const route of ROUTES) {
      const expected = route.expect[state];
      test(`${state} viewing ${route.path}`, async ({ page }) => {
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
        if (expected === "redirect") {
          // login へ飛ばされている / または admin guard
          expect(page.url()).toMatch(/\/login(\?|$)/);
          return;
        }
        const header = page.locator('[data-component="public-header"], [data-testid="member-header"], [data-testid="admin-shell"]').first();
        await expect(header).toHaveAttribute("data-auth-state", expected);

        if (expected === "guest") {
          await expect(page.locator('[data-role="auth-cta"]')).toBeVisible();
          await expect(page.locator('[data-role="member-cta"]')).toHaveCount(0);
        } else {
          await expect(page.locator('[data-role="member-cta"], a[href="/profile"]').first()).toBeVisible();
        }
        if (expected === "admin") {
          await expect(page.locator('[data-role="admin-cta"], a[href="/admin"]').first()).toBeVisible();
        }
      });
    }
  });
}

test("admin shell exposes public-return link", async ({ page }) => {
  await page.context().addCookies([]); // admin storageState は describe 側で別途
  // 別 describe で admin storageState を当てたうえで /admin に遷移
  // 簡便のため別 spec ファイル化も可
});
```

> 実装時、`admin shell` のヘッダ DOM 契約（`data-testid="admin-shell"` に `data-auth-state` を付与するか、別 selector に切り出すか）は Task F 完了時の DOM に整合させる。本仕様書では「`/admin` 配下では `data-route-group="admin"` の親 div が `data-auth-state="admin"` を持つ」契約を採用する（Task F の DoD に追記が必要）。

## 4. storageState fixture 生成

既存 `apps/web/playwright/fixtures/auth.ts` の手法に従い、`setup.spec.ts`（既存ない場合は新規）で以下を生成:

```ts
// setup.spec.ts
import { test as setup } from "@playwright/test";

setup("authenticate as member", async ({ page }) => {
  // 既存の magic-link 経由 / Credentials provider 経由でログイン
  await page.context().storageState({ path: "playwright/.auth/member.json" });
});

setup("authenticate as admin", async ({ page }) => {
  // 同上、admin 権限の fixture user
  await page.context().storageState({ path: "playwright/.auth/admin.json" });
});

setup("guest", async ({ page }) => {
  await page.context().storageState({ path: "playwright/.auth/guest.json" });
});
```

既存 `auth.ts` に storageState 出力ロジックがあればそれを再利用。実装着手時に存在を再確認すること。

## 5. playwright.config.ts への追加

```ts
projects: [
  // 既存 projects（playwright-smoke 等）はそのまま維持
  {
    name: "auth-slot-coverage",
    testMatch: /auth-slot-coverage\.spec\.ts/,
    dependencies: ["setup-auth"],
    use: { ...devices["Desktop Chrome"] },
  },
],
```

## 6. ローカル実行コマンド

```bash
# storageState 生成
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=setup-auth

# auth slot coverage 実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=auth-slot-coverage

# 全件
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test
```

## 7. DoD

- [ ] `auth-slot-coverage.spec.ts` で 3 states × 7 routes = 21 ケース pass
- [ ] guest が `/profile`, `/admin` で `/login` redirect される
- [ ] member が `/admin` で redirect される
- [ ] admin が全 7 routes で `data-auth-state="admin"`
- [ ] 既存 playwright-smoke / visual baseline projects に regression なし
- [ ] CI (`.github/workflows/playwright-smoke.yml`) に新 project を組み込む（既存 matrix に追加 or 別 job）

## 8. 依存

- **前提**: Task A-F すべて完了。特に `data-auth-state` 属性が admin shell でも付与されている必要があるため、Task F の DoD に「`data-route-group="admin"` の親 div が `data-auth-state="admin"` を持つ」を追記すること（本仕様書からのフィードバック）。
