# Lessons: branch-sync 中の mid-flight half-state リカバリ（2026-05-27）

## コンテキスト

`feat/google-form-reflection-diagnostics` で `git merge origin/dev` 実行中、`error: Unable to write index` が返り `git merge` は exit 1。しかし `git status` は `All conflicts fixed but you are still merging` を返す half-state に陥った。

要因の合わせ技:
1. ディスク残量 4.5GiB / 99% 使用で `index` 書き込みが intermittent 失敗
2. 直前の失敗が `index.lock`（0byte）を残置 → 後続 `git commit` も `Unable to create index.lock` で blocked

最終的に index.lock を手動 `rm -f` 後 `git commit --no-edit` で merge が成立。typecheck / lint green、push 成功。

## Lessons

### L-BRSYNC-001 (half-state 判定)
`git merge` が非0 exit でも、`git status` / `git diff --name-only --diff-filter=U` / `git ls-files -u` の 3 点で「conflict が残っているか」を必ず確認する。`All conflicts fixed but you are still merging` かつ `-u` 出力空 = merge は実質完了済みで `git commit --no-edit` だけで成立。`merge --abort` を反射的に打つと auto-resolution の成果を破棄する。

### L-BRSYNC-002 (stale index.lock)
`Unable to create '...index.lock': File exists` 発生時は `ls -la <gitdir>/index.lock` で size と mtime を確認。0byte で 5分以上経過 / 該当 git 子プロセス（`ps aux | grep git`）が存在しない → stale 確定。`.git` 配下の `rm` は settings の permission policy で blocked されうるため、AI は detection + 1行コマンド提示までに留め、ユーザ手動実行を経路として確保する。

### L-BRSYNC-003 (容量 pre-flight)
sync-merge の Phase 0 に `df -h "$(pwd)"` を必須化。空き <5GiB で警告、<2GiB で中断。容量不足下では `index` write が mid-flight に倒れ、`index.lock` 残置 → 復旧コスト跳ね上がり。

### L-BRSYNC-004 (gitdir 解決)
worktree では `.git` がファイルのため `mkdir -p .git/...` は `Not a directory` で失敗する。ログ / lock パスは必ず `git rev-parse --git-dir` を base にする。本事例では `$GITDIR/branch-sync-logs/...` のパターンで復旧。

### L-BRSYNC-005 (完全自律実行と .git 配下の境界)
完全自律実行モードであっても `.git` 配下の破壊系（`rm` / `unlink` / index 直接編集）はユーザ手動経路を最終手段として残す設計が安全。AI は状態判定 + 単発コマンド提示まで、実行はユーザに委ねる。本事例ではこの境界が機能し、ユーザ手動 `rm -f` で復旧した。

## Anti-pattern

- `git merge` の exit 1 だけ見て即 `git merge --abort` → auto-resolved な結果を破棄
- `Unable to write index` を見て同じ merge コマンドを単純リトライ → index.lock が累積
- `.git/branch-sync-logs/` を `.git` がファイルの worktree で `mkdir -p .git/...` で作成しようとする → 失敗
- 容量逼迫を確認せず大規模 sync-merge を強行
- AI 側で `.git/index.lock` を強制削除 → permission policy / 監査要件と衝突

## 関連リンク

- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` § branch-sync 中の mid-flight half-state リカバリ（2026-05-27）
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md`（worktree 別 .git ファイル化の前例）
