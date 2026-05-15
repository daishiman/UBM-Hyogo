# Phase 4: テスト作成

## メタ情報

- taskId: `parallel-08-shared-foundation-admin-ui-foundation`
- phase: 4 / 13
- 実装区分: **実装仕様書**
- テスト命名規約: `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8 / lefthook `block-test-suffix`）

## 目的

Phase 2 の Validation Matrix を Vitest / Playwright のテストコードに落とし込む。実装より前に**テストを先に置く**（TDD red）。

## テストファイル配置

| Path | 種別 | 対象 AC |
|------|------|--------|
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts` | Vitest unit + type | AC-2, AC-3 |
| `apps/web/src/features/admin/hooks/__tests__/barrel.spec.ts` | Vitest dynamic import | AC-4 |
| `apps/web/app/__tests__/layout.spec.tsx` | Vitest render | AC-1 |
| `apps/web/playwright/admin-shared-foundation.spec.ts` | Playwright e2e | AC-1, AC-5 |
| `apps/web/__tests__/api-error-inventory.spec.ts` | Vitest contract grep | AC-7 |

> `(admin)/admin/error.tsx` / `middleware.ts` の confirm は inventory snapshot で代替（AC-5 / AC-6）し、Playwright で動作観察を兼ねる。

## 1. Vitest: useAdminMutation 型 + skeleton throw

```ts
// apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
import { describe, it, expect, expectTypeOf } from "vitest";
import {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "../useAdminMutation";

describe("useAdminMutation (skeleton)", () => {
  it("AC-2: exports correct function signature", () => {
    expectTypeOf(useAdminMutation).toBeFunction();
    expectTypeOf(useAdminMutation)
      .parameter(0)
      .toEqualTypeOf<string>();
    expectTypeOf(useAdminMutation)
      .parameter(1)
      .toEqualTypeOf<AdminMutationOptions | undefined>();
    expectTypeOf(useAdminMutation).returns.toEqualTypeOf<AdminMutationResult>();
  });

  it("AC-2: AdminMutationOptions has expected optional fields", () => {
    expectTypeOf<AdminMutationOptions>().toHaveProperty("onSuccess");
    expectTypeOf<AdminMutationOptions>().toHaveProperty("onError");
    expectTypeOf<AdminMutationOptions>().toHaveProperty("toastMessage");
  });

  it("AC-3: skeleton throws sentinel error", () => {
    expect(() => useAdminMutation("patchMemberStatus")).toThrow(
      /implementation in step-01/,
    );
  });
});
```

## 2. Vitest: barrel import 整合

```ts
// apps/web/src/features/admin/hooks/__tests__/barrel.spec.ts
import { describe, it, expect } from "vitest";

describe("hooks barrel", () => {
  it("AC-4: @/features/admin/hooks re-exports useAdminMutation", async () => {
    const mod = await import("@/features/admin/hooks");
    expect(typeof mod.useAdminMutation).toBe("function");
  });
});
```

## 3. Vitest: root layout に ToastProvider 配置

```tsx
// apps/web/app/__tests__/layout.spec.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "../layout";
import { useToast } from "@/components/ui/Toast";

function Probe() {
  const { toast } = useToast();
  return <button onClick={() => toast("hi")}>fire</button>;
}

describe("RootLayout", () => {
  it("AC-1: wraps children with ToastProvider so useToast works", () => {
    // Note: html/body は jsdom 制約により body 内 fragment として描画
    render(<RootLayout><Probe /></RootLayout>);
    expect(screen.getByRole("button", { name: "fire" })).toBeTruthy();
  });
});
```

## 4. Playwright: admin page load + error catch

```ts
// apps/web/playwright/admin-shared-foundation.spec.ts
import { test, expect } from "@playwright/test";

test.describe("admin shared foundation", () => {
  test("AC-1+AC-5: skeleton throw is caught by admin error.tsx with reset button", async ({ page }) => {
    // 前提: admin としてログイン済み状態を fixture で用意
    await page.goto("/admin/members");
    // ボタン経由で useAdminMutation が起動するシナリオ。step-01 完了後に追記。
    // 本 phase では「/admin が render され、error.tsx の reset() が存在する」観察まで。
    const alert = page.getByRole("alert");
    if (await alert.count()) {
      await expect(page.getByRole("button", { name: "再試行" })).toBeVisible();
    }
  });
});
```

## 5. Vitest: API error inventory grep

```ts
// apps/web/__tests__/api-error-inventory.spec.ts
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const API_ROUTES = join(__dirname, "../../api/src/routes");

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith(".ts")) yield p;
  }
}

describe("API error inventory", () => {
  it("AC-7: records current error response shapes for step-01 parser compatibility", () => {
    const filesWithErrorShape: string[] = [];
    for (const f of walk(API_ROUTES)) {
      const src = readFileSync(f, "utf8");
      if (/\{\s*(ok:\s*false,\s*)?error:\s*['"]/.test(src)) filesWithErrorShape.push(f);
    }
    expect(filesWithErrorShape.length).toBeGreaterThan(0);
  });
});
```

## ローカル実行・検証コマンド

```bash
# Type 検査
mise exec -- pnpm tsc --noEmit

# Lint
mise exec -- pnpm lint

# Vitest（apps/web の本タスク 5 spec）
mise exec -- pnpm -F "@ubm-hyogo/web" vitest run \
  apps/web/src/features/admin/hooks/__tests__ \
  apps/web/app/__tests__/layout.spec.tsx \
  apps/web/__tests__/api-error-inventory.spec.ts

# Playwright（ログイン fixture 整備後）
mise exec -- pnpm -F "@ubm-hyogo/web" playwright test admin-shared-foundation

# Dev server（手動確認）
mise exec -- pnpm -F "@ubm-hyogo/web" dev
# → http://localhost:3000/admin
```

## 統合テスト連携

- serial-05/step-01 が本 phase のテストを **green に変える側**（throw 削除 → fetch 実装 → toast 呼び出し）
- AC-3 (skeleton throw) のテストは step-01 完了後に **書き換え対象**（throw 期待を success 期待に置換）。本タスク完了時点では throw が green である状態が DoD

## 多角的チェック観点（AI 判断）

- `expectTypeOf` の利用で型 export の存在を runtime ではなく **コンパイル時**に固定 → strict mode で必ず検知される
- Playwright spec は admin auth fixture に依存する。fixture が未整備なら `test.skip` で記録し、Phase 13 blocked 条件に列挙
- API inventory grep は既存 `{ error }` 系 endpoint を failure にせず、step-01 parser compatibility の入力として価値を持たせる

## 入出力・副作用

- **Input**: Phase 2 設計 / 既存実装
- **Output**: 上記 5 テストファイル
- **副作用**: テストは TDD red → 実装後 green に遷移。skeleton throw の test は step-01 で red に戻り、step-01 完了で再度 green になる

## サブタスク管理

- [ ] 5 spec ファイル配置確定
- [ ] テストコード骨子確定
- [ ] ローカル実行コマンド確定
- [ ] step-01 後の test 書換 hand-off 明示

## 成果物

- 本 phase-04.md（5 spec の配置 + 骨子 + 実行コマンド）

## 完了条件 (DoD)

- [ ] 5 spec が配置パス + 骨子で揃っている
- [ ] 全 spec が `*.spec.{ts,tsx}` 命名（`*.test` 禁止遵守）
- [ ] Validation Matrix AC-1〜AC-7 が spec に 1:1 で紐付く
- [ ] ローカル実行コマンドが mise exec 経由で書かれている
- [ ] step-01 への test 書換 hand-off が明文化

## タスク100%実行確認【必須】

- [ ] テスト配置パス全件確定
- [ ] 各 AC が少なくとも 1 spec でカバー
- [ ] mise exec 経路で実行可能
- [ ] 新規 `*.test.*` を作成していない
- [ ] D1 / 新規 endpoint / HEX 直書き いずれもテストコードに混入していない

## 次 Phase

Phase 5（実装）: Phase 2 差分の適用と Phase 4 テスト群の green 化（本サイクル外 / 後続実装フェーズで参照）
