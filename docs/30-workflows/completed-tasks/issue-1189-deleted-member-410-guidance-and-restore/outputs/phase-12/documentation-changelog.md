# Phase 12: ドキュメント変更履歴（documentation-changelog）

## workflow-local

| 日付 | 変更 | 内容 |
|------|------|------|
| 2026-06-12 | 新規 | `docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore/` 配下に実装仕様書一式を新規作成 |
| 2026-06-12 | 実装反映 | C1 `/profile` 410 退会済み案内、C2 `MemberDrawer` 復元ボタン配線、restore focused spec 拡充を反映 |
| 2026-06-12 | 状態再分類 | `spec_created` 記述を撤回し、`implemented_local_evidence_captured / implementation_complete_pending_pr` へ同期 |
| 2026-06-13 | Phase 11 視覚証跡補完 | `outputs/phase-11/screenshots/` に local static visual PNG 3 点、capture metadata、coverage を追加し、Phase 11/12 の PNG pending 表記を撤回 |

## global sync

| 対象 | 結果 | 理由 |
|------|------|------|
| `docs/00-getting-started-manual/specs/*.md` | 変更なし | API/auth/D1/Google Form 契約は不変 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 更新 | implemented workflow 台帳へ追加 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1189-deleted-member-410-guidance-and-restore-artifact-inventory.md` | 追加 | artifact inventory / evidence / lessons を正本化 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` / `changelog/20260612-issue1189-deleted-member-410-guidance-and-restore.md` | 更新 | aiworkflow skill 履歴へ同期 |
| indexes（quick-reference / resource-map / topic-map / keywords） | 更新 | `indexes:rebuild` PASS。topic-map / keywords を再生成し、quick-reference / resource-map に 1189 導線を追加 |
| GitHub issue #1189 | 変更なし | issue 状態変更は user-gated |

## 検証履歴

| 日付 | コマンド | 結果 |
|------|----------|------|
| 2026-06-12 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" "apps/web/app/(member)/profile/page.spec.tsx" "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"` | PASS（3 files / 24 tests） |
| 2026-06-12 | `mise exec -- pnpm typecheck` | PASS |
| 2026-06-12 | `mise exec -- pnpm lint` | PASS |
| 2026-06-12 | `mise exec -- pnpm verify:tokens` | PASS |
| 2026-06-12 | `mise exec -- pnpm verify:phase12-compliance` | PASS |
| 2026-06-12 | `mise exec -- pnpm indexes:rebuild` | PASS |
| 2026-06-13 | `pnpm exec playwright install chromium` | PASS（local screenshot 生成用ブラウザを導入） |
| 2026-06-13 | Playwright static local screenshot generation | PASS（3 PNG present: profile 410 / restore button / after restore） |
| 2026-06-13 | `node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js --workflow docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore` | PASS（expected 3 / covered 3） |
| 2026-06-13 | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/issue-1189-deleted-member-410-guidance-and-restore --json` | PASS |
| 2026-06-13 | `pnpm exec vitest run --root=. --config=vitest.config.ts "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" "apps/web/app/(member)/profile/page.spec.tsx" "apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.restore.spec.tsx"` | PASS（3 files / 24 tests） |
| 2026-06-13 | `pnpm verify:phase12-compliance` | PASS |
| 2026-06-13 | `pnpm typecheck` | PASS |
| 2026-06-13 | `pnpm verify:tokens` | PASS |
| 2026-06-13 | `pnpm lint` | PASS |

## Step 1-A / 1-B / 1-C / Step 2 の結果一覧

| Step | 結果 |
|------|------|
| Step 1-A（specs/ 反映） | 不要（API/auth/D1/Google Form 不変） |
| Step 1-B（skill references 反映） | aiworkflow workflow ledger / artifact inventory / changelog を同期 |
| Step 1-C（indexes:rebuild） | 実行済み PASS |
| Step 2（新規 interface 追加判定） | 該当なし |
