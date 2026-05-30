---
Phase: 13
status: pending_user_approval
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-13-pr.md
---

# Phase 13 — PR (task A)

## 状態

`pending_user_approval`。Gate-C 待ち。

## 想定 PR タイトル

```
feat(shell): SidebarShell primitive (task A of unified-sidebar-shell-public-and-admin)
```

## 想定 base ブランチ

`dev`（親 workflow と同じ）。

## 含めるべき差分

- artifacts.json `implementation_files` 15 file
- `outputs/phase-12/` strict 7（同期反映）
- 親 workflow への参照リンク（PR 本文に明示）

## 事前検証（Phase 9 の再実行）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## user-gated boundary

commit / push / `gh pr create` はユーザー明示承認後のみ実行。本サブworkflow は仕様書段階で完結し、コード commit は親 workflow の wave で実施する。
