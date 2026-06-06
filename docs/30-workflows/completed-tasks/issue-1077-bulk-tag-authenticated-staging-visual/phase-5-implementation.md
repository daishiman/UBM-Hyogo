# Phase 5 — 実装手順

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイルのコード追加を伴う（CONST_004）。

---

## 5.1 変更ファイル一覧（CONST_005）

| 区分 | パス | 備考 |
| --- | --- | --- |
| 新規（唯一の実装ファイル） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | 本 spec |
| config 編集 | — | **不要**。`staging-visual-authenticated` project は `testDir: ./playwright/tests/visual-staging-authenticated` + `testIgnore`（setup/teardown のみ除外）で自動登録（`playwright.config.ts:376-388`）。ファイルを置くだけで `--project=staging-visual-authenticated` に含まれる。 |
| apps/api・apps/web src・D1・Google Form | — | 一切変更しない（AC-7）。 |

---

## 5.2 実 spec のコード例（完全形）

```ts
// workflow: issue-1077 / Phase 5 §5.2
// issue-1036 followup-001: 認証付き staging /admin/members で BulkActionBar tag picker の
// assign / unassign 2 状態を read-only で visual baseline 化する。
// storageState は setup.staging-auth.ts が mint した admin role を使用。
// mutation（apply）は一切実行しない（AC-6）。

import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

test("staging admin members bulk tag picker (authenticated admin) baselines", async ({
  page,
}) => {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/admin\/members(\?|$)/);

  // --- 前提確認: member 行 >= 2 ---
  const rows = page.locator('[data-testid^="admin-members-row-"]');
  const rowCount = await rows.count();
  expect(
    rowCount,
    `staging /admin/members の member 行が ${rowCount} 件。baseline 取得には 2 件以上必要。`,
  ).toBeGreaterThanOrEqual(2);

  // --- member 2 件を選択（行内チェックボックス aria-label="{fullName} を選択"） ---
  const memberCheckboxes = page.getByRole("checkbox", { name: /を選択$/ });
  await memberCheckboxes.nth(0).check();
  await memberCheckboxes.nth(1).check();

  // --- BulkActionBar が出現（selectedIds.length > 0） ---
  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });

  // tag picker section が描画されていること
  const tagSection = bulkRegion.getByRole("region", { name: "タグ一括付与・解除" });
  await expect(tagSection).toBeVisible();

  // --- mutation 防止: apply ボタンは tag 未選択ゆえ disabled。click しない（AC-6） ---
  const applyButton = tagSection.getByRole("button", { name: /タグ を(付与|解除)$/ });
  await expect(applyButton).toBeDisabled();

  // --- アニメーション無効化 ---
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });

  // --- (1) assign モード（既定）baseline ---
  const modeGroup = bulkRegion.getByRole("group", { name: "付与モード" });
  await expect(modeGroup.getByRole("button", { name: "付与" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(bulkRegion).toHaveScreenshot("bulk-tag-picker-assign-mode.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });

  // --- (2) unassign モードへ切替 → baseline ---
  await modeGroup.getByRole("button", { name: "解除" }).click();
  await expect(modeGroup.getByRole("button", { name: "解除" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // 切替後も apply は disabled のまま（mutation 防止の再確認）
  await expect(applyButton).toBeDisabled();
  await expect(bulkRegion).toHaveScreenshot("bulk-tag-picker-unassign-mode.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
});
```

> 補足:
> - 選択は行内チェックボックス（`/を選択$/`）を 2 つ check する。`aria-label="全選択"` を使う場合は `page.getByRole("checkbox",{name:"全選択"}).check()` に置換できるが、選択件数を 2 に固定したいので行内 2 件 check を既定とする。
> - capture は `bulkRegion` を locator scope し、画面全体ではなく picker 領域のみを baseline 化する（local fixture と意味的に揃える）。

---

## 5.3 baseline 保存先（snapshotPathTemplate 由来）

```
apps/web/playwright/tests/visual-staging-authenticated/
  admin-members-bulk-tag-authenticated.spec.ts-snapshots/
    bulk-tag-picker-assign-mode.png-authenticated-staging-visual-{platform}.png
    bulk-tag-picker-unassign-mode.png-authenticated-staging-visual-{platform}.png
```

local fixture spec の baseline と project / testDir / 名前空間が分離されるため drift しない。

---

## 5.4 検証コマンド（DoD）

```bash
# 1) 型
mise exec -- pnpm typecheck

# 2) lint（HEX 直書き gate 含む）
mise exec -- pnpm lint

# 3) 回帰（component spec）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx

# 4) 認証 staging baseline 生成（user-gated runtime）
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

---

## 5.5 DoD チェックリスト

- [ ] 新規ファイル `admin-members-bulk-tag-authenticated.spec.ts` を 1 つだけ追加した（config 編集なし）
- [ ] `test.use({ storageState })` で admin storageState を注入している
- [ ] `goto("/admin/members", { waitUntil: "networkidle" })` で実機到達している
- [ ] member 行 ≥ 2 の前提 assert がある（未達は明示 fail）
- [ ] member 2 件を選択し bulk region（`aria-label="一括操作"`）の visible を assert している
- [ ] `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` の 2 capture を取得している（canonical 名一致 = AC-4）
- [ ] apply ボタンが disabled であることを assert し、**click していない**（AC-6）
- [ ] apps/api・apps/web src・D1・Google Form を変更していない（AC-7）
- [ ] typecheck / lint / 回帰 vitest が PASS
- [ ] baseline 2 枚を生成・目視レビュー済み（user-gated runtime 完了後）
- [ ] GitHub issue #1077 は CLOSED 維持・reopen していない
