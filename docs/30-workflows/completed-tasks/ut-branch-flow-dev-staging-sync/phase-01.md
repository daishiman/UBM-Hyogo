# Phase 1: 要件定義・スコープ確定

## 背景

CLAUDE.md に「`feature/* → dev → main`」と記載されているが、実態は `feature/* → main` で運用されており、`origin/dev` は 636 commits 遅れ・4 commits 進んだ放棄状態。一方、`backend-ci.yml` / `web-cd.yml` は既に `dev → staging`, `main → production` の CD を実装済み。

## 要件

| ID | 要件 | 受け入れ基準 |
|----|------|-------------|
| R1 | `origin/dev` を `origin/main` と同期 | `git rev-parse origin/dev == origin/main` |
| R2 | feature ブランチが `dev` から生成される | `scripts/new-worktree.sh` が `origin/dev` 起点 |
| R3 | PR 作成自動フローが `dev` ターゲット | `CLAUDE.md` / `diff-to-pr.md` が `dev` を参照 |
| R4 | dev push で staging 自動デプロイ | `backend-ci` / `web-cd` の `deploy-staging` job が success |
| R5 | main push で production 自動デプロイ | 既存 workflow を維持 |
| R6 | 既存コミット済 ut-05a-* 削除を確定 | `git status` clean |
| R7 | Phase 12 strict outputs と正本同期 | `outputs/phase-12/` 7ファイル、artifact inventory、task-workflow、quick-reference、resource-map、LOGS/changelog が同一 wave で存在 |

## 除外

- production cutover（dev → main 昇格 PR）は別タスク
- branch protection の rule 変更（dev は force-push 不可、main も同様の現状維持）
- commit / push / PR 作成（ユーザー明示指示後）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

feature → dev → main flow の要件を確定する。

## 実行タスク

要件 R1〜R7 を満たす。

## 参照資料

`CLAUDE.md`、`references/deployment-branch-strategy.md`。

## 成果物

本 Phase 文書。

## 完了条件

要件と除外が明文化されている。

## 統合テスト連携

NON_VISUAL。Phase 11 の shell / grep evidence へ接続する。
