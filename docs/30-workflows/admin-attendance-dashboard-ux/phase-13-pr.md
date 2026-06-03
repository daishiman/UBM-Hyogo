# Phase 13: commit / PR / release

## メタ情報

- task_id: `admin-attendance-dashboard-ux`
- workflow_state: `implemented_local_runtime_pending` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**
  - 前提: 本改善サイクルで AC-1..AC-8 が実装完了し、Phase 11 pixel screenshot が取得済みであること

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
本 Phase は **user 明示承認後にのみ実行**する。

## ブロック理由

本 workflow は `implemented_local_runtime_pending` であり、apps/web の CSS・TSX・focused tests は
本改善サイクルで実装済み。以下の条件がすべて揃うまで Phase 13 の実行を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-8 実装完了（apps/web の CSS・TSX・テスト） | local implemented |
| focused vitest が green | passed（local evidence present） |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | pending final verification |
| `git diff --name-only apps/api` が空（AC-7） | passed |
| Phase 11 pixel screenshot 取得済み（staging 認証済み） | pending（user-gated） |
| Phase 12 strict 7 実体確認済み | present（本 Phase 12 で完成） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated |
| `git push origin feat/admin-attendance-dashboard-ux` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging 視覚確認・pixel screenshot 取得 | user-gated |

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/features/admin/attendance/__tests__
   git diff --name-only -- apps/api  # 空であること
   ```

2. **コミット粒度**（5 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/admin-attendance-dashboard-ux/phase-*.md` / `index.md` |
   | 2 | outputs（Phase 12 strict 7 + unassigned-task-specs） | `outputs/phase-12/*.md` / `unassigned-task-specs/` |
   | 3 | impl（apps/web 実装） | `apps/web/src/styles/globals.css` / `apps/web/src/features/admin/attendance/**` |
   | 4 | docs/skill sync | `artifacts.json` 最終更新 |
   | 5 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` |

3. **PR 作成**

   ```bash
   gh pr create \
     --base dev \
     --title "fix(admin): 出席ダッシュボード UI/UX 是正（CSS 崩れ・バー楕円・ラベル不整合）" \
     --body "$(cat <<'EOF'
   ## Summary

   - `globals.css` に `.attendance-*` レイアウト CSS を追加し、KPI グリッド・フィルタバー・2 カラムチャートグリッドを復旧（AC-1）
   - 区画分布バー・Top10 バーの `<svg>` に `block-size:0.5rem` CSS 固定で楕円潰れを解消（AC-2）
   - `ZONE_LABEL` を回数表記へ更新し `ZONE_HELP` 凡例を追加、フィルタ legend を「出席回数帯」へ（AC-3）
   - KPI「期間内出席者数」hint を延べ出席数に整合、各 KPI に用途説明を追加（AC-4）
   - 冒頭見方ガイド・各セクション説明・スタイル付き空状態を追加（AC-5）
   - 色はすべて `var(--ubm-color-*)` 経由のみ（AC-6）
   - `apps/api` 無変更（AC-7）
   - 計算意味論是正は別タスク `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` に分離（AC-9）

   ## 変更ファイル（10 件）

   - `apps/web/src/styles/globals.css`（`.attendance-*` CSS ブロック追加）
   - `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx`
   - `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx`
   - `apps/web/src/features/admin/attendance/lib/format-attendance.ts`
   - `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`
   - `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx`
   - `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx`
   - `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts`
   - `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx`（新規）
   - `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx`（更新）

   ## スクリーンショット

   pixel screenshot は staging 認証済み環境で取得する（**user-gated**）。
   取得後に `outputs/phase-11/screenshots/` に追記し PR に参照を含める。

   ## 参照

   - task_id: `admin-attendance-dashboard-ux`
   - 実装仕様: `docs/30-workflows/admin-attendance-dashboard-ux/`
   - 計算是正分離: `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`
   EOF
   )"
   ```

## 完了条件

- `gh pr create` が成功し PR URL が取得できること
- PR CI（typecheck / lint / verify-design-tokens / verify-test-suffix）が green であること
- `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / commit SHA を記録すること
- `outputs/phase-13/pr-creation-result.md` に実行ログを記録すること

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| artifacts | `artifacts.json` |
