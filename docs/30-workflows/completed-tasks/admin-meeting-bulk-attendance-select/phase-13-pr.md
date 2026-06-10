# Phase 13: commit / PR / release

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- workflow_state: `implemented_local_evidence_captured` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**
  - 前提: 後続の実装サイクルで AC-1..AC-12 が実装完了し、focused vitest が green、Phase 11 screenshot が取得済みであること

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
本 Phase は **user 明示承認後にのみ実行**する。本タスクは `implemented_local_evidence_captured`（apps/web 実装完了）であり、
commit / push / PR / staging 視覚 baseline 取得はいずれも user-gated として未実行とする。

## ブロック理由

本 workflow は `implemented_local_evidence_captured` であり、apps/web の実装コード・focused tests・typecheck/lint/token gate は完了済みである。
commit / push / PR はユーザー明示承認まで禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-12 実装完了（apps/web の Checkbox / hook / チェックリスト / モーダル / Shell 配線 / CSS） | 完了 |
| focused vitest が green | PASS |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | PASS |
| `git diff --name-only -- apps/api packages` が空（AC-12） | PASS |
| Phase 11 local fixture pixel screenshot 取得 | done |
| Phase 11 staging pixel screenshot 取得 | user-gated |
| Phase 12 strict 7 実体確認済み | PASS |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| apps/web 実装コードの作成（AC-1..AC-12） | 完了 |
| `git add` / `git commit` | user-gated |
| `git push origin feat/admin-meeting-bulk-attendance-select` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging 視覚確認・pixel screenshot 取得 | user-gated |

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）

   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/features/admin/components/_meetings/__tests__ \
     apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
     apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
   git diff --name-only -- apps/api packages   # 空であること（AC-12）
   ```

2. **コミット粒度**（5 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/phase-*.md` / `index.md` |
   | 2 | outputs（Phase 12 strict 7 + Phase 11 計画） | `outputs/phase-12/*.md` / `outputs/phase-11/*.md` / `outputs/phase-11/*.json` |
   | 3 | impl（apps/web 実装） | `apps/web/src/components/ui/Checkbox.tsx` / `apps/web/src/features/admin/components/_meetings/**` / `apps/web/src/lib/admin/api.ts` / `apps/web/src/styles/globals.css` |
   | 4 | docs/skill sync | `artifacts.json` 最終更新 |
   | 5 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` |

3. **PR 作成**

   ```bash
   gh pr create \
     --base dev \
     --title "feat(admin): 開催日ドロワーの出席追加を複数会員同時選択→一括追加に是正" \
     --body "$(cat <<'EOF'
   ## Summary

   - 開催日 / 出席管理ドロワーの出席追加を「1 名ずつ select → 追加」から「複数会員同時選択 → 一括追加」に是正（AC-1..AC-9）
   - 既存の一括取込 endpoint `POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false` を再利用し、API / D1 / Google Form は無変更（AC-12）
   - ドロワー内チェックリスト（主経路）と大量選択モーダル（補助経路）の 2 経路を `useBulkAttendanceSelection` に集約（AC-8/AC-9）
   - 選択対象は未出席候補のみ。送信は 1 リクエスト。all-or-nothing で `committed:false` 時は attended 不変・選択保持・失敗内訳 toast（AC-5/AC-6/AC-7）
   - 新規 `Checkbox` primitive は `apps/web/src/components/ui/Checkbox.tsx` に配置し、色は `var(--ubm-color-*)` 経由のみ（AC-11）
   - 既存の単発「出席を追加」「出席者の削除」は回帰なしで維持（AC-10）

   ## 変更ファイル

   - `apps/web/src/lib/admin/api.ts`（`importAttendance` 追加）
   - `apps/web/src/components/ui/Checkbox.tsx`（新規 primitive）
   - `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts`（新規）
   - `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts`（新規・純関数）
   - `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx`（新規）
   - `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx`（新規）
   - `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`（編集・onBulkAdd 配線）
   - `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`（編集・summary→attended 反映）
   - `apps/web/src/features/admin/components/_meetings/index.ts`（編集）
   - `apps/web/src/styles/globals.css`（`.bulk-attendance-*` / `.ui-checkbox` CSS）
   - focused tests 6 ファイル（`.spec.ts(x)`）

   ## スクリーンショット

   local fixture pixel screenshot は取得済み。staging 認証済み環境での screenshot は **user-gated**。
   取得後に `outputs/phase-11/screenshots/` へ追記し PR に参照を含める。

   ## 参照

   - task_id: `admin-meeting-bulk-attendance-select`
   - 実装仕様: `docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/`
   - 再利用 API（無変更）: `POST /admin/meetings/:sessionId/attendance/import?dryRun=false`
   EOF
   )"
   ```

## 完了条件

- `gh pr create` が成功し PR URL が取得できること
- PR CI（typecheck / lint / verify-design-tokens / verify-test-suffix）が green であること
- `outputs/phase-13/pr-creation-result.md` に PR URL / CI 結果 / commit SHA / 実行ログを記録すること

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| SSOT | `outputs/phase-1/shared-context.md` |
