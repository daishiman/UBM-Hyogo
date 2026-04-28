# Documentation Changelog — task-worktree-environment-isolation

本タスクの完了に伴い、リポジトリ各所の文書に発生する変更案と、同 wave で反映済みの system spec 更新を一覧化する。

---

## 1. CLAUDE.md の追記項目

**対象セクション**: 「ワークツリー作成（新機能開発の開始）」（既存節）

### 1.1 追記内容（差分案）

```diff
 ## ワークツリー作成（新機能開発の開始）

 ```bash
 # 推奨: スクリプトで一括セットアップ（main同期 + pnpm install まで自動実行）
 bash scripts/new-worktree.sh feat/my-feature
 ```

+> **環境分離（worktree-environment-isolation）**:
+> 並列開発時の混線防止仕様は
+> `docs/30-workflows/task-worktree-environment-isolation/` を参照。
+> 主要ポイント:
+> - 同名ブランチ並列作成は lock により後発が即時失敗する（exit 75）
+> - tmux は session-scoped env のみ使用（global env は使わない）
+> - `.claude/skills/` 配下の symlink は禁止（実体配置 or グローバル単独）
+> - 入場時に `unset OP_SERVICE_ACCOUNT_TOKEN; hash -r; mise install` を実行
+
 > **⚠️ 重要: Claude Code は必ずワークツリーディレクトリから起動すること**
```

### 1.2 反映条件

- `CLAUDE.md` 本体への追記は後続実装タスクで実施する。
- 本 Phase では追記内容と挿入位置を確定し、aiworkflow-requirements references には環境分離仕様を反映済み。

---

## 2. `scripts/new-worktree.sh` への変更コメント

実コード変更は本タスク外（後続実装タスク）。本 Phase では変更点とコメントの形式を確定する。

### 2.1 追加されるコメントブロック（実装時テンプレ）

```bash
# --- gwt-auto lock (task-worktree-environment-isolation D-3) ---
# 同一ブランチ並列作成を防ぐため mkdir lockdir で排他取得。
# macOS 標準は util-linux 不在のため mkdir 経路を自動選択。
# 仕様: docs/30-workflows/task-worktree-environment-isolation/outputs/phase-2/design.md §3
# ----------------------------------------------------------------
```

```bash
# --- shell state reset (task-worktree-environment-isolation D-4) ---
# 親シェルからの OP_SERVICE_ACCOUNT_TOKEN 漏れと PATH キャッシュ汚染を排除。
# ----------------------------------------------------------------
unset OP_SERVICE_ACCOUNT_TOKEN
hash -r
```

### 2.2 変更箇所サマリ

`outputs/phase-12/implementation-guide.md` §2.3 の表を正本とする。本ファイルでは **コメント文言** のみ固定。

---

## 3. 関連タスク仕様書への相互参照追加

### 3.1 `task-conflict-prevention-skill-state-redesign`（上位）

| 追加先 | 追加内容 |
| --- | --- |
| 同タスクの `outputs/phase-12/main.md`（または `documentation-changelog.md`） | 本タスクが skill 側 state 設計を引き継いで「worktree 側 symlink 撤去」を担当する旨を相互リンクで記載 |

### 3.2 `task-git-hooks-lefthook-and-post-merge`（横断）

| 追加先 | 追加内容 |
| --- | --- |
| 同タスクの未着手 hook 候補リスト | 「`.claude/skills/` 配下の symlink を pre-commit で検出」を正式申し送り（[`unassigned-task-detection.md`](./unassigned-task-detection.md) §1 参照） |

### 3.3 `task-claude-code-permissions-decisive-mode`（後段）

| 追加先 | 追加内容 |
| --- | --- |
| 同タスクの環境変数取り扱い節 | 親シェル `OP_SERVICE_ACCOUNT_TOKEN` の unset 推奨は permissions タスクの正式仕様化に統合（Phase 3 §4 申し送り） |

---

## 4. 変更履歴（本タスク内）

| 日付 | 変更 | 影響 |
| --- | --- | --- |
| 2026-04-28 | task-worktree-environment-isolation を docs-only / NON_VISUAL / spec_created で正規化 | Phase 1〜13 仕様書群を作成 |
| 2026-04-28 | Phase 12 で 7 成果物を確定 | CLAUDE.md / `scripts/new-worktree.sh` への追記指示を確定し、aiworkflow-requirements references は同 wave で反映 |

---

## 5. 反映スケジュール

| ステップ | 対応 PR | 対象 |
| --- | --- | --- |
| 1 | 本タスク完了 PR（Phase 13 承認後） | docs/30-workflows/task-worktree-environment-isolation/ |
| 2 | 後続: `scripts/new-worktree.sh` 改修 PR | スクリプト本体 + CLAUDE.md 追記 |
| 3 | 後続: lefthook hook 追加 PR | `task-git-hooks-lefthook-and-post-merge` 配下 |
