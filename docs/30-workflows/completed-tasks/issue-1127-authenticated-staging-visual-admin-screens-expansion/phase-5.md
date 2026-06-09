# Phase 5: 実装 — 5 spec の新規作成（canonical 正本）

> 本 Phase は implemented_local_runtime_pending。下記コードは**local 実装済みの正本**であり、本サイクルで local 実装する（commit/capture は実行しない）（CONST_002/006）。

## 5.1 変更対象ファイル一覧（CONST_005 / Feedback RT-03）

| パス | 変更種別 | 内容 |
| --- | --- | --- |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-audit-authenticated.spec.ts` | **新規** | `/admin/audit` read-only baseline |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-requests-authenticated.spec.ts` | **新規** | `/admin/requests` read-only baseline |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-identity-conflicts-authenticated.spec.ts` | **新規** | `/admin/identity-conflicts` read-only baseline |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-schema-authenticated.spec.ts` | **新規** | `/admin/schema` read-only baseline |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-meetings-authenticated.spec.ts` | **新規** | `/admin/meetings` read-only baseline |

> プロダクトコード（`apps/web/src` / `apps/api`）・D1 migration・playwright.config.ts・CI workflow は**変更しない**（AC-5/AC-6 / 基盤自動認識）。

## 5.2 canonical 名一覧（artifact 命名ドリフト防止 / Feedback 1）

| route | spec file | screenshot `{arg}` | 展開後 snapshot 名 |
| --- | --- | --- | --- |
| audit | `admin-audit-authenticated.spec.ts` | `admin-audit-authenticated.png` | `admin-audit-authenticated.spec.ts-snapshots/admin-audit-authenticated-authenticated-staging-visual-{platform}.png` |
| requests | `admin-requests-authenticated.spec.ts` | `admin-requests-authenticated.png` | 同規約 |
| identity-conflicts | `admin-identity-conflicts-authenticated.spec.ts` | `admin-identity-conflicts-authenticated.png` | 同規約 |
| schema | `admin-schema-authenticated.spec.ts` | `admin-schema-authenticated.png` | 同規約 |
| meetings | `admin-meetings-authenticated.spec.ts` | `admin-meetings-authenticated.png` | 同規約 |

Phase 11 evidence 二重 capture（execution 時のみ）の出力先:
`docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11/<screenshot名>`

## 5.3 spec コード正本

### admin-audit-authenticated.spec.ts

```ts
// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/audit staging visual baseline (read-only).
// Uses storageState minted by setup.staging-auth.ts (admin role). No mutation is triggered.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/audit authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/audit", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "監査ログ" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-component="admin-audit"]')).toBeVisible();
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-audit-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-audit-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
```

### admin-requests-authenticated.spec.ts

```ts
// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/requests staging visual baseline (read-only).
// Read-only: never clicks 承認 / 却下 (POST /api/admin/requests/resolve). The confirm dialog is never opened.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/requests authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/requests", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "依頼キュー" })).toBeVisible({ timeout: 10_000 });
  // read-only guard: 確認ダイアログ(承認/却下の二段確認)を開いていないこと
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-requests-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-requests-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
```

### admin-identity-conflicts-authenticated.spec.ts

```ts
// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/identity-conflicts staging visual baseline (read-only).
// Read-only: never clicks merge / 別人マーク. The two-step confirm flow is never entered.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/identity-conflicts authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/identity-conflicts", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Identity 重複候補" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('section[data-route="admin"]')).toBeVisible();
  // read-only guard: merge/別人確定の確認フロー(確認2/2 等)が表示されていないこと
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-identity-conflicts-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-identity-conflicts-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
```

### admin-schema-authenticated.spec.ts

```ts
// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/schema staging visual baseline (read-only initial render).
// Read-only: never submits alias 割当 / Bulk Resolve / rollback / Bulk Rollback / 再集計. Modals are never opened.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/schema authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/schema", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "スキーマ差分のレビュー" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[data-page="admin-schema"]')).toBeVisible();
  // read-only guard: Bulk Resolve / Bulk Rollback モーダルを開いていないこと
  await expect(page.getByTestId("bulk-resolve-modal")).toHaveCount(0);
  await expect(page.getByTestId("bulk-rollback-modal")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-schema-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-schema-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
```

### admin-meetings-authenticated.spec.ts

```ts
// workflow: issue-1127-authenticated-staging-visual-admin-screens-expansion
// Authenticated /admin/meetings staging visual baseline (read-only initial render).
// Read-only: never submits 開催日作成, never opens the attendance drawer, never triggers 出席追加/削除/更新.

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11Dir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1127-authenticated-staging-visual-admin-screens-expansion/outputs/phase-11",
);

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging /admin/meetings authenticated read-only baseline", async ({ page }) => {
  await page.goto("/admin/meetings", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "開催日 / 出席管理" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[aria-label="開催 KPI"]')).toBeVisible();
  // read-only guard: 出席操作 toast を発火させていないこと(drawer 未操作)
  await expect(page.getByTestId("attendance-toast")).toHaveCount(0);
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("admin-meetings-authenticated.png", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
  mkdirSync(phase11Dir, { recursive: true });
  await page.screenshot({
    path: join(phase11Dir, "admin-meetings-authenticated.png"),
    fullPage: true,
    animations: "disabled",
  });
});
```

## 5.4 入力・出力・副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `admin.storageState.json`（setup.staging-auth.ts が mint）、staging baseURL |
| 出力 | `*-snapshots/*-authenticated-staging-visual-{platform}.png`（baseline）+ execution 時 `outputs/phase-11/*.png` |
| 副作用 | **なし**（read-only GET のみ。mutation トリガー非クリック。staging D1 への書き込みゼロ）|

## 5.5 実行コマンド（user-gated / execution 時）

```bash
# 認識確認（read-only / 副作用なし）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list

# baseline 初回生成（staging 認証必須 / user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots
```

## 5.6 Phase 5 完了条件

- [x] 5 spec の正本コードを確定（canonical 名・selector・read-only ガード込み）
- [x] 変更対象ファイル一覧を新規/編集で明示（プロダクトコード不変を確認）
- [x] 副作用「なし」を設計で保証（mutation 非クリック + ガード assertion）
- [x] 5 spec を物理作成した（`apps/web/playwright/tests/visual-staging-authenticated/`）
- [x] `--list` で project 認識を確認する（local / read-only）
- [ ] （execution 時 / user-gated）staging 認証で baseline + evidence copy を生成
