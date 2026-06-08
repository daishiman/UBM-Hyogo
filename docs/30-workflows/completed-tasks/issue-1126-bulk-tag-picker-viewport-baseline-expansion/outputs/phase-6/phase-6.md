# Phase 6: テスト追加方針

`[実装区分: 実装仕様書]` / `implementation_mode: edit` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

Issue #1126「bulk tag picker visual baseline の viewport 拡張（mobile/tablet/wide）」の Phase 5 実装を前提に、
追加する visual assertion を列挙し、既存テストの回帰保証と un-skip / 先送り禁止の方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1126-bulk-tag-picker-viewport-baseline-expansion` |
| issue | #1126（CLOSED 維持 / `Refs #1126`） |
| phase | 6（テスト追加方針） |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` |
| 回帰保証（無改修） | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| 前提 | Phase 5 で `VIEWPORTS` import + responsive 3 test + read-only assertion が実装済み |

## 目的

本タスクの「追加テスト」は新規テストファイルではなく、既存 visual spec 内に増える `toHaveScreenshot`
アサーション 6 本（+ read-only assertion）である。これを列挙し、既存 component test が無改修で
回帰しないこと、および全 viewport の実装を今サイクルで追加し `test.skip` で先送りしないことを固定する。

## 1. 追加テストの有無

| 区分 | 内容 |
| --- | --- |
| 新規テストファイル | **なし**（CONST_005: 不要な新規ファイルを増やさない） |
| 新規テストケース（`test(...)`） | responsive viewport ごとに 3 test を追加（desktop 既存 1 test + responsive 3 test） |
| 追加アサーション | visual `toHaveScreenshot` 6 本（新規 baseline）+ read-only `toHaveCount(0)` 1 本（既存を移動） |
| component test | 既存 `BulkActionBar.spec.tsx` を**無改修で維持**（回帰保証） |

> visual baseline の比較アサーション自体が本タスクの追加テストである。
> responsive は viewport ごとに `test(...)` を生成し、失敗時の切り分けと retry 境界を viewport 単位にする。

## 2. visual assertion の列挙

Phase 5 実装後、spec が持つ visual / read-only アサーションの全量。

| # | 種別 | アサーション | viewport | baseline 名 | 区分 |
| --- | --- | --- | --- | --- | --- |
| 1 | visual | `expect(bulkRegion).toHaveScreenshot(SNAP.assign)` | desktop 1280×800 | `bulk-tag-picker-assign-mode.png` | 既存・温存（不変） |
| 2 | visual | `expect(bulkRegion).toHaveScreenshot(SNAP.unassign)` | desktop 1280×800 | `bulk-tag-picker-unassign-mode.png` | 既存・温存（不変） |
| 3 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-assign-mode-mobile.png')` | mobile 390×844 | `bulk-tag-picker-assign-mode-mobile.png` | 新規 |
| 4 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-unassign-mode-mobile.png')` | mobile 390×844 | `bulk-tag-picker-unassign-mode-mobile.png` | 新規 |
| 5 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-assign-mode-tablet.png')` | tablet 768×1024 | `bulk-tag-picker-assign-mode-tablet.png` | 新規 |
| 6 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-unassign-mode-tablet.png')` | tablet 768×1024 | `bulk-tag-picker-unassign-mode-tablet.png` | 新規 |
| 7 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-assign-mode-wide.png')` | wide 1920×1080 | `bulk-tag-picker-assign-mode-wide.png` | 新規 |
| 8 | visual | `expect(bulkRegion).toHaveScreenshot('bulk-tag-picker-unassign-mode-wide.png')` | wide 1920×1080 | `bulk-tag-picker-unassign-mode-wide.png` | 新規 |
| 9 | read-only | `expect(page.getByTestId('bulk-tag-result')).toHaveCount(0)` | （全 viewport 通過後） | — | 既存・移動 |

> 各 visual assertion は `{ animations: "disabled", maxDiffPixelRatio: 0.05 }` を共通で付与する（既存 desktop と同条件）。
> 各 viewport の capture 前には mode ボタンの `aria-pressed="true"` を assert してレイアウト確定を待つ（中間フレーム回避）。

## 3. 既存テスト回帰保証

| 対象 | 保証内容 | 検証コマンド |
| --- | --- | --- |
| `BulkActionBar.spec.tsx` | 本タスクで component を変更しないため、既存 component test は無改修で全 PASS。bulk action bar / picker の mode 切替・選択挙動が壊れていないことの回帰保証 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` |
| desktop 既存 baseline 2 枚 | viewport ループを desktop capture の**後**に置くため、desktop capture は project default（1280×800）のまま。既存 baseline 名・内容ともに不変で比較が PASS | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated`（user-gated） |
| `typecheck` / `lint` | fixture `wide` 追加 + spec ループ追加が型・lint を壊さない | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` |

> 既存 desktop baseline が変わってはならない。新規 viewport 追加が既存 2 枚の比較結果に影響しないことを
> 「viewport 切替は desktop capture 後に限る」という実装順序で構造的に保証する（Phase 5 §3.2）。

## 4. un-skip / 先送り禁止

| 原則 | 内容 |
| --- | --- |
| CONST_007（先送り禁止） | `test.skip` / `test.fixme` を「次サイクルで実装する」目的で使わない。mobile / tablet / wide の 3 viewport × 2状態 = 6 baseline を**今サイクルで全取得**する |
| 条件付き skip の扱い | viewport ごとの skip 分岐は設けない。3 viewport を同一 spec 内の responsive 3 testで連続取得し、部分実装を残さない |
| baseline 未生成時の挙動 | 初回 baseline が無い状態での比較 fail は正常な未生成状態であり、skip ではなく `--update-snapshots`（user-gated）で確定して解消する |
| 既存 baseline の skip 化禁止 | 既存 desktop 2 枚を skip / 削除しない（温存が要件） |

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| 編集対象 spec | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | visual assertion の追加位置 |
| Phase 4 テスト計画 | `../phase-4/phase-4.md` | テスト対象一覧 / read-only 前提 |
| Phase 5 実装手順 | `../phase-5/phase-5.md` | viewport ループ実装・desktop 不変保証 |
| 回帰保証テスト | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 無改修 PASS |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-6/phase-6.md` | 追加テストの有無（新規ファイルなし・viewport ごとの 3 test 追加）、visual assertion 列挙（既存 2 温存 + 新規 6 + read-only 1）、既存テスト回帰保証（`BulkActionBar.spec.tsx` 無改修 / desktop baseline 不変 / typecheck・lint）、un-skip / 先送り禁止（CONST_007） |

## 統合テスト連携

- 新規 6 visual assertion は Phase 11 で user-gated capture（VISUAL_ON_EXECUTION）。
- component 回帰保証（`BulkActionBar.spec.tsx`）と typecheck / lint は Phase 5 実装後のローカル検証で green。
- desktop 既存 2 baseline の不変は Phase 7 の viewport×state coverage 表で「既存」セルとして固定する。
- result mutation 後の状態 baseline は issue-1125 が担当（本スコープ外・Phase 7 §3 で明記）。

## 完了条件（Phase 6）

- 新規テストファイルは作らず、同一 spec 内の responsive 3 test にアサーションを追加する方針を確定した。
- 既存 2（温存）+ 新規 6 + read-only 1 の visual / read-only assertion を列挙した。
- `BulkActionBar.spec.tsx` 無改修 PASS / desktop baseline 不変 / typecheck・lint green の回帰保証を確定した。
- CONST_007 に基づき全 viewport の実装を今サイクルで追加し `test.skip` で先送りしない方針を確定した。
