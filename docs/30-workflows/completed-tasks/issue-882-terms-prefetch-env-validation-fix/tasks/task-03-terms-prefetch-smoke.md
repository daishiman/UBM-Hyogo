# task-03 — `/` → `/terms` prefetch console-error smoke (playwright)

[実装区分: 実装仕様書]

## 目的

回帰防止。`/` を JS 有効状態で開いたとき、`/terms` の prefetch 経路で console error が発生しないことを smoke で固定する。

## 変更対象ファイル

| ファイル | 変更種別 |
| --- | --- |
| `apps/web/playwright/tests/terms-prefetch.spec.ts` | 新規 |

## テスト仕様

```ts
import { test, expect } from "@playwright/test";

test("home page does not surface terms prefetch env-validation errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  const failedPrefetch: string[] = [];
  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/terms") && res.status() >= 400) {
      failedPrefetch.push(`${res.status()} ${url}`);
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(errors, errors.join("\n")).toEqual([]);
  expect(failedPrefetch, failedPrefetch.join("\n")).toEqual([]);
});
```

## ローカル実行コマンド

```
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/terms-prefetch.spec.ts --project=desktop-chromium
```

（既存 playwright 設定の dev webServer / chromium project を流用）

## DoD

- playwright smoke が PASS。
- 既存 playwright suite に regression なし（`mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test`）。
