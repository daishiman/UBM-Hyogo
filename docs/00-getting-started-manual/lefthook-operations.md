# lefthook 運用ガイド

UBM 兵庫支部会の Git hook は **lefthook** に統一されている。本ガイドは日常運用と
トラブルシューティングをまとめる。設計の正本は
`docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` 。

## 構成ファイル

| パス | 役割 |
| --- | --- |
| `lefthook.yml` | hook 定義の正本（pre-commit / post-merge / pre-push） |
| `scripts/hooks/main-branch-guard.sh` | pre-commit: main / dev への直接 commit 阻止 |
| `scripts/hooks/staged-task-dir-guard.sh` | pre-commit: ブランチと無関係なタスクディレクトリの混入阻止（merge 中はスキップ） |
| `scripts/hooks/stale-worktree-notice.sh` | post-merge: 遅延 worktree の通知（read-only） |
| `scripts/coverage-guard.sh` | pre-push: 80% coverage 強制（merge commit はスキップ） |
| `package.json` `prepare` | `pnpm install` 時に `lefthook install` を起動 |
| `package.json` `indexes:rebuild` | skill indexes の明示再生成コマンド |
| `lefthook-local.yml` | 開発者個別 override（`.gitignore` 対象） |

## 初回セットアップ / 既存 worktree への適用

```bash
# clone / 新規 worktree 直後
mise exec -- pnpm install
# → prepare script が lefthook install を実行し、.git/hooks/* を上書き配置

# 既に作業中の worktree への一括適用（実装担当者向け runbook）
bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run
bash scripts/reinstall-lefthook-all-worktrees.sh
```

> 並列実行は禁止（pnpm store の同時書き込みで壊れる）。逐次で回す。

### 既存 worktree 一括 reinstall の運用

| 項目 | 内容 |
| --- | --- |
| 実行責任者 | `lefthook.yml`、`package.json` `prepare`、または hook 関連 runbook を変更した担当者 |
| 実行タイミング | hook 定義追加・削除・改定時、既存 worktree に旧 hook が残っている疑いがある時 |
| 事前確認 | `bash scripts/reinstall-lefthook-all-worktrees.sh --dry-run` で PASS / SKIP 予定を確認 |
| 完了条件 | FAIL 0 件。PASS または理由付き SKIP が全 worktree に出力されていること |
| 実行ログ | stdout の `PASS` / `SKIP` / `FAIL` と summary を該当タスクの Phase 11 manual-smoke-log に転記 |

`SKIP node_modules not found` は、まだ依存関係を作っていない worktree のため許容する。
作業対象の worktree で SKIP した場合は、その worktree 内で `mise exec -- pnpm install` を実行してから再度 runbook を回す。

## 日常コマンド

```bash
# skill 仕様（references/*）変更後の indexes 更新
mise exec -- pnpm indexes:rebuild

# hook を一時バイパス（緊急用のみ）
LEFTHOOK=0 git commit -m "..."
git commit --no-verify -m "..."

# dry-run / debug
mise exec -- pnpm exec lefthook run pre-commit
mise exec -- pnpm exec lefthook run post-merge
mise exec -- pnpm exec lefthook validate
```

## post-merge 自動再生成廃止について

旧 `.git/hooks/post-merge` は indexes/*.json を毎マージ後に再生成していたが、
無関係 PR への diff 混入の原因になっていた。lefthook 移行と同時に **再生成は廃止** し、
明示コマンド `pnpm indexes:rebuild` に分離した。CI 側で
`verify-indexes-up-to-date` job（`.github/workflows/verify-indexes.yml`）を新設して
古い indexes での PR / `main` push を検出する。branch protection の required status check に
追加した場合は main 流入をブロックできる。drift 検出範囲は
`.claude/skills/aiworkflow-requirements/indexes` に限定され、`pnpm indexes:rebuild` 実行後の
`git diff --exit-code` で fail させる authoritative gate として機能する。

## sync-merge (main 取り込み) 時の hook 自動スキップ — 個人開発ポリシー

main を feature ブランチへ取り込む sync-merge では、`staged-task-dir-guard` と `coverage-guard` が構造的に誤検知する（mainに含まれる他タスクの dir / 他タスクのコード追加で coverage 一時的に低下）。solo dev 運用ポリシーとして、両 hook はマージコミット時に **自動でスキップ** する設計とする。

| hook | スキップ条件 | 検出方法 |
|------|-------------|---------|
| pre-commit `staged-task-dir-guard` | マージ/cherry-pick/revert 進行中 | `$GIT_DIR/MERGE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD` の存在 |
| pre-push `coverage-guard` | push 範囲に merge commit を含む | `git log --merges @{u}..HEAD` が 1 件以上 |

これにより `git commit` / `git push` で `--no-verify` を付ける必要がなくなる。feature コミット/push は従来通り hook が機能する。Claude Code を含む AI エージェントは `--no-verify` の常用を避け、誤検知が発生する場合は本ポリシーに沿って hook 自体を改善する。

## トラブルシューティング

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| hook が動かない | `pnpm install` 未実行 | `mise exec -- pnpm install` を必ず実行 |
| `.git/hooks/post-merge` が lefthook 由来でない | 既存 worktree に旧 hook 残存 | `bash scripts/reinstall-lefthook-all-worktrees.sh` を実行 |
| Apple Silicon でバイナリ起動失敗 | arch 不一致 | `pnpm rebuild lefthook` |
| ダウンロード失敗 | proxy / npmrc | `pnpm config get registry` で確認 |

## 関連リンク

- 設計: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- 実装ランブック: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-5/runbook.md`
- 実装ガイド: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md`
- 既存 worktree 一括 reinstall タスク: `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md`
