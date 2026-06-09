# 実装ガイド — issue-1127 authenticated staging visual の admin 画面横展開

## Part 1: これは何か（初学者・中学生レベル）

### 背景（なぜ必要か）

ウェブサイトの管理画面は、コードを直したときに気づかないうちに見た目が崩れることがあります。
それを早く見つけるために「正しい見た目の写真（baseline）」をあらかじめ撮っておき、
変更のたびに自動で見比べる仕組みがあります。これを「ビジュアル回帰テスト」と呼びます。

### 要約（何をするか）

これまでこの「写真の撮影」は、管理画面の一部（ダッシュボード・タグ・会員一覧）でしか
できていませんでした。今回はその仕組みを、まだカバーできていない 5 つの管理画面
（監査ログ・依頼キュー・Identity 重複候補・スキーマ差分・開催日/出席管理）にも広げます。
たとえるなら「家の何部屋かだけ写真を撮っていたのを、残りの 5 部屋も撮るようにする」ことです。

### 実装ステップ（やること）

1. 管理者としてログインした状態の「合鍵（storageState）」は、すでにある仕組みを使い回します。
2. 5 つの画面それぞれに、画面を開いて写真を撮るだけの小さなテストファイルを 1 つずつ追加します。
3. このとき「保存」や「削除」などのボタンは絶対に押しません（押すとデータが変わってしまうから）。
   開いた瞬間の見た目だけを撮ります。

### 既知の制限（気をつけること）

- ボタンを押した「後」の画面（例: 削除したあとの表示）は、今回は撮りません。
  それはデータをわざと変える必要があり、別の専用タスク（C-1 系）でやります。
- 実際の写真撮影は本番ではなくテスト用環境（staging）で行い、人の承認を得てから実行します。

---

## Part 2: 技術詳細（開発者・技術者レベル）

### 背景（current architecture）

issue-1077 が確立した authenticated staging visual 基盤を再利用する:

- Playwright project `staging-visual-authenticated`（`apps/web/playwright.config.ts`、`testDir: './playwright/tests/visual-staging-authenticated'`、`testMatch` は setup/teardown のみ除外）
- `setup.staging-auth.ts` が `mint-staging-storage-state.ts` で `admin.storageState.json` を mint
- CI `.github/workflows/playwright-staging-visual-authenticated.yml`（`paths: ['apps/web/playwright/tests/visual-staging-authenticated/**']`）
- `snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-authenticated-staging-visual-{platform}{ext}'`

testDir + path glob により、spec を当該ディレクトリへ置くだけで project / CI が追加設定なしに認識する。

### 要約（実装対象）

`apps/web/playwright/tests/visual-staging-authenticated/` に read-only spec を 5 本新規追加する。
プロダクトコード（`apps/web/src` / `apps/api`）・D1 schema・`playwright.config.ts`・CI workflow は不変（AC-5/AC-6）。

| spec file（新規）| route | role=heading | 安定 selector | screenshot `{arg}` | read-only ガード |
| --- | --- | --- | --- | --- | --- |
| `admin-audit-authenticated.spec.ts` | `/admin/audit` | `監査ログ` | `[data-component="admin-audit"]` | `admin-audit-authenticated.png` | mutation 要素なし |
| `admin-requests-authenticated.spec.ts` | `/admin/requests` | `依頼キュー` | heading 主待機 | `admin-requests-authenticated.png` | `getByRole("dialog").toHaveCount(0)` |
| `admin-identity-conflicts-authenticated.spec.ts` | `/admin/identity-conflicts` | `Identity 重複候補` | `section[data-route="admin"]` | `admin-identity-conflicts-authenticated.png` | `getByRole("dialog").toHaveCount(0)` |
| `admin-schema-authenticated.spec.ts` | `/admin/schema` | `スキーマ差分のレビュー` | `[data-page="admin-schema"]` | `admin-schema-authenticated.png` | `getByTestId("bulk-resolve-modal"/"bulk-rollback-modal").toHaveCount(0)` |
| `admin-meetings-authenticated.spec.ts` | `/admin/meetings` | `開催日 / 出席管理` | `[aria-label="開催 KPI"]` | `admin-meetings-authenticated.png` | `getByTestId("attendance-toast").toHaveCount(0)` |

### 実装ステップ（spec 構造）

各 spec は phase-5.md の canonical コードに従う:

```ts
test.use({ storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json") });

test("staging <ROUTE> authenticated read-only baseline", async ({ page }) => {
  await page.goto("<ROUTE>", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "<HEADING>" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("<SELECTOR>")).toBeVisible();      // 画面により省略
  await expect(<MUTATION_GUARD>).toHaveCount(0);                // 画面により
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("<NAME>.png", { fullPage: true, maxDiffPixelRatio: 0.05, animations: "disabled" });
  // execution 時のみ Phase 11 evidence へ二重 capture
});
```

入出力・副作用:
- 入力: `admin.storageState.json` + staging baseURL
- 出力: `*-snapshots/*.png`（baseline）+ execution 時 `outputs/phase-11/*.png`
- 副作用: なし（read-only GET のみ・mutation 非クリック）

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --list
# baseline 初回生成（staging 認証 / user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots
```

### 既知の制限

- mutation result 状態（承認後 / merge 後 / 削除後 / bulk 適用後）の baseline は本タスク対象外。
  staging 共有 D1 への seed/cleanup を伴う C-1 系（issue-1125 系列）へ委譲する恒久境界。
- 実 capture / baseline 生成 / commit / PR は user-gated（CONST_002）。implemented_local_runtime_pending 時点では baseline 未生成。
- staging D1 が空の場合 empty state を撮るが、回帰検出目的では有効（execution 時に baseline 確定）。

---

## 視覚証跡

本タスクは **VISUAL_ON_EXECUTION**（実 capture は execution 時 / user-gated）。`implemented_local_runtime_pending` 時点では実 screenshot 未生成。
Phase 11 evidence は `outputs/phase-11/manual-test-result.md`（present）+ 5 screenshot 行（n/a / baseline 未生成）。
canonical screenshot 名 5 件は phase-5.md（spec 正本）/ phase-11.md / manual-test-result.md / 本ガイドで一致。
実 capture 実行時に `outputs/phase-11/admin-{audit,requests,identity-conflicts,schema,meetings}-authenticated.png` を生成し、
Status を present へ更新する。
