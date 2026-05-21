# Phase 13: PR 作成・close-out

[実装区分: 実装仕様書]

## 1. PR 作成条件（すべて満たすこと）
- Phase 7 ローカル検証すべて PASS
- Phase 8 staging smoke 6 route 全 PASS
- Phase 11 inventory すべて `present`
- `bash scripts/verify-pr-ready.sh` PASS

## 2. PR コマンド（ユーザー承認後）
```bash
git push -u origin fix/runtime-smoke-admin-members-500
gh pr create --base dev --title "fix(admin-members): recover staging runtime smoke 500 on /admin/members" \
  --body "$(cat <<'EOF'
## Summary
- staging `GET /admin/members` の http=500 を解消し、`backend-ci → runtime smoke staging / smoke` を回復
- enum 縮退 + try/catch + structured log + smoke body 転記の 4 点を導入

## Root Cause
（Phase 2 結果に応じて記入）

## Test plan
- [ ] pnpm typecheck / lint / api test PASS
- [ ] staging smoke 6 route 全 PASS（`outputs/phase-08/evidence/summary.json`）
- [ ] backend-ci `runtime smoke staging / smoke` green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 3. close-out
- merge 後、`docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/` を `docs/30-workflows/completed-tasks/` 配下に移動
- `artifacts.json.status` を `implementation_completed` に更新
- `Refs #<merged-pr-number>` を本 workflow `index.md` に追記
- `.claude/skills/aiworkflow-requirements/{indexes/quick-reference.md,indexes/resource-map.md,references/task-workflow-active.md,references/workflow-task-runtime-smoke-admin-members-500-recovery-001-artifact-inventory.md,changelog/*,lessons-learned/*}` の path/status を completed root へ同 wave 同期

## 4. Phase 13 DoD
- PR が dev base で open
- close-out 4 step が完了し worktree が clean
