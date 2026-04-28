# Phase 2 — 設計

## Status

completed

## 設計サマリ

Phase 1 で固定したスコープを満たすため、`lefthook.yml` を 1 ファイル正本とし、既存 2 supported hook をそれぞれ lefthook lane へ移植する。post-merge から `indexes/*.json` 再生成を切り離し、明示的なオプトインコマンド (`pnpm indexes:rebuild`) に分離する。

## トポロジ

```
.git/hooks/  ← lefthook が install 時に自動配置（手動編集禁止）
   ├─ pre-commit  → lefthook → lefthook.yml :: pre-commit
   ├─ post-merge  → lefthook → lefthook.yml :: post-merge

lefthook.yml  ← 正本（リポジトリにコミット）
   ├─ pre-commit:  staged-task-dir-guard
   ├─ post-merge:  stale-worktree-notice

scripts/hooks/
   ├─ staged-task-dir-guard.sh  ← 旧 .git/hooks/pre-commit を移植
   └─ stale-worktree-notice.sh  ← 旧 post-merge から共通化

scripts/new-worktree.sh  ← 末尾に `lefthook install` 追加
```

> **重要**: `.git/hooks/` は lefthook が管理する。リポジトリ側で `.git/hooks/*` を直接編集する運用は廃止する。

## 詳細

`outputs/phase-2/design.md` に以下を記述:

- `lefthook.yml` の完全案（全 supported lane と commands）
- 旧 hook → 新 lane の trace matrix
- post-merge regeneration 廃止の根拠
- 既存 worktree への再インストール手順骨子
- `package.json` 変更案

## レビューゲート（Phase 3 前提）

- [x] lefthook.yml 全 supported lane が定義済み
- [x] trace matrix が全旧 hook を網羅
- [x] post-merge 再生成廃止の合意点が示されている
- [x] CI と lefthook の責務分離が明記されている
