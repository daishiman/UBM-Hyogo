# Phase 13: PR 作成 / 承認ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 区分 | リリース |
| 想定所要 | 0.1 人日 |

## 目的

Phase 1-12 を満たす状態で PR 作成準備を固定する。`git commit` / `git push` / `gh pr create` /
`gh pr merge` はユーザーの明示承認が来るまで実行しない。

## 13.1 事前条件（all green required）

- [ ] Phase 5 実装完了
- [ ] Phase 6 ローカル検証コマンド全 PASS
- [ ] Phase 7 既存 CI gate 整合確認
- [ ] Phase 11 evidence 12 file 全 present
- [ ] Phase 12 必須 7 outputs 物理存在

## 13.2 PR pre-flight

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

すべて exit 0 まで PR を作成しない。失敗時は
`.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照。

結果は `outputs/phase-13/local-check-result.md` に記録する。

## 13.3 branch / commit（ユーザー承認後のみ）

- branch: `feat/step-06-meetings-attendance-mutation` (PR autonomous flow §「実行順序」step 1 と整合)
- commit: 1 commit に集約してよい（solo dev policy）。複数の場合は意味単位で分割
- co-author: `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`

## 13.4 sync-merge（ユーザー承認後のみ）

```bash
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev
git checkout feat/step-06-meetings-attendance-mutation
git merge dev   # conflict 時は pnpm sync:resolve
```

## 13.5 PR 作成（ユーザー承認後のみ）

```bash
gh pr create --base dev --title "feat: admin meetings attendance mutation unify (serial-05 step-06)" \
  --body "$(cat <<'EOF'
## Summary
- 新規: `useConfirmDialog` hook + `ConfirmDialog` UI 部品 (step-07 でも再利用)
- `MeetingPanel.tsx` の出席解除 / 開催日削除を confirm dialog 経由に統一
- `MeetingAttendancePanel.tsx` の直接 fetch を `useAdminMutation` 経由に置換

## Test plan
- [ ] `pnpm typecheck && pnpm lint && pnpm test apps/web` green
- [ ] `pnpm e2e:smoke` /admin/meetings 動線 PASS
- [ ] preview deploy 上で confirm dialog 出現確認
- [ ] 409 / 422 toast 表示確認

## Screenshots
outputs/phase-11/screenshots/ 参照 (5 枚)

## Refs
- serial-05 step-06 (本ワークフロー: docs/30-workflows/step-06-meetings-attendance-implementation/)
- 正本 spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-06-meetings-attendance/spec.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 13.6 承認ゲート（solo dev）

| gate | 判定 |
| --- | --- |
| required status check (CI) | 全 PASS 必須 |
| required reviewer | 0 (solo policy) |
| 線形履歴 | 必須 (squash or rebase merge) |
| 会話解決 | 必須 |

ユーザー明示承認が来るまで Claude / Codex は commit / push / PR 作成 / merge を自動実行しない。

## 13.7 Phase 13 outputs

| output | path | status |
| --- | --- | --- |
| local check result | `outputs/phase-13/local-check-result.md` | required before PR |
| pr-body draft | `outputs/phase-13/pr-body.md` | required before PR |
| approval gate | `outputs/phase-13/approval-gate.md` | required; starts `blocked_until_explicit_user_approval` |
| post-merge plan | `outputs/phase-13/post-merge-plan.md` | required before merge |

## 13.8 Post-merge

- ワークフローディレクトリ `docs/30-workflows/step-06-meetings-attendance-implementation/` を
  `.claude/skills/task-specification-creator/references/completed-tasks-policy.md` に従い
  `docs/30-workflows/completed-tasks/<category>/step-06-meetings-attendance-implementation/` へ移動する
  PR を別途作成（または同一 PR で移動）

## 完了条件

- [ ] ユーザーが PR 作成を明示承認している
- [ ] Phase 13 outputs 4 件が物理存在
- [ ] PR が `dev` に向けて作成済
- [ ] PR URL が記録されている
- [ ] CI 全 PASS
- [ ] (ユーザー承認後) merge 完了
- [ ] completed-tasks への移動方針が記録されている

## リスク

- CI flaky (e2e smoke 等) → re-run。3 回連続 fail なら別 issue で根本対応
- preview deploy が壊れる → 直前 commit を fix し force-push せず追加 commit で対応 (solo policy: amend 回避)
