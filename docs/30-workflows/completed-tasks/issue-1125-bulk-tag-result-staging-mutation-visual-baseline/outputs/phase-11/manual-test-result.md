# Phase 11 — Manual / Runtime Evidence

Status: `local_evidence_present_staging_runtime_pending`（`VISUAL_ON_EXECUTION`）

本タスクの最終証跡主ソースは **認証付き staging Playwright run で実 `POST /admin/members/tags/bulk` mutation を経た BulkActionBar result summary の visual baseline**（`staging-visual-authenticated` project）である。本 wave では実コード（Playwright spec / seed SQL / cleanup SQL / capture runner / runner shell test / smoke:test wiring）を追加し、local runner evidence を取得した。staging 実行（seed + 実 mutation + baseline 生成 + cleanup）は外部副作用を伴うため user-gated pending として分離する。

## 1. 証跡の主ソース

| 種別 | 内容 |
| --- | --- |
| 証跡方式 | Playwright `toHaveScreenshot` による visual baseline 取得（認証付き staging 実機・**実 mutation interaction-gated**） |
| 対象画面 | 認証付き staging `/admin/members` の BulkActionBar result summary（`data-testid="bulk-tag-result"`・`aria-live="polite"`） |
| 取得モード | **mutation あり**（member 選択 → tag picker で tag 選択 → apply ボタン click で実 `POST /admin/members/tags/bulk` を実行 → result summary を撮影）。issue-1077 の read-only picker baseline とは異なり、実 D1 への破壊的副作用を伴う |
| storageState | admin role（`setup.staging-auth.ts` が mint した `.auth/admin.storageState.json`） |
| project | `staging-visual-authenticated`（既存。`testDir` 自動登録・config 編集不要） |
| 副作用の所有者 | `scripts/smoke/capture-bulk-tag-result.sh`（seed / cleanup / 残存 0 検証 / redact ログ）。spec は UI 操作 + screenshot にのみ責務を持つ |
| synthetic 境界 | mutation / seed / cleanup の対象は `e2e_test_issue1125_` prefix のみ。共有 staging D1 の本番データに触れない |

## 2. local evidence（実行済み）

| 検証 | コマンド | 結果 |
| --- | --- | --- |
| runner 構文 | `bash -n scripts/smoke/capture-bulk-tag-result.sh && bash -n scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | PASS |
| runner shell test | `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | PASS（guard 拒否 / `extract_count` / fake `pnpm` + fake `cf.sh` stub / `summary.json` PASS / capture 失敗時の `summary.json` FAIL / log 名契約） |
| web typecheck | `pnpm --filter @ubm-hyogo/web exec tsc --noEmit --pretty false` | PASS |
| repo lint | `pnpm lint` | PASS |
| focused component regression | `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | PASS（1 file / 22 tests） |
| Playwright registration | `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts --list` | PASS（new spec 2 tests + setup/teardown detected; runtime skipped by `--list`） |
| smoke test wiring | `pnpm smoke:test` | PASS（new `capture-bulk-tag-result.test.sh` included） |
| Phase 12 compliance | `pnpm verify:phase12-compliance` | PASS（root ok: true） |
| smoke subset 接続 | `bash scripts/smoke/__tests__/redact.test.sh && bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh && bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | PASS through `runtime-tag-bulk`; new runner test PASS after root detection / empty update args fix |
| git self-check | `git status --short && git diff --stat` | 実コード追加 + workflow docs 更新を確認 |

### 2.1 実装済みファイル

| 区分 | パス |
| --- | --- |
| Playwright spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` |
| seed SQL | `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` |
| cleanup SQL | `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` |
| capture runner | `scripts/smoke/capture-bulk-tag-result.sh` |
| runner shell test | `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` |
| smoke wiring | `package.json` `smoke:test` |

## 3. staging runtime pending の理由（user-gated・baseline 未生成の理由）

本タスクは `VISUAL_ON_EXECUTION` であり、screenshot baseline（`bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png`）は **user 承認後の runtime 実行で生成**される。現時点で baseline が未生成である理由は以下が外部副作用または公開操作を伴うためである:

- 認証付き staging のデプロイ（最新 dev の bulk tag 機能本体が staging に反映済みであること）
- admin secrets（`setup.staging-auth.ts` が storageState を mint するための認証情報）
- staging D1 への synthetic fixture seed（実 mutation を成立させる前提データ）
- **実 mutation の実行**（apply ボタン click で `member_tags` に INSERT + `audit_log` に append。共有 staging D1 への破壊的副作用を伴うため user 承認が必須）
- baseline 初回生成（`--update-snapshots` を伴う初回 run は人手承認 + 目視レビューが必要）
- 生成 baseline の commit / push、および cleanup（synthetic 残存 0 検証）

`local_evidence_present_staging_runtime_pending` 段階では staging runtime capture が未実行であり、本ファイルは baseline 未取得状態を明示する。実行が完了したら本ファイルを PASS の evidence ログに更新する。

## 4. 3 層評価フレーム（runtime 実行時に確認するチェックリスト）

runtime 実行時に以下 3 層で確認する。各項目は現時点 `pending`。

### 4.1 Semantic（DOM / a11y 構造）

| # | 確認項目 | 期待 | 状態 |
| --- | --- | --- | --- |
| SEM-01 | apply 後に `data-testid="bulk-tag-result"` が描画され `aria-live="polite"` を持つ（mutation 完了がスクリーンリーダーに通知される） | result region が aria-live でアナウンスされる | pending |
| SEM-02 | all-success: `bulk-tag-result-counts` に `付与 2` を含み、`bulk-tag-result-skipped` / `bulk-tag-result-not-found` が `count 0`（描画されない） | counts: assigned=2 / skipped=0 / notFound=0 | pending |
| SEM-03 | partial-failure: `bulk-tag-result-skipped` が visible で `<li>` に `退会済みのためスキップ` を含む。`bulk-tag-result-counts` に `付与 1` と `退会済みスキップ 1` を含む | counts: assigned=1 / skipped=1 / notFound=0 | pending |
| SEM-04 | result 描画が member/tag を表示名で示す（issue-1080 の改善が staging でも有効） | 表示名でスキップ member が判別できる | pending |

### 4.2 Visual（screenshot baseline）

| # | 確認項目 | 期待 | 状態 |
| --- | --- | --- | --- |
| VIS-01 | `bulk-tag-result-all-success.png` が意図通り（付与カウント 2・スキップ/未登録の行が無い成功 result summary） | all-success の result summary が安定描画 | pending |
| VIS-02 | `bulk-tag-result-partial-failure.png` が意図通り（付与カウント 1・退会済みスキップ 1 行が表示された partial-failure result summary） | partial-failure の退会済みスキップ表示が描画 | pending |
| VIS-03 | 2 枚とも `bulkRegion` scope で撮影され picker 領域 + result summary のみが入る（画面全体ではなく local fixture と意味的に揃う） | region scope の baseline | pending |
| VIS-04 | `addStyleTag(disableAnimations)` + `animations:"disabled"` でフォント/アニメ揺れが抑止され `maxDiffPixelRatio:0.05` 内で安定 | 再実行で diff < 0.05 | pending |

### 4.3 AI UX（理解しやすさ）

| # | 確認項目 | 期待 | 状態 |
| --- | --- | --- | --- |
| UX-01 | 退会済みスキップの文言（`退会済みのためスキップ` / `退会済みスキップ {n}`）が、なぜ付与されなかったかを管理者が直感的に理解できるか | スキップ理由が文言から自明 | pending |
| UX-02 | all-success と partial-failure の result summary が視覚的に区別でき、部分失敗を見落とさないか | 成功と部分失敗が一目で判別できる | pending |
| UX-03 | counts の各ラベル（付与 / 解除 / 変更なし / 退会済みスキップ / 未登録タグ）が曖昧でないか | ラベルの意味が明確 | pending |

## 5. 取得予定の canonical screenshot

| canonical 名（`toHaveScreenshot` arg） | 状態 | 内容 |
| --- | --- | --- |
| `bulk-tag-result-all-success.png` | pending | active member 2 名選択 → tag 適用 → 全成功 result summary（付与 2 / skipped 0 / notFound 0） |
| `bulk-tag-result-partial-failure.png` | pending | active + 退会済み member 混在選択 → tag 適用 → 退会済みスキップを含む result summary（付与 1 / 退会済みスキップ 1） |

baseline 物理ファイルは Playwright 慣習に従い project 名前空間付きで `*-snapshots/` 配下に生成し、evidence copy（raw screenshot）を `outputs/phase-11/screenshots/<canonical basename>-authenticated-staging.png` として workflow root に残す。

| baseline 物理パス（生成先） | 状態 |
| --- | --- |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts-snapshots/bulk-tag-result-all-success.png-authenticated-staging-visual-{platform}.png` | pending |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts-snapshots/bulk-tag-result-partial-failure.png-authenticated-staging-visual-{platform}.png` | pending |

| evidence copy 先（workflow root 相対） | 状態 |
| --- | --- |
| `outputs/phase-11/screenshots/bulk-tag-result-all-success-authenticated-staging.png` | pending |
| `outputs/phase-11/screenshots/bulk-tag-result-partial-failure-authenticated-staging.png` | pending |

> local fixture spec（`issue1036-bulk-member-tags.spec.ts`）の同名 png とは project / testDir / 名前空間（`-authenticated-staging-visual-{platform}`）が分離されるため衝突しない（AC-4）。

## 6. capture metadata

| 項目 | 値 |
| --- | --- |
| taskId | `TASK-ISSUE-1125-BULK-TAG-RESULT-STAGING-MUTATION-VISUAL-001` |
| workflow_id | `issue-1125-bulk-tag-result-staging-mutation-visual-baseline` |
| project（Playwright） | `staging-visual-authenticated` |
| snapshot 名前空間 | `{arg}-authenticated-staging-visual-{platform}` |
| canonical screenshot 名 | `bulk-tag-result-all-success.png` / `bulk-tag-result-partial-failure.png` |
| synthetic prefix | `e2e_test_issue1125_` |
| 対象 staging DB | `ubm-hyogo-db-staging`（`CF_D1_DATABASE` 固定） |
| 触る table | seed: `member_responses` / `member_identities` / `member_status` / `tag_definitions`。mutation: `member_tags`（INSERT）/ `audit_log`（append）。cleanup: 上記 6 table を prefix DELETE |
| visualEvidence | `VISUAL_ON_EXECUTION`（baseline は runtime 生成・現時点 `staging_runtime_pending_user_gate`） |

## 7. runtime 実行手順（user-gated）

正規経路は runner（`capture-bulk-tag-result.sh`）。runner が seed / cleanup の副作用所有権を持つ。

```bash
# 正規経路: runner が seed → playwright capture(実 mutation + baseline 生成) → trap cleanup → 残存 0 検証 を所有
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  bash scripts/smoke/capture-bulk-tag-result.sh staging
```

実行ステップ:

1. **guard**: `assert_staging_guard` が `CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / production target 拒否 / staging allowlist 一致 を検査（AC-7）。
2. **seed**: `bulk-tag-result-staging-seed.sql` を `cf.sh d1 execute --remote` で投入（退会済み member 含む 4 member + 2 tag・冪等・redact ログ）（AC-1）。
3. **capture（baseline 2 枚生成）**: `playwright test --project=staging-visual-authenticated admin-members-bulk-tag-result-authenticated --update-snapshots` を起動。spec が member 選択 → tag 適用（実 mutation）→ result summary を `toHaveScreenshot` で撮影し、baseline 2 枚と raw evidence 2 枚を生成（AC-2 / AC-3）。
4. **目視レビュー**: 生成 2 枚が §3.2 VIS-01/02 の期待（all-success: 付与 2・スキップ無し / partial-failure: 付与 1・退会済みスキップ 1 行）通りか確認（§4.5 baseline mint ステップ）。
5. **cleanup（残存 0 確認）**: `trap 'cleanup || true; ...' EXIT` により成功/失敗/中断いずれの経路でも `bulk-tag-result-staging-cleanup.sql` を実行し、`member_tags` / `audit_log` / `member_status` / `member_identities` / `member_responses` / `tag_definitions` の synthetic 残存件数 0 を `count_by_table` で検証。残存 ≠ 0 なら非 0 exit で放置しない（AC-5）。
6. **evidence 記録**: redact 済みログ（認証経路 / 対象 URL / capture command / 保存先 / mutation 対象 ID / seed・cleanup 結果）を `outputs/phase-11/evidence/capture-bulk-tag-result.log` に残す（AC-6）。

spec 単体起動（runner 経由で seed 済みの前提・baseline mint 用）:

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/screenshots \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual-authenticated \
  admin-members-bulk-tag-result-authenticated --update-snapshots
```

初回 `--update-snapshots` で baseline 2 枚を生成し、2 回目以降は `--update-snapshots` を外して `maxDiffPixelRatio: 0.05` 以内で回帰検証する。spec 単体起動時の `PLAYWRIGHT_EVIDENCE_DIR` は screenshot copy 専用の `outputs/phase-11/screenshots` に固定し、runner の `--out-dir` は redact 済みログ / `summary.json` 専用の `outputs/phase-11/evidence` に固定する。

## 8. 出力ディレクトリ

| 用途 | パス（workflow root 相対） |
| --- | --- |
| screenshot evidence copy（canonical 名） | `outputs/phase-11/screenshots/` |
| redact 済み実行ログ / summary.json | `outputs/phase-11/evidence/` |

## 9. 併走する回帰検証（local・非 user-gated）

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | PASS |
| lint | `mise exec -- pnpm lint` | PASS（HEX 直書き 0） |
| 親 component 回帰 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | PASS（result 描画不変・TC-BAB-TAG-03 含む） |
| runner shell test | `bash scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`（Phase 6 で追加後） | PASS（guard 拒否 / 引数 / cleanup・実 D1 非接続） |
| Playwright 登録確認 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-result-authenticated --list` | 新 spec 2 test + setup を検出 |

runtime screenshot 取得（実 mutation を伴う baseline 生成）は user-gated のため未実行。local runner 検証は本 wave で実施済み。
