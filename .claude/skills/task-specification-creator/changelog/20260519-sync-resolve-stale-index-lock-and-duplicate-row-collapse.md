# task-specification-creator — dev sync 自律復旧手順の拡張（2026-05-19）

`aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の **L-DEVSYNC-026**（worktree stale `index.lock` 復旧 / duplicate-row collapse）を task-specification-creator skill にも反映。

## 追加された自律修復ルール
1. **stale `index.lock` 自動復旧** (B-7): `pnpm sync:resolve` / `git merge` 系で `Unable to create '.../index.lock': File exists.` が出たら `rm -f "$(git rev-parse --git-dir)/index.lock"` で復旧して再試行。worktree 配下では `.git` がテキストファイル（`gitdir: ...`）のため、`git rev-parse --git-dir` 経由でないと正しい lock path に到達できない。
2. **duplicate-row collapse** (B-8): 3-way diff block 内の HEAD 行が conflict marker 直前の already-merged 領域に grep で検出可能なら HEAD ブロックを破棄し dev ブロックのみ採用。完全新規行のみなら従来通り L-DEVSYNC-012 の両側採用。

## task-specification-creator skill への組み込み観点
- Phase 13（PR 作成・dev sync 自律実行）の自律修復ルーチンに B-7 / B-8 を追加
- `references/pr-pre-flight-ci-gate-checklist.md` の sync-merge 復旧手順に worktree-aware path 解決 (`git rev-parse --git-dir`) を明記
- spec 生成時の Phase 12 / Phase 13 instruction template において、worktree 環境前提のコマンド例を `$GITDIR=$(git rev-parse --git-dir)` で抽象化する

## 事例
- 2026-05-19 `fix/parallel-i06-root-error-focus` ← dev sync-merge:
  - `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の 3-way block 2 箇所で HEAD の i06 row が already-merged 領域と重複 → dev ブロックのみ採用で collapse
  - `pnpm sync:resolve` が worktree の `index.lock` 残置で失敗 → `git rev-parse --git-dir` 経由で復旧
