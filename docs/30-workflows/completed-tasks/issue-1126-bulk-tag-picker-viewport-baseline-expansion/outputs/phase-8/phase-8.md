# Phase 8: リファクタリング方針

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」のリファクタリング方針フェーズ。
本フェーズはコードを実装済み。本実行サイクルが従うべき DRY 化方針・既存挙動の保持境界・過剰設計の回避基準を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 8（リファクタリング方針） |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` |
| 設計 | B案（同一 spec 内で `page.setViewportSize()` を切替え、各 viewport で assign/unassign を撮る） |

## 1. リファクタ対象

新規 6 baseline を追加するにあたり、desktop と responsive で重複する「mode toggle → assign/unassign capture」の手続きを最小限の DRY 化で集約する。過剰な抽象化は避け、Playwright spec の可読性を維持する。

### 1.1 setup / mode toggle ロジックの helper 関数化

desktop / mobile / tablet / wide のいずれでも「会員2件を選択して一括操作 region を表示する」「解除モードへ切り替える」という手続きが繰り返される。実コードではこの重複を2つの module-local helper に閉じた。

```text
prepareBulkRegion(page)
  - /admin/members を開く
  - member checkbox を2件選択する
  - BulkActionBar の一括操作 region を返す
  - fresh page load のため開始 mode は assign

switchToUnassignMode(page)
  - 一括操作 region 内の「解除」button を click
  - aria-pressed="true" を確認する
```

- desktop 既存 test は `SNAP.assign` / `SNAP.unassign` の無 suffix baseline 名を維持する。
- responsive test は viewport ごとに fresh `prepareBulkRegion(page)` から始めるため、前 viewport の mode state を引き継がない。
- helper は spec ファイル内の module-local function とし、外部 export しない（このタスク固有・他 spec から共有しない）。

### 1.2 viewport ループの DRY 化

mobile / tablet / wide の 3 viewport は同一構造の繰り返しのため、`RESPONSIVE_VIEWPORTS` を `for...of` で回し、viewport ごとに独立した `test(...)` を生成する。

```text
for (const vp of RESPONSIVE_VIEWPORTS) {
  test(`... ${vp.name} ...`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const bulkRegion = await prepareBulkRegion(page);
    await expect(bulkRegion).toHaveScreenshot(`bulk-tag-picker-assign-mode-${vp.name}.png`);
    await switchToUnassignMode(page);
    await expect(bulkRegion).toHaveScreenshot(`bulk-tag-picker-unassign-mode-${vp.name}.png`);
  });
}
```

- desktop は viewport を切替えずに（既定 1280×800 のまま）既存 test と既存 snapshot 名を維持する。これにより既存 desktop baseline の撮影条件（viewport / snapshot arg）が変わらない。

### 1.3 `RESPONSIVE_VIEWPORTS` 定数の配置

| 候補配置 | 採否 | 理由 |
| --- | --- | --- |
| `apps/web/playwright/fixtures/viewports.ts` 内に `wide` を additive 追加し、spec 側で mobile/tablet/wide を選んで配列化 | 採用 | viewport の物理サイズの正本は fixture に集約。`wide:{width:1920,height:1080}` を additive 追加するのみで既存 `mobile`/`tablet` は不変 |
| spec ファイル内にインラインでサイズ直書き | 不採用 | サイズの重複定義を生み、他 spec との整合が崩れる |

- `RESPONSIVE_VIEWPORTS`（mobile / tablet / wide の 3 件に suffix を持たせた配列）は spec ファイル内に module-local const として定義し、物理サイズは fixture の `viewports` を参照する。suffix（`-mobile` 等）は baseline 名規約であり spec 固有のため spec 側に置く。

## 2. 既存挙動の保持

| 保持項目 | 保持内容 |
| --- | --- |
| desktop baseline 名 | `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png`（suffix なし）を一切変更しない |
| desktop 出力先 | Playwright 慣習の `{testFileName}-snapshots/` 配下。Phase 11 evidence copy 先は logical 名と同じ `outputs/phase-11/screenshots/bulk-tag-picker-{assign,unassign}-mode.png` |
| desktop 撮影条件 | viewport 1280×800（既定）で desktop を先に撮る順序を保持。helper 経由化しても撮影パラメータは同値 |
| diff 閾値 | `maxDiffPixelRatio`（Phase 9 §3）は desktop 既存値と同一を全 viewport に適用。desktop の判定基準を変えない |
| read-only 不変条件 | `getByTestId('bulk-tag-result')` count 0。helper 化・ループ化しても apply を呼ばない（mutation 厳禁） |
| project | `staging-visual-authenticated`（既存）。新規 project を作らない |

> helper 関数化の唯一の合格基準は「desktop の 2 baseline が、リファクタ前後で同一画像・同一ファイル名・同一出力先に生成されること」である。これが崩れる抽象化は採用しない。

## 3. 過剰設計の回避（YAGNI）

| 回避する設計 | 不採用理由 |
| --- | --- |
| viewport ごとに Playwright project を複製（mobile-project / tablet-project / wide-project） | `playwright.config.ts` の改修が発生し、CI 無改修の不変条件に反する。同一 spec 内の `setViewportSize()` で十分 |
| `playwright.config.ts` / `projects` への手入れ | 本タスクは spec / fixture の 2 ファイル編集に限定。config 変更は禁止 |
| viewport × state を完全データ駆動化する汎用フレームワーク化 | 2 ファイル・8 セルの規模に対し過剰。`prepareBulkRegion` / `switchToUnassignMode` + responsive 3 test で十分 |
| 中間 viewport（1024px 等）の追加 | mobile/tablet/wide の 3 代表幅で responsive を代表（Phase 7 §3）。追加は要件外 |
| helper の共有モジュール化（他 spec からの再利用） | 現状このタスクの spec のみが使う。Rule of Three 未到達のため spec module-local に留める |
| result mutation 状態の baseline 追加 | issue-1125 担当でスコープ外（Phase 7 §3）。本タスクで撮らない |

> 抽象化は「desktop + responsive で重複する mode toggle 手続き」の 1 点のみに限定する。viewport 別 project 複製や config 改修は、CI 無改修・2 ファイル編集という不変条件を破るため明確に不採用とする。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | helper / ループの実装先 |
| 編集対象 fixture | `apps/web/playwright/fixtures/viewports.ts` | `wide` additive 追加先 |
| Phase 5 設計 | `../phase-5/phase-5.md` | desktop 先行 capture → viewport 切替の順序 |
| Phase 6 テスト追加方針 | `../phase-6/phase-6.md` | visual assertion 列挙 |
| Phase 7 カバレッジ | `../phase-7/phase-7.md` | viewport × state matrix（8 セル）|

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-8/phase-8.md` | リファクタ対象（`prepareBulkRegion/switchToUnassignMode` helper 化 / viewport ループ DRY 化 / `RESPONSIVE_VIEWPORTS` 配置）、既存 desktop 2 baseline の挙動保持境界、YAGNI（viewport 別 project 複製・config 改修・中間幅追加の不採用）|

## 完了条件（Phase 8）

| 項目 | 基準 |
| --- | --- |
| DRY 方針 | setup を `prepareBulkRegion(page)`、mode toggle を `switchToUnassignMode(page)` に集約する方針を確定した |
| 定数配置 | `wide` を fixture へ additive 追加し、`RESPONSIVE_VIEWPORTS` を spec module-local に置く方針を確定した |
| 既存保持 | desktop 2 baseline の名前・出力先・diff 閾値・撮影順序を不変に保つ境界を明記した |
| YAGNI | viewport 別 project 複製と config 改修を不採用とする根拠（CI 無改修・2 ファイル限定）を明記した |
