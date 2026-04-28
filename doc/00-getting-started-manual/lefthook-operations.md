# lefthook 運用ガイド

UBM 兵庫支部会の Git hook は **lefthook** に統一されている。本ガイドは日常運用と
トラブルシューティングをまとめる。設計の正本は
`docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` 。

## 構成ファイル

| パス | 役割 |
| --- | --- |
| `lefthook.yml` | hook 定義の正本（pre-commit / post-merge） |
| `scripts/hooks/staged-task-dir-guard.sh` | pre-commit: ブランチと無関係なタスクディレクトリの混入阻止 |
| `scripts/hooks/stale-worktree-notice.sh` | post-merge: 遅延 worktree の通知（read-only） |
| `package.json` `prepare` | `pnpm install` 時に `lefthook install` を起動 |
| `package.json` `indexes:rebuild` | skill indexes の明示再生成コマンド |
| `lefthook-local.yml` | 開発者個別 override（`.gitignore` 対象） |

## 初回セットアップ / 既存 worktree への適用

```bash
# clone / 新規 worktree 直後
mise exec -- pnpm install
# → prepare script が lefthook install を実行し、.git/hooks/* を上書き配置

# 既に作業中の worktree への一括適用（実装担当者向け runbook）
git worktree list --porcelain | awk '/^worktree /{print $2}' | while read -r wt; do
  test -d "$wt" || continue
  ( cd "$wt" && mise exec -- pnpm install --prefer-offline )
done
```

> 並列実行は禁止（pnpm store の同時書き込みで壊れる）。逐次で回す。

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
`verify-indexes-up-to-date` job を新設して古い indexes での PR を検出する。
この CI gate は `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md`
で正式な未タスクとして管理する。

## トラブルシューティング

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| hook が動かない | `pnpm install` 未実行 | `mise exec -- pnpm install` を必ず実行 |
| `.git/hooks/post-merge` が lefthook 由来でない | 既存 worktree に旧 hook 残存 | 当該 worktree で `pnpm install` を再実行 |
| Apple Silicon でバイナリ起動失敗 | arch 不一致 | `pnpm rebuild lefthook` |
| ダウンロード失敗 | proxy / npmrc | `pnpm config get registry` で確認 |

## 関連リンク

- 設計: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- 実装ランブック: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-5/runbook.md`
- 実装ガイド: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/implementation-guide.md`
