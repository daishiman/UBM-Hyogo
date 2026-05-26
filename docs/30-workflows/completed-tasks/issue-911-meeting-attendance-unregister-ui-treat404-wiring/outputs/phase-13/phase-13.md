**[実装区分: 実装仕様書 / 状態: pending_user_approval]**

# Phase 13: closeout / PR 作成 (user-gated)

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `pending_user_approval` |
| Gate | Gate-C (external_ops) |
| 入力 | Phase 1-12 完了 + Phase 11 runtime evidence (vitest 5 件) |
| base branch | `dev`（CLAUDE.md 既定方針） |

## 1. 前提条件（PR 作成前に満たすべき）

- 実装完了: `MeetingAttendancePanel.tsx` に解除 CTA + 第 2 mutation + UI logger 追加、`MeetingAttendancePanel.spec.tsx` に B1..B5 追加
- vitest pass: `MeetingAttendancePanel.spec.tsx` 14 tests + `useAdminMutation.spec.ts` 33 tests
- typecheck / lint exit 0
- DELETE-race caller 棚卸し grep 0 件 or 既知 caller のみ
- Phase 11 inventory が全て `present`
- Phase 12 strict 7 が `outputs/phase-12/` に配置済
- `git status --porcelain` 空、`git diff origin/dev...HEAD --name-only` が想定 diff のみ
- `bash scripts/verify-pr-ready.sh` exit 0

## 2. user-gated 操作一覧

| # | 操作 | コマンド | 解放条件 |
|---|---|---|---|
| 1 | 実装 | コード編集（MeetingAttendancePanel.tsx + spec） | user 明示承認 |
| 2 | vitest 実行 | `pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"` ほか | 実装完了 |
| 3 | typecheck / lint | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck && mise exec -- pnpm --filter @ubm-hyogo/web lint` | vitest pass |
| 4 | indexes:rebuild | `mise exec -- pnpm indexes:rebuild` | skill 追記後 |
| 5 | 親 workflow back-reference 更新 | issue-842 系列の関連 ledger に `superseded/extended by issue-911` を追記 | commit 直前 |
| 6 | commit | 下記 §3 (3) | user 明示承認 |
| 7 | push | `git push -u origin <feature-branch>` | commit 後 |
| 8 | PR 作成 | `gh pr create --base dev ...` | push 後 |
| 9 | completed-tasks 移動 | `git mv docs/30-workflows/issue-911-* docs/30-workflows/completed-tasks/issue-911-*` + stale ref 全補修 | PR merge 後（別 cleanup wave） |

## 3. PR 作成手順

```bash
# (1) ローカル同期
git fetch origin dev
git checkout dev && git pull --ff-only origin dev
git checkout <feature-branch>
git merge dev   # コンフリクトは CLAUDE.md「sync-merge コンフリクト解消の3層予防」に従う

# (2) 品質保証
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
pnpm exec vitest run "apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx"
pnpm exec vitest run apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts
bash scripts/verify-pr-ready.sh

# (3) commit (user 明示承認後)
git add apps/web/app/\(admin\)/admin/meetings/\[id\]/MeetingAttendancePanel.tsx \
        apps/web/app/\(admin\)/admin/meetings/\[id\]/__tests__/MeetingAttendancePanel.spec.tsx \
        docs/30-workflows/issue-911-meeting-attendance-unregister-ui-treat404-wiring/ \
        docs/30-workflows/LOGS.md \
        .claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md \
        .claude/skills/aiworkflow-requirements/

git commit -m "$(cat <<'EOF'
feat(admin-meeting): attendance unregister CTA + treat404AsSuccess wiring (#911)

- apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx: 解除 CTA + 第 2 mutation (POST attended:false + treat404AsSuccess: { toast: "既に解除済みです" } + refreshOnSuccess: false) を追加
- apps/web/app/(admin)/admin/meetings/[id]/__tests__/MeetingAttendancePanel.spec.tsx: B1..B5 を追加 (表示条件/payload/200/404/500)
- API (apps/api/src/routes/admin/meetings.ts) / hook (useAdminMutation.ts) は無改変 (UI prototype alignment 不変条件 1)
- skill: task-specification-creator + aiworkflow-requirements に L-I911-001..005 を反映

Refs #911

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# (4) push & PR
git push -u origin <feature-branch>

gh pr create --base dev --title "feat(admin-meeting): attendance unregister CTA + treat404AsSuccess wiring (#911)" --body "$(cat <<'EOF'
## Summary

- 管理画面の meeting 出欠 panel に「解除する」CTA を追加し、`useAdminMutation` の第 2 インスタンスで `POST /api/admin/meetings/:id/attendances { attended: false }` + `treat404AsSuccess: { toast: "既に解除済みです" }` + `refreshOnSuccess: false` を配線
- 既に他経路で解除済み（API が 404 を返す DELETE-race）の場合、error toast ではなく info toast を表示し、UI は楽観反映で解除状態に揃える
- 既存 API endpoint surface / 既存 hook policy / design token は全て無改変（UI prototype alignment 不変条件 1）

## Scope

- 含む: `MeetingAttendancePanel.tsx` の CTA + 第 2 mutation + UI logger / `MeetingAttendancePanel.spec.tsx` の B1..B5 / docs strict 7 / skill 反映
- 含まない: API 新規 DELETE route / hook 本体改修 / e2e Playwright / 他 caller への横展開

## Test plan

- [x] `vitest MeetingAttendancePanel.spec.tsx` 14 tests PASS
- [x] `vitest useAdminMutation.spec.ts` 33 tests PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web lint` PASS
- [x] production DELETE-race caller grep 0 件
- [ ] `bash scripts/verify-pr-ready.sh` PASS

## Evidence

- vitest log: `docs/30-workflows/issue-911-.../outputs/phase-11/vitest-meeting-attendance-panel.log`
- typecheck log: `docs/30-workflows/issue-911-.../outputs/phase-11/typecheck.log`
- lint log: `docs/30-workflows/issue-911-.../outputs/phase-11/lint.log`

Refs #911

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 4. PR 作成後の確認

- required status check が全 green
- `verify-design-tokens` / `verify-test-suffix` / `verify-indexes-up-to-date` / `verify-gate-metadata` / `verify-phase12-compliance` 全 green
- solo dev self-review で AC 全項目を verdict 表で最終確認
- Issue #911 は CLOSED 参照として `Refs #911` のみ使用

## 5. completed-tasks 移動 (PR merge 後)

```bash
git mv docs/30-workflows/issue-911-meeting-attendance-unregister-ui-treat404-wiring \
       docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring

# stale ref 補修（全 docs / .claude 横断）
mise exec -- rg -l "30-workflows/issue-911-meeting-attendance-unregister-ui-treat404-wiring" docs/ .claude/ \
  | xargs sed -i '' 's|30-workflows/issue-911-meeting-attendance-unregister-ui-treat404-wiring|30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring|g'

mise exec -- pnpm indexes:rebuild
mise exec -- pnpm verify:phase12-compliance -- docs/30-workflows/completed-tasks/issue-911-meeting-attendance-unregister-ui-treat404-wiring
```

## 6. ロールバック手順

| 症状 | 手段 |
|---|---|
| B4 fail（404 が error 落ち） | `MeetingAttendancePanel.tsx` の unregister mutation options 設定漏れを確認 |
| commit revert | `git revert <commit-sha>` で revert PR |
| skill 反映の問題 | L-I911-001..005 を revert（task-specification-creator / aiworkflow-requirements の該当 diff のみ） |

## 7. Phase 13 完了条件

- [ ] PR URL を取得
- [ ] 採用 base branch = `dev`
- [ ] required status check 全 green
- [ ] AC-1..AC-6 を verdict 表で最終確認
- [ ] Issue #911 を auto-close しない `Refs #911` wording 確認
- [ ] completed-tasks 移動 + stale ref 補修 + indexes:rebuild 完了

## 8. 次 Phase への引き継ぎ

PR merge + completed-tasks 移動完了後、本 workflow は `implementation_completed` 終端へ遷移し、`docs/30-workflows/LOGS.md` に 1 行 entry を追加してクローズする。
