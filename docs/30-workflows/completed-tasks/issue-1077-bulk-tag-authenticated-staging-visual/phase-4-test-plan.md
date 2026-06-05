# Phase 4 — テスト計画

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイルのコード追加を伴う（CONST_004）。

---

## 4.1 検証コマンド suite と expected result

| # | コマンド | 期待結果 | gate |
| --- | --- | --- | --- |
| 1 | `mise exec -- pnpm typecheck` | exit 0（新 spec の型エラーなし） | 必須 |
| 2 | `mise exec -- pnpm lint` | exit 0（HEX 直書き 0 / lint 違反 0） | 必須 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 既存 component spec 全 PASS（回帰） | 必須 |
| 4 | `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/outputs/phase-11/evidence PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-authenticated --update-snapshots` | baseline 2 枚生成（初回）。再実行で比較 PASS。 | **user-gated runtime** |

> コマンド 1〜3 は通常実行可。コマンド 4 は実 staging への到達・snapshot 生成を伴うため user 承認後の runtime wave で実施する。

---

## 4.2 新 spec のテストケース

唯一の `test()` 内で段階的に検証する。各段は前段の前提を引き継ぐ。

| TC | 検証内容 | assert / capture |
| --- | --- | --- |
| TC-01 認証到達 | admin storageState で `/admin/members` に到達 | `goto(..., networkidle)` 後にページが描画される（前提行が存在） |
| TC-02 前提充足 | member 行 ≥ 2 / tag picker が空でない | `admin-members-row-*` count ≥ 2、未達は明示 fail |
| TC-03 選択で bulk 出現 | member 2 件を選択すると bulk region が visible | `getByRole("region",{name:"一括操作"})` が `toBeVisible` |
| TC-04 assign baseline | assign（既定）で picker capture | `toHaveScreenshot("bulk-tag-picker-assign-mode.png")`（region scoped） |
| TC-05 unassign baseline | 「解除」へ切替えて capture | 「解除」click → `aria-pressed=true` 確認 → `toHaveScreenshot("bulk-tag-picker-unassign-mode.png")` |
| TC-06 mutation 非実行 | apply ボタンを押さない | apply ボタンが disabled（`toBeDisabled`）を assert し、click は行わない（AC-6） |

---

## 4.3 回帰テスト

| 対象 | 理由 | 期待 |
| --- | --- | --- |
| `BulkActionBar.spec.tsx`（TC-BAB-TAG-01..05） | 本タスクは `BulkActionBar` の DOM を観測対象とするため、コンポーネント側の accessible name / state 機構が変わっていないことを確認 | 全 PASS（本タスクではソース未変更なので drift なし） |

result summary 2 状態（all-success / partial-failure）は本タスクのスコープ外であり、component spec TC-BAB-TAG-03 と親 local fixture baseline で引き続き担保される（Phase 1 §1.2）。

---

## 4.4 TDD / baseline 生成ステップ（visual baseline 特有）

visual baseline テストは「既存 baseline との比較」が本体だが、初回は baseline が存在しないため通常の red→green TDD と手順が異なる。次の 2 ステップに分離する。

1. **baseline mint ステップ**（初回・user-gated）:
   `--update-snapshots` 付きで実行 → `*-snapshots/` に 2 枚の PNG を新規生成。この時点では「比較」ではなく「採取」。生成された画像を目視レビューし、picker レイアウトが期待通り（assign 強調 / unassign 強調・tag pill 群・apply ボタン disabled）であることを確認する。
2. **比較ステップ**（以降の CI 実行）:
   `--update-snapshots` 無しで実行 → 採取済み baseline と差分比較。`maxDiffPixelRatio: 0.05` 以内で PASS。差分が出たら diff 画像で原因判定し、意図的レイアウト変更なら再 mint、回帰なら修正。

---

## 4.5 失敗時の切り分け

| 症状 | 想定原因 | 対応 |
| --- | --- | --- |
| 前提 fail（member < 2） | staging データ不足 | staging に member を 2 件以上用意（read-only 投入は本 spec 外）。 |
| bulk region 非表示 | 選択が反映されていない | チェックボックス accessible name（`{fullName} を選択`）の一致を確認。 |
| baseline diff 過大 | フォント/アニメ未制御 | `addStyleTag` のアニメ無効化が適用されているか確認。`animations:"disabled"` 併用。 |
| 認証失敗 | storageState 未 mint | setup project の依存解決を確認（CI では自動）。 |
