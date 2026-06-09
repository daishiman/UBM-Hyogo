# 実装ガイド — issue-1125 bulk tag 結果サマリ 2 状態の認証付き staging mutation visual baseline

## Part 1: 中学生にもわかる説明（なぜ必要か → 何をするか）

### なぜ必要か

なぜ必要かというと、「実際にやってみた結果」がどう表示されるかは、本物の環境で実際に操作してみないと確かめられないからです。

たとえば、学校の図書委員が、たくさんの本にいっぺんに「貸出中」のシールをまとめて貼る場面を想像してください。本を何冊か選んで「シールを貼る」ボタンを押すと、「3 冊に貼れました」「でも 1 冊はもう捨てられた本だったので貼れませんでした」という **結果のお知らせ** が出ます。この「結果のお知らせ」が、ちゃんと数も内容も正しく表示されるかを確かめたいのです。

このサイトの管理画面にも、会員を複数えらんで「タグ」をまとめて付ける機能があり、付けたあとに **結果サマリ**（何人に付いたか・付けられなかった人がいたか）が出ます。この結果サマリには 2 つのパターンがあります。

- **全部うまくいったパターン（all-success）**: 選んだ全員にちゃんとタグが付いた。
- **一部だけ失敗したパターン（partial-failure）**: 一部の人は退会済みだったので、その人だけタグが付かずに「スキップ（とばした）」と表示される。

これまでは、この結果サマリの見た目は「練習用のニセ画面」を作って写真に撮るだけで、本物の操作を通した結果は確かめていませんでした。これだと「本物のログイン・本物のデータ・本物のボタン操作を通したら本当にこの見た目になるのか」が分かりません。

### 今回やること

何をするかというと、コンピューターに「本物の練習用サーバー（staging）にログインして、会員を選び、タグを付けるボタンを実際に押して、出てきた結果サマリの写真を撮ってきてね」とお願いします。これが今回の自動テスト（Playwright spec）です。全部うまくいったときの写真と、一部失敗したときの写真の 2 枚をお手本（baseline）として残します。

ただし、本物のデータをいじるので、大事なルールが 2 つあります。

1. **専用の「テスト用ニセ会員」だけを使う**: みんなが使うデータは絶対に触りません。名前の頭に `e2e_test_issue1125_` という目印が付いた、このテスト専用の会員とタグだけを、操作の前に用意します。
2. **終わったら必ず片付ける**: 写真を撮り終わったら（途中で失敗しても、中断しても）、用意したテスト用データを **必ず** 全部消して、本当に 0 件になったか数えて確認します。これを「片付けが確実に走る仕組み（trap）」で保証します。

これで、本物の操作を通した結果サマリの見た目を、安全に・繰り返し確認できるようになります。

## Part 2: 開発者向け詳細

### 2.1 追加するファイル

| 区分 | パス |
| --- | --- |
| 新規 Playwright spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` |
| 新規 seed SQL | `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` |
| 新規 cleanup SQL | `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` |
| 新規 capture runner shell | `scripts/smoke/capture-bulk-tag-result.sh` |
| 新規 runner shell test（Phase 6） | `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` |

config 編集は不要。既存の `staging-visual-authenticated` project（`testDir: ./playwright/tests/visual-staging-authenticated`）と admin storageState（`setup.staging-auth.ts` が mint）をそのまま再利用する。参照モデルは read-only 先例 `admin-members-bulk-tag-authenticated.spec.ts`（picker 2 状態・mutation 非実行）と issue-1081 `scripts/smoke/runtime-tag-bulk.sh`。

### 2.2 技術構成（3 段の責務分離）

副作用の所有権は **shell runner に集約** する。Playwright spec は UI 操作 + 実 mutation + screenshot にのみ責務を持ち、D1 への seed/cleanup は持たない。

```
scripts/smoke/capture-bulk-tag-result.sh        ← 副作用オーケストレーション（状態所有者）
  ├─ assert_staging_guard                        ← production 拒否 / CF_D1_DATABASE=ubm-hyogo-db-staging 固定 / staging allowlist
  ├─ seed()         : cf.sh d1 execute --remote --file bulk-tag-result-staging-seed.sql
  ├─ capture()      : playwright test --project=staging-visual-authenticated \
  │                     admin-members-bulk-tag-result-authenticated --update-snapshots
  │                     （spec が UI 操作 + 実 mutation + toHaveScreenshot を実行）
  └─ trap 'cleanup || true; write_summary' EXIT
                     : cf.sh d1 execute --remote --file bulk-tag-result-staging-cleanup.sql
                       → 6 table の synthetic 残存 0 を count 検証
```

| レイヤ | 責務 | 状態所有権 |
| --- | --- | --- |
| `capture-bulk-tag-result.sh` | guard / seed / capture 起動 / cleanup / 残存検証 / redact ログ | staging D1 の synthetic fixture ライフサイクル |
| `admin-members-bulk-tag-result-authenticated.spec.ts` | storageState 認証 / member 選択 / tag 適用（実 mutation）/ result 待機 / screenshot | UI interaction と snapshot |
| seed/cleanup SQL | synthetic fixture の投入 / 回収（`e2e_test_issue1125_` prefix のみ） | D1 行データ |

### 2.3 セレクタ表（実コード由来）

`apps/web/src/features/admin/components/_members/BulkActionBar.tsx` から確定:

| 要素 | 取得方法 | 由来 |
| --- | --- | --- |
| BulkActionBar region | `getByRole("region", { name: "一括操作" })` | `aria-label="一括操作"` |
| tag picker | `getByRole("region", { name: "タグ一括付与・解除" })` | `<section aria-label="タグ一括付与・解除">` |
| 付与/解除トグル | `getByRole("group", { name: "付与モード" })` | `role="group" aria-label="付与モード"` |
| apply ボタン | `getByRole("button", { name: /人 × .+タグ を付与$/ })` | `${selectedIds.length}人 × ${selectedTagIds.size}タグ を${verb}` |
| result summary | `getByTestId("bulk-tag-result")` | `data-testid="bulk-tag-result"`（`aria-live="polite"`） |
| result counts | `getByTestId("bulk-tag-result-counts")` | 付与/解除/変更なし/退会済みスキップ/未登録タグ |
| result skipped list | `getByTestId("bulk-tag-result-skipped")` | `skipped.length>0` 時のみ描画 |
| result not-found list | `getByTestId("bulk-tag-result-not-found")` | `notFound.length>0` 時のみ描画 |
| 行 checkbox | `[data-testid="admin-members-row-{memberId}"] input[type="checkbox"]` | MembersTable 行・行内 checkbox `aria-label="{fullName} を選択"` |

### 2.4 status と frontend 集計

`POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts:726`）は `bulkApplyMemberTagsByAdmin` を呼び、item ごとに status を返す:

| status | 発生条件 | frontend 集計先 |
| --- | --- | --- |
| `assigned` | active member への付与 | counts「付与 N」 |
| `unassigned` | 解除モードでの解除 | counts「解除 N」 |
| `noop` | 既に同一状態（変化なし） | counts「変更なし N」 |
| `skipped_deleted` | 退会済み member（`member_status.is_deleted=1`）への付与 → スキップ | `bulk-tag-result-skipped` list + counts「退会済みスキップ N」 |
| `notFound` | 未登録 tagId（`tag_definitions` に無い）| `bulk-tag-result-not-found` list（本タスクでは UI 再現不可ゆえ取得しない） |

本タスクの partial-failure baseline は **`skipped_deleted`（退会済み member）による `skipped`** を主シナリオとする。`notFound`（未登録 tag）は tag picker が登録済み tag しか描画しない設計上 UI 操作で自然発生しないため staging runtime では取得せず、親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 が継続担保する（unassigned-task-detection.md の baseline 参照）。

### 2.5 staging guard / trap cleanup（AC-5 / AC-7 の核）

`capture-bulk-tag-result.sh` は次を必須実装する:

- `assert_staging_guard`: `CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / `PLAYWRIGHT_STAGING_BASE_URL` が production パターン（`production|ubm-hyogo-(web|api)-production`）に一致したら拒否 / staging allowlist（`staging|127\.0\.0\.1|localhost`）一致を要求。production 環境では一切実行しない。
- `trap 'cleanup || true; write_summary' EXIT`: Playwright の成功・失敗・中断いずれの経路でも cleanup を走らせ、`member_tags`(member_id) / `audit_log`(target_id) / `member_status`(member_id) / `member_identities`(member_id) / `member_responses`(response_id) / `tag_definitions`(tag_id) の 6 table で `e2e_test_issue1125_%` 残存件数が 0 であることを検証する。残存 ≠ 0 なら `fail_and_exit` で非 0 exit。
- `redact.sh`: seed/cleanup 結果・対象 URL・capture command・保存先・mutation 対象 ID をログに残す際に秘匿化する。

### 2.6 D1 remote トランザクション制約（seed/cleanup SQL の必須遵守）

🔴 seed/cleanup SQL に `BEGIN TRANSACTION;` / `COMMIT;` を含めない。Cloudflare D1 remote は `wrangler d1 execute --remote --file` で全文を暗黙アトミックバッチ実行するため明示 SQL トランザクションを拒否する（local miniflare では通るため見落としやすい。reference: `reference_d1_remote_no_sql_transaction`、test-accounts seed で実証済み）。issue-1081 の `bulk-tag-staging-seed.sql` は `BEGIN/COMMIT` を含むが、本タスクはこの制約に従い **明示トランザクションを除去した形で新規作成**する（コピーしない）。各 `DELETE` / `INSERT OR REPLACE` を裸で並べ、冒頭 DELETE で再実行冪等にする。

### APIシグネチャ（capture runner）

```bash
PLAYWRIGHT_STAGING_BASE_URL=<staging web URL> \
CF_D1_DATABASE=ubm-hyogo-db-staging \
  bash scripts/smoke/capture-bulk-tag-result.sh staging \
  [--out-dir <path>] [--skip-seed] [--skip-cleanup] [--ci-summary]
```

### TypeScript 型定義（spec evidence）

```ts
type BulkTagResultScreenshotName =
  | "bulk-tag-result-all-success.png"
  | "bulk-tag-result-partial-failure.png";

interface BulkTagResultAuthenticatedEvidence {
  project: "staging-visual-authenticated";
  storageStatePath: string;
  screenshotNames: readonly BulkTagResultScreenshotName[];
  evidenceDir: string;
  syntheticPrefix: "e2e_test_issue1125_";
  mutation: true; // 実 POST /admin/members/tags/bulk を実行する
}
```

### 使用例

```bash
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
CF_D1_DATABASE=ubm-hyogo-db-staging \
  bash scripts/smoke/capture-bulk-tag-result.sh staging \
  --out-dir docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/evidence \
  --ci-summary
```

### 検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 親 component 回帰（result 描画は TC-BAB-TAG-03 で担保）
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx

# runner shell test（Phase 6・実 D1 を叩かない）
bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh

# 認証付き staging baseline 生成（user-gated・初回のみ --update-snapshots を runner 内で実行）
bash scripts/smoke/capture-bulk-tag-result.sh staging
```

### エラーハンドリング

- 行 checkbox が見つからない: seed が未投入の可能性。runner が `seed()` を `capture()` 前に実行することを前提とする（`--skip-seed` は seed 済み再撮影時のみ）。
- 退会済み member が list に出ない: GET `/admin/members` は is_deleted 無フィルタで退会済みも `isDeleted` フラグ付きで表示する。既定 search で出ない場合は filter param / 検索ボックスへ `issue1125` を入力して明示表示する。
- storageState 期限切れ: `setup.staging-auth.ts` を再実行して admin storageState を mint し直す。
- baseline 差分の偽陽性: `disableAnimations` styleTag + `maxDiffPixelRatio: 0.05` + `networkidle` 待ちで吸収。
- mutation 後 result が出ない: `getByTestId("bulk-tag-result")` の `toBeVisible({ timeout: 15_000 })` で mutation 完了を同期してから screenshot を撮る。

### エッジケース

- **`notFound`（未登録 tag）の result 状態は本 spec に含めない**。tag picker は `tag_definitions.active=1` の登録済み tag しか描画しないため UI 操作で自然発生させられない。親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 で担保済み。
- assign は `INSERT OR IGNORE`（`memberTags.ts:216`）で冪等のため runner 再実行に耐える。test 順序は all-success → partial-failure（宣言順）。
- staging 共有 D1 への副作用は `e2e_test_issue1125_` synthetic prefix 限定 + `trap ... EXIT` cleanup で必ず回収する。回収後は staging D1 が初期状態に収束する（恒久副作用ゼロ）。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| Playwright project | `staging-visual-authenticated` |
| synthetic prefix | `e2e_test_issue1125_` |
| `CF_D1_DATABASE` | `ubm-hyogo-db-staging`（固定） |
| `PLAYWRIGHT_STAGING_BASE_URL` | staging web URL（例: `https://ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| `PLAYWRIGHT_EVIDENCE_DIR` | spec 単体起動時の screenshot copy 先。runner 経由では `--out-dir` の sibling `outputs/phase-11/screenshots` を自動設定 |
| snapshot names | `bulk-tag-result-all-success.png`, `bulk-tag-result-partial-failure.png` |
| snapshot 名前空間 | `{arg}-authenticated-staging-visual-{platform}`（local fixture と衝突しない） |
| evidence copies | `bulk-tag-result-all-success-authenticated-staging.png`, `bulk-tag-result-partial-failure-authenticated-staging.png` |
| OUT_DIR | `outputs/phase-11/evidence`（redact 済みログ / summary.json。screenshot は sibling の `outputs/phase-11/screenshots`） |

### テスト構成

| 層 | 対象 | 役割 |
| --- | --- | --- |
| component regression | `BulkActionBar.spec.tsx`（TC-BAB-TAG-03） | result summary など pure UI state を mutation なしで担保 |
| runner shell test | `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | guard 拒否 / 引数 / cleanup 呼び出しを実 D1 非依存で検証 |
| authenticated staging visual | `admin-members-bulk-tag-result-authenticated.spec.ts` | 実 `/admin/members` で実 mutation を経た result 2 状態 baseline を取得 |
| setup / teardown | `setup.staging-auth.ts` / `teardown.staging-auth.ts` | admin storageState の mint と削除 |

## 視覚証跡（VISUAL_ON_EXECUTION）

本タスクは VISUAL_ON_EXECUTION。証跡は認証付き staging Playwright run で **実 `POST /admin/members/tags/bulk` mutation を経て** 取得する visual baseline であり、現段階では **staging runtime pending**（未取得）である。runtime 実行で次の 2 枚を取得する。

| canonical screenshot 名（`toHaveScreenshot` arg） | 内容 | 状態 |
| --- | --- | --- |
| `bulk-tag-result-all-success.png` | active member 2 名選択 → 登録済み tag 適用 → 全成功 result（付与 2 / skipped 0 / notFound 0） | pending |
| `bulk-tag-result-partial-failure.png` | active + 退会済み member 混在選択 → tag 適用 → `bulk-tag-result-skipped` を含む result（退会済みスキップ ≥1） | pending |

capture metadata:

| 項目 | 値 |
| --- | --- |
| project | `staging-visual-authenticated` |
| storageState | admin（`setup.staging-auth.ts` が mint した `.auth/admin.storageState.json`） |
| baseline 格納先 | `admin-members-bulk-tag-result-authenticated.spec.ts-snapshots/bulk-tag-result-{all-success,partial-failure}.png-authenticated-staging-visual-{platform}.png` |
| evidence copy 先 | `outputs/phase-11/screenshots/bulk-tag-result-all-success-authenticated-staging.png` / `outputs/phase-11/screenshots/bulk-tag-result-partial-failure-authenticated-staging.png` |
| 取得経路 | `scripts/smoke/capture-bulk-tag-result.sh staging`（seed → capture → trap cleanup → 残存 0 検証） |
| mutation 対象 | `e2e_test_issue1125_` synthetic prefix のみ（cleanup で必ず回収） |
| capture command | §2 の runner / Playwright コマンド（user-gated） |

baseline 生成・evidence copy・commit はいずれも user 承認後に実施する。canonical 名は phase-11 manual-test-result.md / artifacts.json `canonical_screenshots` と一致させること（AC-4）。
