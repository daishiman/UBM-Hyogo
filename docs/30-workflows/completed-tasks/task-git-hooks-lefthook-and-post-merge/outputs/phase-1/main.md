# Phase 1 — 要件定義

## Status

completed

## タスク分類（task-specification-creator フロー）

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow | implementation |
| docsOnly | false |
| owner | platform / devex |
| domain | devex / repository hygiene |

> 本タスクはコード変更を伴う implementation / NON_VISUAL タスク。UI 変更はなく、検証は CLI gate と smoke log で行う。

## 真の論点（system thinking）

| 観点 | 内容 |
| --- | --- |
| 主問題 | Git hook 層が `.git/hooks/` に直書きされたシェルスクリプトに分散しており、worktree ごとの再現性・レビュー性・運用ガバナンスが破綻している。さらに `post-merge` が `aiworkflow-requirements/indexes/*.json` を強制的に再生成し、ブランチに無関係な差分を恒常的に発生させている。 |
| Why now | (1) post-merge 由来の不要 diff が直近 PR (#125, #127) で実際に検出されている、(2) lefthook を導入する周辺タスク（task-conflict-prevention-skill-state-redesign）と整合させる必要がある、(3) worktree 並列開発が常態化し hook の手動配布コストが高い。 |
| Why this way | lefthook は `lefthook.yml` 一本で hook 群を宣言的に管理でき、`lefthook install` で worktree ごとの hook 再配置を保証できる。Husky と比較して Node 非依存で zsh/bash 双方で安定動作。 |

## スコープ

### 含む

1. 既存 `.git/hooks/{pre-commit, post-merge}` を等価以上の機能で `lefthook.yml` に移植する設計。
2. post-merge での `indexes/*.json` 自動再生成を停止する判定ルール（`merge=ours` ベース、もしくはオプトイン化）。
3. 既存 worktree (`git worktree list` 上 30+ 件) への lefthook 再インストール手順。
4. CI（GitHub Actions）と lefthook の責務分離（lefthook はローカル品質ゲート、CI は authoritative ゲート）。
5. `scripts/new-worktree.sh` への `lefthook install` 追加設計。

### 含まない

- 実コードの変更（`lefthook.yml` 作成、`scripts/` 修正、hook 削除はすべて後続 `feat/*` タスクで実施）。
- husky への移行検討（採用しない方針はここで固定）。
- CI ワークフロー (`.github/workflows/*.yml`) の再設計。

## 既存資産インベントリ

| パス | 種類 | 現状 | 移行方針 |
| --- | --- | --- | --- |
| `.git/hooks/pre-commit` | shell | ブランチ無関係なタスクディレクトリ混入チェック | lefthook `pre-commit` lane に移植（`run` で同スクリプトを呼ぶ薄ラッパー） |
| `.git/hooks/post-merge` | shell | `indexes/*.json` 再生成 + 遅れ worktree 通知 | **再生成は廃止**。通知のみを lefthook `post-merge` に残す |
| `scripts/new-worktree.sh` | shell | worktree 作成 + `pnpm install` | 末尾に `lefthook install` を追加（設計のみ） |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | node | indexes 再生成本体 | 維持。post-merge から呼ばない方針に変更 |
| `package.json` | json | `lefthook` 依存なし | `devDependencies` に `lefthook` 追加（後続タスク） |

## 受入条件（Acceptance Criteria）

1. `lefthook.yml` 設計案が `outputs/phase-2/design.md` に記述されている。
2. 既存2 supported hook の機能が lefthook 設計上 1 対 1 で対応付けされている（trace matrix）。
3. post-merge での indexes 再生成を停止する根拠（merge=ours 戦略との整合）が明記されている。
4. 既存 30+ worktree の hook 再インストール手順が runbook 化されている（Phase 5 で詳細化）。
5. NON_VISUAL タスクのため screenshot / 視覚証跡を要求しない。
6. ユーザー承認なしの commit / push / PR 作成を行わない。

## 制約・前提

- 命名規則: 既存 shell スクリプトは kebab-case。lefthook commands は snake_case ではなく `lower-with-dash` を採用（lefthook 標準）。
- Node 依存: lefthook 自体は Go バイナリ。hook 内で node を呼ぶときは `mise exec --` 経由を必須とする。
- `.env` / op 参照: hook 内で 1Password 参照は不要（cf.sh は別系統）。
- 横断依存順序: `task-conflict-prevention-skill-state-redesign` → 本タスク → `task-worktree-environment-isolation`。

## 既存命名規則の分析

| 階層 | 命名 | 例 |
| --- | --- | --- |
| shell script | kebab-case | `new-worktree.sh`, `wt-health-check.sh` |
| node script | kebab-case | `generate-index.js`, `verify-all-specs.js` |
| lefthook commands key | kebab-case | `staged-task-dir-guard`, `stale-worktree-notice` |

## 統合テスト連携

implementation / NON_VISUAL のため、UI 統合テストは実行しない。本タスクでは以下を CLI で検証する:

- `lefthook run pre-commit` の dry-run が既存 hook と同一の挙動を示す。
- post-merge 実行後に `git status` が clean のまま（indexes 再生成 diff が出ない）。
- `scripts/new-worktree.sh` 実行直後に `.git/worktrees/<name>/hooks/post-merge` 等が lefthook 経由で配置される。

## 完了条件チェック

- [x] taskType / visualEvidence / workflow を確定
- [x] スコープと非スコープを分離
- [x] 既存資産インベントリを作成
- [x] 受入条件を 4 件以上明文化
- [x] 横断依存と命名規則を確認
