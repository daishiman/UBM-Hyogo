# Phase 2: 設計 — authenticated staging visual spec 横展開

## 2.0 要件レビュー（システム系 / 戦略系 / 問題解決系）

| 観点 | 一次結論 |
| --- | --- |
| 真の論点 | 「汎用 authenticated staging visual 基盤を、staging D1 へ副作用を残さずに admin 5 画面へ横展開する」。論点は実装難度ではなく **read-only / mutation 副作用境界の正確な判定** にある |
| 依存関係・責務境界 | 基盤（project / mint / CI）は issue-1077 が所有し不変。本タスクは spec ファイルのみを新規所有。プロダクトコード（apps/web/src・apps/api）の状態所有権には一切触れない |
| 価値とコストの不均衡 | 価値=5 画面の実機回帰検出。コスト=spec 5 本（雛形コピー + selector 差し替え）で極小。最大コスト部品は「mutation 副作用の誤判定リスク」であり、設計で潰す |
| 改善優先順位 | (1) pure read-only の `/admin/audit` を最優先で雛形確立 → (2) list 表示中心の requests / identity-conflicts → (3) フォーム常時表示の schema / meetings。全て今サイクル内 |
| 4 条件 | 価値性=○（実機回帰検出範囲拡大）/ 実現性=○（雛形コピーのみ）/ 整合性=○（基盤・命名・トークン規約に整合）/ 運用性=○（ファイル追加で CI 自動認識・新規 workflow 不要）|

### 因果ループ（balancing）

```
visual baseline 拡張 → 回帰検出範囲↑ → staging 実機の崩れ早期発見↑ → 手戻り↓
        ↑                                                              │
        └──────────── 副作用境界の誤判定 → staging D1 汚染リスク ←─────┘（このループを read-only 限定で遮断）
```

---

## 2.1 基盤の自動認識メカニズム（実証）

| 構成要素 | current 定義 | 追加設定の要否 |
| --- | --- | --- |
| Playwright project | `apps/web/playwright.config.ts` の `staging-visual-authenticated`（`testDir: './playwright/tests/visual-staging-authenticated'`、`testMatch` は setup/teardown のみ除外）| **不要**（testDir 配下の `.spec.ts` を自動収集）|
| 依存 project | `dependencies: ['setup-authenticated-staging']`（storageState mint）+ teardown 連鎖 | **不要**（project 単位で継承）|
| baseURL | `stagingBaseURL`（`PLAYWRIGHT_STAGING_BASE_URL ?? ... ?? 'https://ubm-hyogo-web-staging.daishimanju.workers.dev'`）| **不要** |
| snapshot 名 | `snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-authenticated-staging-visual-{platform}{ext}'` | **不要**（spec 名から自動生成）|
| CI trigger | `.github/workflows/playwright-staging-visual-authenticated.yml` の `paths: ['apps/web/playwright/tests/visual-staging-authenticated/**']` | **不要**（glob で新ファイル自動 trigger）|

> **結論**: 5 spec を `apps/web/playwright/tests/visual-staging-authenticated/` に置くだけで project / CI が認識する。
> 新規 project・新規 workflow は作らない（CONST = issue #1127 §2.3 含まないもの）。

---

## 2.2 spec 共通設計（雛形 = admin-tags-authenticated.spec.ts / admin-dashboard-authenticated.spec.ts）

全 5 spec は次の共通構造を取る（current 規約の逐語踏襲）:

```ts
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test("staging <ROUTE> authenticated read-only baseline", async ({ page }) => {
  await page.goto("<ROUTE>", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "<HEADING>" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("<STABLE_SELECTOR>")).toBeVisible();
  // 副作用境界ガード: mutation 完了を示す要素が存在しないこと（read-only 証跡）
  await expect(page.getByTestId("<MUTATION_RESULT_TESTID>")).toHaveCount(0); // 該当画面のみ
  await page.addStyleTag({ content: disableAnimations });
  await expect(page).toHaveScreenshot("<SCREENSHOT_NAME>", {
    fullPage: true,
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});
```

> Phase 11 evidence への二重 capture（`page.screenshot({ path: phase11Dir })`）は execution 時に各 spec へ含める
> （admin-tags-authenticated.spec.ts と同型）。implemented_local_runtime_pending 時点では phase11Dir はこの workflow の
> `outputs/phase-11/` を指す（Phase 5 §5.3 参照）。

---

## 2.3 画面別 read-only / mutation 副作用境界判定（最重要設計）

各画面の **初期表示（goto 直後・クリックなし）は全て read-only**（D1 への mutation はユーザー操作のクリックでのみ発火）。
本タスクは初期表示のみを capture し、下表の mutation トリガーを **spec から一切クリックしない**。

| route | heading（role=heading）| 安定 selector | mutation トリガー（クリック禁止）| read-only ガード assertion | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `/admin/audit` | `監査ログ` | `[data-component="admin-audit"]` | なし（検索/リセットは GET のみ）| 不要（mutation 要素なし）| 最優先（pure read-only）|
| `/admin/requests` | `依頼キュー` | `[aria-labelledby="admin-requests-h"]` / region `aria-label="依頼一覧"` | 「承認」「却下」ボタン（POST `/api/admin/requests/resolve`）| `RequestConfirmDialog` 非表示を確認（dialog を開かない）| 高 |
| `/admin/identity-conflicts` | `Identity 重複候補` | `[aria-label="Identity 重複候補一覧"]` | 「merge」「別人マーク」ボタン（POST merge/dismiss）| 確認フロー（確認1/2）が表示されていないことを確認 | 高 |
| `/admin/schema` | `スキーマ差分のレビュー` | `[data-page="admin-schema"]` | 「割当」「Bulk Resolve 確定」「rollback」「Bulk Rollback 確認」「再集計を実行」| `[data-testid="bulk-resolve-modal"]` / `[data-testid="bulk-rollback-modal"]` を開かない（COUNT 0 確認）| 中 |
| `/admin/meetings` | `開催日 / 出席管理` | group `aria-label="開催 KPI"` / h2 `開催日一覧` | 開催日作成フォーム submit・出席追加/削除・開催日更新/削除 | `[data-testid="attendance-toast"]` を発火させない（drawer を開かない）| 中 |

### 副作用境界の設計判断

- **フォームが初期描画される画面（schema / meetings）でも、submit/クリックしない限り D1 mutation は起きない**。
  Agent 調査の「❌ 脆弱」判定は「mutation ボタンが常時表示される」ことへの注意喚起であり、本 spec は
  **要素を操作しない（goto → assert visible → screenshot のみ）** ため副作用は発生しない。
- schema / meetings は「mutation UI を含む画面の read-only 初期スナップショット」であり、
  「mutation を実行した結果状態」とは別物（後者は C-1 系へ委譲 / Phase 1 §2.3）。
- 防御として、各 spec は対象画面に mutation 完了を示す要素（modal / toast / result）が描画されていないことを
  `toHaveCount(0)` で assert し、「read-only 状態を撮った」ことを証跡化する（AC-3 / AC-7）。

---

## 2.4 SubAgent lane 設計（仕様書作成フェーズ）

| lane | 担当 | 並列可否 |
| --- | --- | --- |
| backbone（中央集約）| index.md / artifacts.json ×2 / phase-1,2,3 / phase-5（spec コード正本）/ phase-12 全 6 + main / phase-13 | 直列（オーケストレータが所有 = canonical drift 防止）|
| narrative lane A | phase-4（test-plan）/ phase-6（test-additions）| 並列 |
| narrative lane B | phase-7（coverage）/ phase-8（refactor）/ phase-9（qa）/ phase-10（final-review）| 並列 |
| evidence lane C | outputs/phase-11/manual-test-result.md / phase-11.md | 並列 |

> spec コード（5 本の `.spec.ts` 全文）は Phase 5 で**オーケストレータが正本化**し、各 lane へ canonical 名 + コードを配布する。
> 命名ドリフト（screenshot 名・ファイル名・selector）を防ぐため、コード生成 lane は単一所有とする（FB-LLM-MOD-05-001）。

---

## 2.5 設計上の不変条件遵守

| 不変条件 | 遵守方法 |
| --- | --- |
| CLAUDE.md #5（D1 直接アクセス禁止）| spec は staging URL 経由で UI を開くのみ。D1 binding に触れない |
| CLAUDE.md #8（test suffix）| 全 spec は `*.spec.ts` |
| UI prototype alignment #2（OKLch トークン）| spec は描画を撮るだけ。トークン直書きなし |
| issue #1127 §2.3（新規 project/workflow 禁止）| 既存 project / CI を再利用 |
| CONST_002（commit/PR 禁止）| implemented_local_runtime_pending。実装・commit・staging capture は user-gated |

---

## 2.6 Phase 2 完了条件

- [x] 基盤の自動認識メカニズムを実証し、新規 project/workflow 不要を確定
- [x] spec 共通構造（雛形踏襲）を設計
- [x] 5 画面の read-only / mutation 副作用境界を heading・selector・mutation トリガー・ガード assertion 付きで確定
- [x] SubAgent lane（中央集約 backbone + 並列 narrative）を設計し canonical drift 防止方針を固定
- [x] 不変条件遵守を確認
