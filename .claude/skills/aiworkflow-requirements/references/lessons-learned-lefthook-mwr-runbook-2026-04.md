# Lessons Learned — Multi-Worktree Lefthook Reinstall Runbook（2026-04-28）

> task-lefthook-multi-worktree-reinstall-runbook（docs-only / runbook-spec / NON_VISUAL）の Phase 1〜12 完了に伴う苦戦箇所と再発防止知見。
> 派生元: `references/lessons-learned-lefthook-unification-2026-04.md` の B-1（baseline）を formalize したタスク。
> 関連正本: `doc/00-getting-started-manual/lefthook-operations.md`（差分追記対象）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md` / `references/lessons-learned.md`

## 教訓一覧

### L-MWR-001: pnpm content-addressable store は worktree 横断の並列書き込みで壊れる

- **状況**: 30+ 件の worktree に対し `lefthook install` を流すために `pnpm install --prefer-offline` を全件で並列実行すると、共有 store の content-addressable storage が壊れ、途中の worktree から install が中途半端に止まる事故が起きうる。
- **教訓 / How to apply**:
  1. runbook では「**逐次実行**（`while read` ループで 1 worktree ずつ）」を必須として明記する。並列禁止の理由（pnpm store 競合）を併記する。
  2. 中途半端な状態が疑われたら全プロセスを止め、`pnpm store prune` で復旧してから逐次に戻す。
  3. 並列化したい場合は per-worktree の独立 store（`PNPM_HOME` 分離）が前提。MVP ではコスト過大として採らない。

### L-MWR-002: `git worktree list` の prunable / detached HEAD は対象除外を明示する

- **状況**: `git worktree list --porcelain` には `prunable` フラグ付きの古い worktree や detached HEAD の作業ツリーが含まれる。何も考えずに iterate すると「もう存在しないパス」で `pnpm install` が `SKIP_NOT_FOUND` を出すか、detached HEAD で hook の意味を判断しかねる状態になる。
- **教訓 / How to apply**:
  1. runbook 側で `--porcelain` 出力を parse し、`prunable` フラグ付きエントリを除外する手順を明記する。
  2. detached HEAD の worktree も hook は branch と独立に動くため install 対象に含める（コミット行為が発生しないだけ）。
  3. SKIP_NOT_FOUND が出た場合は `git worktree prune` を一次対処として、再度 runbook を回す。

### L-MWR-003: Apple Silicon でのバイナリ不一致は `pnpm rebuild lefthook` で復旧する

- **状況**: `pnpm install` 完了後でも `mise exec -- pnpm exec lefthook version` が exit 1 を返すケースがある。原因は Apple Silicon マシンで lefthook ネイティブバイナリのアーキ不一致。
- **教訓 / How to apply**:
  1. `lefthook version` 失敗時の一次対処は `pnpm rebuild lefthook`、二次対処は `pnpm install --force`。
  2. runbook のトラブル対応表にこの 2 段階を必ず載せる。
  3. 自動 retry は 1 回まで（無限ループ化を防ぐ）。

### L-MWR-004: 旧 `.git/hooks/post-merge` は自動削除せず手動確認

- **状況**: post-merge 廃止前に作られた worktree には `.git/hooks/post-merge` が残ったままになっていることがある。`lefthook install` は同名 hook を上書きするが、lefthook 由来でない手書き hook が残っているケースもある。
- **教訓 / How to apply**:
  1. runbook では `LEFTHOOK` sentinel 行が含まれない `post-merge` を **STALE** として検出する手順を入れる。
  2. STALE 検出時は内容確認後に **手動削除のみ**（自動削除はしない）。誤って利用者の意図的な hook を消す事故を防ぐ。
  3. 検出ログは `outputs/phase-11/manual-smoke-log.md` の `notes` 列に残す。

### L-MWR-005: `lefthook install` のべき等性は仕様で保証されているが運用で明文化する

- **状況**: 同 worktree への複数回 install が壊れないことは公式仕様だが、運用者が「再実行してもよいか」迷うと runbook を最後まで回さなくなる。
- **教訓 / How to apply**:
  - runbook 冒頭で「**べき等（再実行可）**」を 1 行で明記する。
  - 失敗時の再開地点を「失敗 worktree から再開可」と明示し、全件やり直しを強要しない。

### L-MWR-006: 運用記録は ISO8601 + 表形式で固定する

- **状況**: 運用ログの自由記述は経年で書式が揺れて検索性を失う。
- **教訓 / How to apply**:
  1. `outputs/phase-11/manual-smoke-log.md` の Markdown 表書式（worktree path / lefthook version / PASS/FAIL / 実行時刻 ISO8601 / notes）を runbook 正本として固定する。
  2. 見本行は実機ログ反映後も削除せず残す（書式の自己ドキュメント化）。
  3. `lefthook-operations.md` 側からは「ログ書式参照リンク」のみ張り、二重定義しない。

## 申し送り（open / baseline 未タスク）

- **N-01**（既存依存として追跡中）: `scripts/reinstall-lefthook-all-worktrees.sh` 実装 Wave + CI smoke。本タスクの依存関係表（index.md）で記録済みのため `unassigned-task/` には独立起票しない（重複防止）。
- **B-1（formalize 完了）**: `lessons-learned-lefthook-unification-2026-04.md` の B-1（既存 worktree への lefthook 再インストール runbook 運用化）は本タスクで formalize 済み。
- **baseline ALT-A/B/C**: Phase 3 不採用案 3 件は `outputs/phase-12/unassigned-task-detection.md` に保存（CI 経由全 worktree 検証 / per-clone 化 / post-merge 復活）。
