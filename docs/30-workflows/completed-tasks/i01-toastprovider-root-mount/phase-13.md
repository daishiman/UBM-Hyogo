# Phase 13: PR・振り返り

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR・振り返り |
| 前 Phase | 12 (正本同期) |
| 次 Phase | なし |
| 状態 | **blocked_pending_user_approval**（ユーザー明示承認まで commit / push / PR 実行不可） |

## 13-1. PR 基本情報

| 項目 | 値 |
| --- | --- |
| Title | `fix(i01): mount ToastProvider at root layout to unblock admin mutation toasts` |
| Base branch | `dev` |
| Source branch | `feat/i01-toastprovider-root-mount`（未作成 / 本 Phase で作成） |
| Body | `outputs/phase-12/implementation-guide.md` を流用 |
| Labels | `area:web`, `type:fix`, `priority:high` |

## 13-2. 実行手順（user 承認後のみ）

```bash
# 1. main → dev → 作業ブランチ への sync
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260516-201627-wt-4
git fetch origin dev
git checkout -b feat/i01-toastprovider-root-mount
git merge origin/dev

# 2. 検証
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. commit
git add apps/web/app/layout.tsx \
  docs/30-workflows/completed-tasks/i01-toastprovider-root-mount \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes \
  docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md \
  .claude/skills/aiworkflow-requirements/indexes/quick-reference.md \
  .claude/skills/aiworkflow-requirements/indexes/resource-map.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow-active.md \
  .claude/skills/aiworkflow-requirements/references/workflow-i01-toastprovider-root-mount-artifact-inventory.md \
  .claude/skills/aiworkflow-requirements/changelog/20260516-i01-toastprovider-root-mount.md
git commit -m "$(cat <<'EOF'
fix(i01): mount ToastProvider at root layout

useAdminMutation hook calls useOptionalToast() but ToastProvider was
never mounted, causing admin mutation toasts to silently fail with
warnMissingToastProvider fallback. Wrap children in <ToastProvider>
in apps/web/app/layout.tsx.

Closes p-08 DoD line 172. Unblocks serial-05/step-01..07.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. push
git push -u origin feat/i01-toastprovider-root-mount

# 5. PR
gh pr create --base dev --title "fix(i01): mount ToastProvider at root layout to unblock admin mutation toasts" --body "$(cat docs/30-workflows/completed-tasks/i01-toastprovider-root-mount/outputs/phase-12/implementation-guide.md)"
```

## 13-3. post-merge アクション

| アクション | 対象 |
| --- | --- |
| integration-fixes/index.md の i01 行を「完了」状態に再更新 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md |
| parallel-08 spec の DoD checkbox を済に更新 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md |
| serial-05/step-01 着手可能フラグ更新 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/index.md |

## 13-4. 振り返りチェック

| 項目 | 振り返り |
| --- | --- |
| 価値性 | serial-05 unblock の実効果は post-merge 後に観測 |
| 実現性 | +4 / -1 行で完了。見積通り |
| 整合性 | p-08 DoD と本タスク DoD が一致 |
| 運用性 | 副作用なし。toast queue が global 共有になった |
| 反省 | parallel-08 マージ時点で root layout 確認が漏れた → integration-fixes ワークフローの必要性を再確認 |

## 13-5. 統合テスト連携

post-merge 後、以下が unblocked:

- serial-05/step-01: members note mutation → toast 成功動作
- serial-05/step-02..07: 同上
- profile request dialog: 既存実装の toast 経路も活性化

## 13-6. user-gated 確認事項

**Phase 13 の実行 (commit / push / PR) は user の明示指示なしには着手しない。**

本 Phase は spec_created 状態で停止し、ユーザーが「PR まで進めて」等の指示を出した時点で実行する。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-13/pr-summary.md | PR title / body / labels / 実行手順 |

## 完了条件

- [ ] PR title / body / branch 戦略が固定
- [ ] commit message が用意
- [ ] post-merge アクション一覧あり
- [ ] **(user-gated)** commit / push / PR 実行

## 関連 Issue

未起票。本タスクは integration-fixes 配下の小規模 wiring のため、Issue 起票は user 判断で実施。
