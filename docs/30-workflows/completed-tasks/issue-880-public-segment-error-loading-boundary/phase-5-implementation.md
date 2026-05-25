---
phase: 5
title: 実装手順
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 5 — 実装手順

[実装区分: 実装仕様書]

## 0. Precondition チェック（実装開始前に必ず実行）

```bash
# 親 boundary の存在確認
test -f apps/web/app/error.tsx && echo "OK: parent error.tsx"
test -f apps/web/app/loading.tsx && echo "OK: parent loading.tsx"

# (public) layout の存在確認
test -f apps/web/app/\(public\)/layout.tsx && echo "OK: public layout"

# 対称参考 (admin) の存在確認
test -f apps/web/app/\(admin\)/admin/error.tsx && echo "OK: admin reference"

# 衝突確認（未配置であること）
test ! -f apps/web/app/\(public\)/error.tsx && echo "OK: target error.tsx absent"
test ! -f apps/web/app/\(public\)/loading.tsx && echo "OK: target loading.tsx absent"
```

全 6 行 `OK:` 出力で precondition pass。

## 1. 変更対象ファイル

| # | Path | 種別 | 概要 |
|---|------|------|------|
| F-01 | `apps/web/app/(public)/error.tsx` | 新規 | Client Component error boundary |
| F-02 | `apps/web/app/(public)/loading.tsx` | 新規 | Server Component loading skeleton |
| F-03 | `apps/web/app/(public)/error-boundary-smoke/page.tsx` | 新規 | dev/test 限定の force-throw route |
| F-04 | `apps/web/playwright/tests/public-error-boundary.spec.ts` | 新規 | Playwright smoke |
| F-05 | `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md` | 編集（追記） | followup-001 backfill note 追加 |
| F-06 | `docs/30-workflows/unassigned-task/serial-06-followup-001-public-segment-error-loading-boundary.md` | 編集（任意） | `issue_number: TBD` → `#880`、ステータス更新（または Phase 12 で `completed-tasks` 移動） |

## 2. 実装ステップ

### Step 1 — F-01 `apps/web/app/(public)/error.tsx` を新規作成

Phase 2 §2 の完全コードをそのまま配置する。注意:

- import path は `../../src/...`（`(public)` 配下から `apps/web/src/...` まで 2 段上がる）
- `"use client"` を 1 行目に置く
- `scope: "public"` を logger payload に必ず含める
- `useAutoFocusOnMount(headingRef)` は 1 回のみ（親 error.tsx の二重呼び出しバグを継承しない）

### Step 2 — F-02 `apps/web/app/(public)/loading.tsx` を新規作成

Phase 2 §3 の完全コードをそのまま配置する。`"use client"` は付けない。

### Step 3 — F-03 hidden route 配置

Phase 2 §4 のコードを配置。`process.env.NODE_ENV === "production"` で `notFound()` を呼ぶことで production 流出を防ぐ。

### Step 4 — F-04 Playwright spec を作成

```ts
// apps/web/playwright/tests/public-error-boundary.spec.ts
import { expect, test } from "@playwright/test";

test.describe("(public) error boundary @smoke", () => {
  test("force throw renders (public)/error.tsx within public AppShell", async ({ page }) => {
    await page.goto("/error-boundary-smoke");

    await expect(page.locator('[data-route-group="public"]')).toBeVisible();
    await expect(page.locator('[data-page="error"]')).toBeVisible();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert.getByRole("heading", { level: 1 })).toHaveText(
      "ページを表示できませんでした",
    );

    await expect(page.getByRole("button", { name: "再試行する" })).toBeVisible();
    await expect(page.getByRole("link", { name: "会員一覧へ戻る" })).toHaveAttribute(
      "href",
      "/members",
    );
    await expect(page.getByRole("link", { name: "トップへ戻る" })).toHaveAttribute(
      "href",
      "/",
    );

    await page.screenshot({
      path: "docs/30-workflows/issue-880-public-segment-error-loading-boundary/outputs/phase-11/screenshots/public-error-boundary.png",
      fullPage: true,
    });
  });

  test("focus moves to heading on boundary mount", async ({ page }) => {
    await page.goto("/error-boundary-smoke");
    const activeTag = await page.evaluate(
      () => document.activeElement?.tagName?.toLowerCase() ?? null,
    );
    expect(activeTag).toBe("h1");
  });
});
```

### Step 5 — F-05 backfill 追記

`docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md` の末尾に追記:

```markdown
## followup-001 backfill（2026-MM-DD）

- `apps/web/app/(public)/error.tsx` / `loading.tsx` を `docs/30-workflows/issue-880-public-segment-error-loading-boundary/` で配置完了
- Phase 5 §0 precondition `test -f apps/web/app/\(public\)/error.tsx` が pass する状態に到達
- evidence: `docs/30-workflows/issue-880-public-segment-error-loading-boundary/outputs/phase-11/screenshots/public-error-boundary.png`
```

### Step 6 — F-06 unassigned-task ファイル整理

実装完了確認後、`docs/30-workflows/unassigned-task/serial-06-followup-001-public-segment-error-loading-boundary.md` の `issue_number: TBD` を `issue_number: 880` に更新し、source trace として consumed 状態を記録する。物理移動は commit / PR 方針と合わせて user-gated とする。

## 3. ローカル検証コマンド

```bash
# Phase 5 完了直後の必須検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts

# OKLch grep gate
mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens

# OpenNext Workers build
mise exec -- pnpm --filter @ubm-hyogo/web build
```

すべて exit 0 を確認。

## 4. ロールバック手順

```bash
# 4 ファイル削除
rm apps/web/app/\(public\)/error.tsx
rm apps/web/app/\(public\)/loading.tsx
rm -rf apps/web/app/\(public\)/error-boundary-smoke/
rm apps/web/playwright/tests/public-error-boundary.spec.ts

# backfill note を revert（git checkout で十分）
```

親 `apps/web/app/error.tsx` フォールバックで動作継続。
