# Phase 13: PR 作成

実装区分: 実装仕様書

## 13.1 user approval gate

このフェーズは **user 承認後にのみ実行可** （`artifacts.json#phases[13].user_approval_required: true`）。
Phase 12 までの全成果物が完備されていることを user に提示し、PR 作成許可を得てから 13.3 に進む。

## 13.2 outputs 一覧

| 成果物 | 配置 | 内容 |
| --- | --- | --- |
| local-check-result | `outputs/phase-13/local-check-result.md` | typecheck / lint / build / test の最終結果 |
| change-summary | `outputs/phase-13/change-summary.md` | 変更ファイル一覧と差分要約 |
| pr-template | `outputs/phase-13/pr-template.md` | PR title / body テンプレート |

## 13.3 ローカル最終チェック（user 承認後実行）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
mise exec -- pnpm --filter @ubm-hyogo/api test
```

すべて exit 0 を `outputs/phase-13/local-check-result.md` に記録。

## 13.4 change-summary

`git diff main...HEAD --name-only` の結果を分類:

| 区分 | ファイル |
| --- | --- |
| 仕様書 | `docs/30-workflows/ut-02a-followup-001-attendance-write-operations/**` |
| 実装 | `apps/api/src/repository/attendance.ts`, `apps/api/src/routes/admin/attendance.ts`, `apps/api/src/routes/admin/meetings.ts`, `apps/api/src/repository/_shared/branded-types/meeting.ts` |
| テスト | `apps/api/src/repository/attendance.test.ts`, `apps/api/src/routes/admin/meetings.test.ts`, `apps/api/src/routes/admin/attendance.test.ts`, `apps/api/src/repository/__tests__/attendance-provider.test.ts` |
| spec 更新 | aiworkflow-requirements index / changelog sync（`docs/00-getting-started-manual/specs/*` は既存 06c-E / 07c 正本を参照し、今回差分では直接編集しない） |
| 親タスク sync | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/outputs/phase-12/unassigned-task-detection.md` |
| index | `.claude/skills/aiworkflow-requirements/indexes/**`（`pnpm indexes:rebuild` の結果） |

## 13.5 PR template

### title
```
feat(api): attendance writer hardening + admin route audit log (Refs #369)
```

### body
```markdown
## Summary
- ut-02a-followup-001: 既存 `addAttendance` / `removeAttendance` write contract の正本化 + Phase 12 close-out
- admin route (`/admin/meetings/:id/attendances`, `/admin/members/:id/attendance`) の 05a admin gate 結線硬化と audit log (`attendance.add` / `attendance.remove`) 必須化
- 楽観排他 / 削除済み meeting・member への write 拒否を type / SQL の二重で保証
- read path (`AttendanceProvider.findByMemberIds`) との一貫性を統合テストで担保

## Refs
- Refs #369（CLOSED のまま参照、reopen しない）
- 親仕様: `docs/30-workflows/ut-02a-followup-001-attendance-write-operations/`

## Changes
（13.4 change-summary を貼付）

## AC checklist
- [x] AC-1〜AC-11 全充足（`docs/30-workflows/ut-02a-followup-001-attendance-write-operations/phase-07.md` 参照）
- [x] curl evidence 4 件（`outputs/phase-11/evidence/api-curl/`）
- [x] admin UI smoke ログ（`outputs/phase-11/evidence/ui-smoke/`）
- [x] 既存 02a / read path / audit / meetings テスト regression なし

## Test plan
- [x] `mise exec -- pnpm typecheck`
- [x] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm build`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test`
- [x] curl evidence 取得（Phase 11）
- [x] admin UI smoke 観察（Phase 11）

## Invariants touched
- #4 admin-managed data 分離
- #5 D1 直接アクセスは apps/api に閉じる
- admin gate 中継（route 単体迂回禁止）
- `MemberProfile.attendance` 型契約不変

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 13.6 PR 作成コマンド（user 承認後）

```bash
gh pr create --title "feat(api): attendance writer hardening + admin route audit log (Refs #369)" \
  --body "$(cat outputs/phase-13/pr-template.md)"
```

## 13.7 CI 確認

- branch protection の required_status_checks（typecheck / lint / build / test）が全 green
- coverage gate（issue-475）が baseline 以上

## 13.8 完了

- PR URL を `outputs/phase-13/main.md` に記録
- 02a unassigned-task の本項目を「解消済み」最終 commit
- ライフサイクル状態を `completed` へ更新（`artifacts.json#metadata.workflow_state`）

## 13.9 DoD

- 13.3 全 PASS
- 13.5 PR 作成
- 13.7 CI 全 green
- 13.8 lifecycle 更新済み
