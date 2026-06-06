# 実装ガイド — issue-1077 bulk tag picker 認証付き staging visual baseline

## Part 1: 中学生にもわかる説明（なぜ必要か → 何をするか）

### なぜ必要か

なぜ必要かというと、見た目の確認を人の記憶や手作業だけに任せると撮り忘れが起きるからです。たとえば、学校の図書委員が、たくさんの本にいっぺんに「貸出中」というシールを貼る場面を想像してください。本を何冊か選んでから「シール貼り付けパネル」を開き、どのシールを貼るか・はがすかを決めます。この「パネルがちゃんと正しく表示されるか」を、毎回人の目で確認するのは大変です。

このサイトの管理画面にも、会員を複数えらんで「タグ」をまとめて付けたり外したりするパネル（BulkActionBar の tag picker）があります。見た目が崩れていないかを、人が毎回スクリーンショットを撮って見比べるのは手間がかかり、撮り忘れも起きます。

### 今回作ったもの

何をするかというと、コンピューターに「本物の管理画面にログインして、会員を選び、パネルを開いて、写真を自動で撮ってくれる」係をお願いします。これが今回追加する自動テスト（Playwright spec）です。一度お手本の写真（baseline）を用意しておけば、次からは新しい写真とお手本を自動で見比べて、違いがあれば教えてくれます。

大事なルールが一つあります。今回の係は「写真を撮るだけ」で、実際にタグを付けたり外したりはしません。本物のデータをいじってしまうと、みんなが使っている練習用サーバー（staging）のデータが壊れてしまうからです。だから「適用ボタン」は絶対に押さず、パネルを開いた状態の写真だけを撮ります。

## Part 2: 開発者向け詳細

### 2.1 追加するファイル

| 区分 | パス |
| --- | --- |
| 新規 Playwright spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |

config 編集は不要。既存の `staging-visual-authenticated` project と admin storageState（`mint-staging-storage-state.ts` が mint）をそのまま再利用する。参照モデルは同ディレクトリの `admin-dashboard-authenticated.spec.ts`。

### 2.2 セレクタ表（実コード由来）

`apps/web/src/features/admin/components/_members/BulkActionBar.tsx` から確定:

| 要素 | 取得方法 | 由来 |
| --- | --- | --- |
| BulkActionBar region | `getByRole("region", { name: "一括操作" })` | `aria-label="一括操作"`（L141） |
| tag picker | `getByRole("region", { name: "タグ一括付与・解除" })` | `<section aria-label="タグ一括付与・解除">`（L177-L179） |
| 付与/解除トグル | `getByRole("group", { name: "付与モード" })` | `role="group" aria-label="付与モード"`（L183） |

member 選択は `/admin/members` テーブル行のチェックボックスを複数 toggle することで BulkActionBar を出現させる。

### TypeScript 型定義

```ts
type BulkTagScreenshotName =
  | "bulk-tag-picker-assign-mode.png"
  | "bulk-tag-picker-unassign-mode.png";

interface BulkTagAuthenticatedEvidence {
  project: "staging-visual-authenticated";
  storageStatePath: string;
  screenshotNames: readonly BulkTagScreenshotName[];
  evidenceDir: string;
  readOnly: true;
}
```

### APIシグネチャ

```bash
PLAYWRIGHT_EVIDENCE_DIR=<workflow outputs/phase-11/evidence> \
PLAYWRIGHT_STAGING_BASE_URL=<staging URL> \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

### 使用例

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

### 2.3 capture フロー（TypeScript spec 例）

```ts
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

test("staging /admin/members bulk tag picker (assign/unassign) baseline", async ({ page }) => {
  await page.goto("/admin/members", { waitUntil: "networkidle" });

  // 1) member を複数選択して BulkActionBar を出現させる（mutation は一切行わない）
  const rowCheckboxes = page.getByRole("row").getByRole("checkbox");
  await rowCheckboxes.nth(0).check();
  await rowCheckboxes.nth(1).check();

  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });
  const tagPicker = bulkRegion.getByRole("region", { name: "タグ一括付与・解除" });
  await expect(tagPicker).toBeVisible();

  // アニメーション無効化（差分安定化）
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });

  // 2) assign モード baseline（picker scoped）
  await expect(bulkRegion).toHaveScreenshot("bulk-tag-picker-assign-mode.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });

  // 3) 付与/解除トグルを「解除」へ切り替え
  const modeGroup = bulkRegion.getByRole("group", { name: "付与モード" });
  await modeGroup.getByRole("button", { name: /解除/ }).click();

  // 4) unassign モード baseline
  await expect(bulkRegion).toHaveScreenshot("bulk-tag-picker-unassign-mode.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
});
```

> 上記はセレクタ・命名・フローの仕様例。実装済み spec は実 row checkbox とトグルボタンを既存 DOM に合わせて指定する。

### 2.4 検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 親 component 回帰（result 状態は TC-BAB-TAG-03 で担保）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx

# 認証付き staging baseline 生成（user-gated・初回のみ --update-snapshots）
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test --project=staging-visual-authenticated \
  admin-members-bulk-tag-authenticated --update-snapshots
```

### エラーハンドリング

- BulkActionBar が出現しない: member 選択が 0 件の可能性。staging に最低 2 件の表示可能 member が存在することを前提とする（前提崩れ時は明示 fail）。
- storageState 期限切れ: `mint-staging-storage-state.ts` を再実行して admin storageState を mint し直す。
- baseline 差分の偽陽性: アニメーション無効化 styleTag と `maxDiffPixelRatio: 0.05` で吸収。フォント読み込み待ちのため `networkidle` を使う。

### エッジケース

- **result 2 状態（all-success / partial-failure）は本 spec に含めない**。実機取得は `POST /admin/members/tags/bulk` の mutation を要し staging 共有 D1 に副作用が出るため。result summary の描画は API レスポンス shape から純粋に決まり、`BulkActionBar.spec.tsx` TC-BAB-TAG-03 と親 local fixture baseline で既に担保済み。
- staging データ依存（member 件数 / 既存タグ）により picker 内容は変動しうる。baseline は picker の構造・レイアウトの回帰検出を目的とし、データ内容の厳密一致は目的としない。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `PLAYWRIGHT_EVIDENCE_DIR` | `../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence` |
| `PLAYWRIGHT_STAGING_BASE_URL` | `https://ubm-hyogo-web-staging.daishimanju.workers.dev` |
| Playwright project | `staging-visual-authenticated` |
| snapshot names | `bulk-tag-picker-assign-mode.png`, `bulk-tag-picker-unassign-mode.png` |
| evidence copies | `bulk-tag-picker-assign-mode-authenticated-staging.png`, `bulk-tag-picker-unassign-mode-authenticated-staging.png` |

### テスト構成

| 層 | 対象 | 役割 |
| --- | --- | --- |
| component regression | `BulkActionBar.spec.tsx` | result summary など pure UI state を mutation なしで担保 |
| authenticated staging visual | `admin-members-bulk-tag-authenticated.spec.ts` | 実 `/admin/members` で picker assign/unassign baseline を取得 |
| setup / teardown | `setup.staging-auth.ts` / `teardown.staging-auth.ts` | admin storageState の mint と削除 |

## 視覚証跡（VISUAL_ON_EXECUTION）

本タスクは VISUAL_ON_EXECUTION。証跡は認証付き staging Playwright run で取得する visual baseline であり、implemented_local_runtime_pending 段階では **runtime pending**（未取得）である。

| canonical screenshot 名（`toHaveScreenshot` arg） | 内容 | 状態 |
| --- | --- | --- |
| `bulk-tag-picker-assign-mode.png` | member 複数選択 + tag picker（付与モード） | pending |
| `bulk-tag-picker-unassign-mode.png` | 付与/解除トグルを解除へ切替えた picker | pending |

capture metadata:

| 項目 | 値 |
| --- | --- |
| project | `staging-visual-authenticated` |
| storageState | admin（`mint-staging-storage-state.ts` が mint した `.auth/admin.storageState.json`） |
| baseline 格納先 | `{testFileName}-snapshots/`（Playwright 慣習。`admin-members-bulk-tag-authenticated.spec.ts-snapshots/`） |
| evidence copy 先 | `outputs/phase-11/screenshots/bulk-tag-picker-assign-mode-authenticated-staging.png` / `outputs/phase-11/screenshots/bulk-tag-picker-unassign-mode-authenticated-staging.png` |
| reporter evidence | `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence` を指定し、generic staging visual 既定の UT-DSF / issue-901 側へ report を流さない |
| capture command | §2.4 の Playwright コマンド（user-gated） |

baseline 生成・evidence copy・commit はいずれも本 wave で user 承認後に実施する。canonical 名は phase-11 manual-test-result.md / artifacts.json `canonical_screenshots` と一致させること。
