# Phase 13 — diff-to-pr 要点

## PR Title

```
docs(lefthook-ops): add verify-indexes-up-to-date trigger and recovery SOP (#289)
```

## PR Summary

- Issue #289 (CLOSED) で未充足だった documentation gap を解消
- `lefthook-operations.md` に新セクション「skill indexes drift gate — trigger 条件と復旧 SOP」を追記
- 当初想定の `docs/00-getting-started-manual/deployment-gha.md` は存在しない。`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` は CI/CD 正本として残し、復旧 SOP は hook 運用正本 `lefthook-operations.md` に統合 retarget
- pre-push hook (`indexes-drift-guard`) を一次防衛、CI gate (`verify-indexes-up-to-date`) を二次防衛として明示
- `lefthook.yml` fail_text に runbook 導線を追加（hook 実行ロジック変更なし）
- PR 文脈は Issue #289 が CLOSED のため `Refs #289` のみを使用する

## Test plan

- [ ] `rg -n "skill indexes drift gate" docs/00-getting-started-manual/lefthook-operations.md` で hit すること
- [ ] Phase 10 AC-1〜AC-5 が全件 PASS
- [ ] `rg -n "lefthook-operations.md#skill-indexes-drift-gate" lefthook.yml` で hit すること
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` が通る（runbook + hook fail_text 変更のため影響なし想定の確認のみ）

## スクリーンショット

なし（NON_VISUAL タスク）。

## PR base

`dev`（CLAUDE.md 既定方針通り）

## User Gate

commit / push / PR はユーザー明示承認後にのみ実行する。
