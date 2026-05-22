# Phase 3: モジュール設計（変更ファイル俯瞰）

## 変更対象ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `scripts/new-worktree.sh` | 編集 | `git fetch origin main` → `dev`、`git worktree add ... origin/main` → `origin/dev` |
| `CLAUDE.md` | 編集 | 「PR作成の完全自律フロー」section を `dev` 基点に書換、`dev → main` 昇格 subsection 追加 |
| `.claude/commands/ai/diff-to-pr.md` | 編集 | Phase 0 sync を `origin/dev`、`gh pr create --base main` → `--base dev` |
| `docs/30-workflows/ut-05a-auth-ui-logout-button-001/**` | 削除 | 既存削除を確定 (35 files) |
| `docs/30-workflows/ut-branch-flow-dev-staging-sync/**` | 新規 | 本タスク仕様書 (Phase 1-13) |

## operational アクション（コード差分なし）

| 操作 | 手段 | 影響範囲 |
|------|------|---------|
| `origin/dev` を `origin/main` に force-push | `git push origin origin/main:refs/heads/dev --force` | 既存 dev の独自4 commit 破棄（既に main で上書き済） |
| dev branch protection 一時緩和 | `gh api PUT branches/dev/protection` (allow_force_pushes=true) | force-push 直前のみ |
| dev branch protection 復元 | 同 API (allow_force_pushes=false) | 直後に再ロック |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

変更ファイルと operational action を分解する。

## 実行タスク

変更対象と非コード操作を表で管理する。

## 参照資料

`git diff --stat`、GitHub branch protection evidence。

## 成果物

変更対象ファイル一覧。

## 完了条件

削除・編集・新規ファイルの責務が区別されている。

## 統合テスト連携

Phase 11 の link checklist と deletion boundary に接続する。
