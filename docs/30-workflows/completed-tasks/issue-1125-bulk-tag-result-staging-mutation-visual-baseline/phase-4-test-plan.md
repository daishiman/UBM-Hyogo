# Phase 4 — テスト計画

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 + seed/cleanup SQL 2 + capture runner shell 1 のコード追加を伴う（CONST_004）。

result 2 状態（all-success / partial-failure）の認証付き staging mutation visual baseline を、(a) Playwright spec の 2 test、(b) runner shell test、(c) 回帰 unit の 3 系統で検証する。実 mutation = staging 共有 D1 への副作用を伴う test（Playwright spec の runtime 実行）は **user-gated** とし、それ以外（typecheck / lint / 回帰 unit / runner shell test）はローカルで自動実行する。

---

## 4.1 検証コマンド suite と expected result

| # | コマンド | 期待結果 | gate |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | exit 0（新 spec の型エラーなし） | 必須（ローカル） |
| 2 | `mise exec -- pnpm lint` | exit 0（HEX 直書き 0 / lint 違反 0） | 必須（ローカル） |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 既存 component spec 全 PASS（回帰・TC-BAB-TAG-03 含む result 描画不変） | 必須（ローカル） |
| 4 | `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | `OK: capture-bulk-tag-result tests pass`（guard 拒否 / 引数 parse / cleanup 呼び出し検証。実 D1・実 staging を叩かない） | 必須（ローカル・Phase 6 で test 追加後） |
| 5 | （runtime / user-gated）`PLAYWRIGHT_EVIDENCE_DIR=.../outputs/phase-11/screenshots PLAYWRIGHT_STAGING_BASE_URL=... mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-result-authenticated --update-snapshots` | baseline 2 枚生成（初回）。再実行で比較 PASS。 | **user-gated runtime** |
| 6 | （runtime / user-gated・正規経路）`bash scripts/smoke/capture-bulk-tag-result.sh staging` | seed → capture（baseline 2 枚生成）→ `trap cleanup EXIT` → synthetic 残存 0 検証 → exit 0 | **user-gated runtime** |

> コマンド 1〜4 は通常実行可。コマンド 5/6 は実 staging への到達・実 mutation・snapshot 生成を伴うため user 承認後の runtime wave で実施する。正規経路はコマンド 6（runner が seed/cleanup の副作用所有権を持つ）。コマンド 5 は spec 単体起動（runner 経由の seed 済み前提）。

---

## 4.2 系統 1: Playwright spec の 2 test（mutation interaction-gated）

ファイル: `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts`（新規・Phase 5 §5.2）。read-only 先例 spec（`admin-members-bulk-tag-authenticated.spec.ts`）の storageState / disableAnimations / `phase11ScreenshotsDir` raw 保存パターンを踏襲し、**apply ボタンを click して実 mutation を起こし result summary を撮る**点が差分。snapshot 名前空間は project 設定の `{arg}-authenticated-staging-visual-{platform}` で local fixture（`issue1036-bulk-member-tags.spec.ts` 同名 png）と物理分離する（AC-4）。

### TC-R-AS-01: all-success（全成功 result baseline）

| 項目 | 内容 |
| --- | --- |
| TC ID | TC-R-AS-01 |
| 前提 | seed 済み（`e2e_test_issue1125_as_mem_1` / `as_mem_2`（共に `is_deleted=0`）+ `e2e_test_issue1125_tag_1`（active=1））。admin storageState mint 済み。 |
| 操作 | 1) `goto("/admin/members", { waitUntil: "networkidle" })` → `会員管理` heading 可視待ち。2) `as_mem_1` / `as_mem_2` の行 checkbox（`aria-label="{fullName} を選択"` または `tbody input[type=checkbox]` を memberId で絞り込み）を check。3) bulk region（`getByRole("region",{name:"一括操作"})`）可視待ち。4) tag picker（`getByRole("region",{name:"タグ一括付与・解除"})`）で `付与モード` group の `付与` が `aria-pressed="true"`（既定）を確認。5) `issue1125 結果タグ1`（`tag_1` の TagPill）を click。6) apply ボタン（`2人 × 1タグ を付与`）を click → **実 mutation**。 |
| 期待値（assert） | `getByTestId("bulk-tag-result")` が `toBeVisible`（mutation 完了同期）。`bulk-tag-result-counts` text に `付与 2` を含む（`/付与 2 \//`）。`getByTestId("bulk-tag-result-skipped")` が `toHaveCount(0)`、`getByTestId("bulk-tag-result-not-found")` が `toHaveCount(0)`（skipped=0 / notFound=0）。 |
| 期待 result | counts: assigned=2 / unassigned=0 / noop=0 / skipped=0 / notFound=0 |
| capture | `disableAnimations` style 注入後 `expect(bulkRegion).toHaveScreenshot("bulk-tag-result-all-success.png", { animations:"disabled", maxDiffPixelRatio:0.05 })` + raw を `phase11ScreenshotsDir/bulk-tag-result-all-success-authenticated-staging.png` に保存。 |
| AC 対応 | AC-2 / AC-4 |

### TC-R-PF-01: partial-failure（退会済み skipped を含む result baseline）

| 項目 | 内容 |
| --- | --- |
| TC ID | TC-R-PF-01 |
| 前提 | seed 済み（`e2e_test_issue1125_pf_mem_active`（`is_deleted=0`）+ `e2e_test_issue1125_pf_mem_deleted`（**`is_deleted=1`**）+ `e2e_test_issue1125_tag_1`（active=1））。 |
| 操作 | 1) `goto` で再ロードし `as` member の選択を持ち越さない独立状態にする。2) `pf_mem_active` + `pf_mem_deleted` の行 checkbox を check（退会済み member も list に表示される＝`members.ts` は is_deleted 無フィルタ）。3) tag picker で `tag_1` を click（assign 既定）。4) apply ボタン（`2人 × 1タグ を付与`）click → **実 mutation**。 |
| 期待値（assert） | `getByTestId("bulk-tag-result")` が `toBeVisible`。`getByTestId("bulk-tag-result-skipped")` が `toBeVisible`（退会済みスキップ ≥1・`<li>` に `退会済みのためスキップ` を含む）。`bulk-tag-result-counts` text に `付与 1` と `退会済みスキップ 1` を含む。 |
| 期待 result | counts: assigned=1（active）/ noop=0 / skipped=1（deleted）/ notFound=0 |
| capture | `expect(bulkRegion).toHaveScreenshot("bulk-tag-result-partial-failure.png", { animations:"disabled", maxDiffPixelRatio:0.05 })` + raw を `phase11ScreenshotsDir/bulk-tag-result-partial-failure-authenticated-staging.png` に保存。 |
| AC 対応 | AC-3 / AC-4 |

> test 順序は all-success → partial-failure（spec ファイル内の `test()` 宣言順）。mutation は冪等（assign = `INSERT OR IGNORE`・`memberTags.ts:216`）なので runner の再実行耐性あり。両 test とも apply 後に `getByTestId("bulk-tag-result")` の `toBeVisible` で mutation 完了を同期してから screenshot を撮る（Phase 3 §3.5 申し送り）。
>
> `notFound`（未登録 tag）の視覚網羅は本 spec のスコープ外（UI の tag picker が active tag しか描画しない設計上 UI 操作で再現不可）。親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 が継続担保（Phase 1 §1.2・先送りではない scope-out）。

---

## 4.3 系統 2: runner shell test（`scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`）

issue-1081 `runtime-tag-bulk.test.sh` 同型。**実 D1 / 実 staging を一切叩かず**、guard 分岐・引数 parse・cleanup 呼び出しを shell レベルで検証する（Phase 6 で追加する旨を明記）。

| TC ID | 検証内容 | 操作 | 期待値 | AC 対応 |
| --- | --- | --- | --- | --- |
| TC-S-01 | env 必須 | `bash runner`（引数なし） | exit 2 | AC-7 |
| TC-S-02 | production target 拒否 | `runner production` | exit 2 | AC-7 |
| TC-S-03 | unknown env 拒否 | `runner dev` | exit 2 | AC-7 |
| TC-S-04 | production URL 拒否 | `PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-...-production... runner staging` | exit 2 | AC-7 |
| TC-S-05 | 非 staging CF_D1_DATABASE 拒否 | `CF_D1_DATABASE=ubm-hyogo-db-production runner staging` | exit 2 | AC-7 |
| TC-S-06 | staging allowlist 不一致 URL 拒否 | `PLAYWRIGHT_STAGING_BASE_URL=https://example.com runner staging` | exit 2 | AC-7 |
| TC-S-07 | 引数 parse（`--out-dir` / `--skip-seed` / `--skip-cleanup` / `--ci-summary`） | fake `cf.sh` + fake playwright を PATH に置き `runner staging --out-dir <tmp> --ci-summary --skip-seed`（capture を stub 化） | exit 0 / `summary.json` に `"status":"PASS"` | AC-6 |
| TC-S-08 | cleanup 呼び出し検証 | fake `cf.sh`（`--file` で success、count query で 0 を返す）+ fake playwright（exit 0）で `runner staging`（seed/capture/cleanup を stub 実行） | `source` した関数 `count_by_table` が 0 を返し cleanup が `summary_pass cleanup` まで到達（残存 0 検証通過） | AC-5 |
| TC-S-09 | redact | `printf 'authorization: Bearer xxx' \| bash redact.sh` の出力に raw token が含まれず `[REDACTED]` を含む | secret 非露出 | AC-6 |

> capture（Playwright 起動）と D1 mutation は fake バイナリ（`PATH` injection の fake `cf.sh` / fake `playwright`）に置換して shell 経路のみを検証する。issue-1081 test と同様に runner を `source` して `assert_staging_guard` / `count_by_table` / `cleanup` を単体呼び出しする。

---

## 4.4 系統 3: 回帰 unit（`BulkActionBar.spec.tsx`）

| 対象 | 理由 | 期待 |
| --- | --- | --- |
| `BulkActionBar.spec.tsx`（TC-BAB-TAG-01..05・特に **TC-BAB-TAG-03**） | 本タスクは `BulkActionBar` の result DOM（`bulk-tag-result` / `-counts` / `-skipped` / `-not-found`）を screenshot 観測対象とするため、コンポーネント側の result 描画機構が変わっていないことを確認 | 全 PASS（本タスクではソース未変更なので drift なし）。result summary の counts / skipped / notFound 描画が不変。 |

result summary の `notFound` 視覚要素は TC-BAB-TAG-03（unit）と親 local fixture baseline で引き続き担保される（Phase 1 §1.2）。

---

## 4.5 visual baseline 生成ステップ（mint → 比較）

visual baseline は「既存 baseline との比較」が本体だが、初回は baseline が無いため通常の red→green TDD と手順が異なる。2 ステップに分離する。

1. **baseline mint ステップ**（初回・user-gated・runner 経由）:
   `capture-bulk-tag-result.sh staging` を実行 → runner が seed → Playwright を `--update-snapshots` で起動し `*-snapshots/` に 2 枚の PNG を新規生成 → `trap cleanup EXIT` で fixture 回収。生成画像を目視レビューし、all-success（付与 2・skipped/notFound 無し）/ partial-failure（付与 1・退会済みスキップ 1 行）の result summary が期待通り描画されていることを確認する。
2. **比較ステップ**（以降の CI 実行）:
   `--update-snapshots` 無しで実行 → 採取済み baseline と `maxDiffPixelRatio: 0.05` 以内で比較。差分が出たら diff 画像で原因判定し、意図的レイアウト変更なら再 mint、回帰なら修正。

---

## 4.6 ローカル検証コマンド（自動実行・非 user-gated）

```bash
# 1) 型
mise exec -- pnpm typecheck

# 2) lint（HEX 直書き gate 含む）
mise exec -- pnpm lint

# 3) 回帰（component spec / result 描画不変）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx

# 4) runner shell test（実 D1 / 実 staging を叩かない・Phase 6 で追加後）
bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh
```

---

## 4.7 runtime 検証コマンド（user-gated）

```bash
# 正規経路（runner が seed → capture → trap cleanup → 残存 0 検証 を所有）
bash scripts/smoke/capture-bulk-tag-result.sh staging

# spec 単体（runner 経由で seed 済みの前提・baseline mint 用）
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/screenshots \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual-authenticated \
  admin-members-bulk-tag-result-authenticated --update-snapshots
```

---

## 4.8 失敗時の切り分け

| 症状 | 想定原因 | 対応 |
| --- | --- | --- |
| `bulk-tag-result` 非表示 | apply 後に mutation が完了していない / route エラー | `toBeVisible` の timeout を確認。runner ログ（redact 済み）で seed 結果・対象 ID を確認。 |
| partial-failure で skipped が出ない | 退会済み member が list に出ていない / `is_deleted=1` が seed されていない | seed SQL の `pf_mem_deleted` が `is_deleted=1` であることを確認。`members.ts` は is_deleted 無フィルタなので既定 list に表示されるはず。 |
| baseline diff 過大 | フォント/アニメ未制御 | `addStyleTag(disableAnimations)` 適用と `animations:"disabled"` 併用を確認。 |
| 認証失敗 | storageState 未 mint | `setup.staging-auth.ts` の依存解決を確認（CI では自動）。 |
| cleanup 残存 ≠ 0 | mutation 行 / seed 行が prefix 外に漏れた | runner の `count_by_table` 出力で残存 table を特定。prefix `e2e_test_issue1125_` の一致を確認。 |
| seed SQL が staging で失敗 | `BEGIN TRANSACTION` 混入 | seed/cleanup SQL に明示トランザクションが無いことを確認（D1 remote 制約・Phase 5 §5.4）。 |
