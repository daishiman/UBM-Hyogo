# Phase 12: 実装ガイド（Implementation Guide）

## Phase 12 strict outputs

`outputs/phase-12/` に `main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` の 7 ファイルを作成し、root `artifacts.json` を唯一正本として同期する。

## 中学生レベルの概念説明

**ブランチ**は「作業のレーン」。今までは個人作業のレーン（`feature/*`）から本番のレーン（`main`）に直接合流していた。これを変えて、**「練習用本番レーン（`dev`）」**を間に置く。

- `feature/*` レーン: 個人の試作
- `dev` レーン: 試作を組み合わせて「本番に近いステージング環境」で動かす場所
- `main` レーン: お客さんが見る本番環境

`dev` に変更を入れると、自動で staging 環境にデプロイされる。`main` に入ると本番にデプロイされる。これにより本番に出す前に「`dev` で動くか」を必ず確認できる。

## 実装ステップ（完了済タスクと残タスク）

### 完了済（本ブランチで実施）

1. ✅ `feat/branch-flow-dev-sync` ブランチ作成
2. ✅ `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` 削除を staged commit に確定
3. ✅ `origin/dev` を `origin/main` に force-push 同期（branch protection 緩和→復元含む）
4. ✅ `scripts/new-worktree.sh` を `origin/dev` 起点に変更
5. ✅ `CLAUDE.md` PR作成フローを `dev` ターゲット記述に更新
6. ✅ `.claude/commands/ai/diff-to-pr.md` を `origin/dev` / `--base dev` に更新
7. ✅ 本タスク仕様書（Phase 1-13）作成

### 明示的な範囲外（未タスク化しない）

- 全 `gh pr create` 呼び出し箇所の網羅置換: 今回の正本は `CLAUDE.md` と `.claude/commands/ai/diff-to-pr.md`。追加 command は検出時に同じ正本へ追従する。
- `dev → main` 昇格 PR の運用ルール詳細化: `CLAUDE.md` に最小境界を記載済。リリースタグ運用は production release タスクの責務。
- 既存 open PR の base 一括切替: GitHub 上の既存 PR 操作であり、ユーザー承認なしに変更しない。

## DoD チェック

| 項目 | 確認 |
|------|-----|
| origin/dev == origin/main | ✅（force-push 完了） |
| scripts/new-worktree.sh が origin/dev 起点 | ✅ |
| CLAUDE.md が dev ターゲット | ✅ |
| diff-to-pr.md が `--base dev` | ✅ |
| 本仕様書 Phase 1-13 完了 | ✅ |
| ut-05a-* 削除 staged | ✅ |
| Phase 12 strict 7 files | ✅ |
| aiworkflow-requirements same-wave sync | ✅ |

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 12 strict close-out と正本同期を完了する。

## 実行タスク

7 成果物、artifacts parity、aiworkflow-requirements same-wave sync を揃える。

## 参照資料

`outputs/phase-12/`、aiworkflow-requirements indexes / references。

## 成果物

Phase 12 strict 7 files。

## 完了条件

compliance check が PASS で、Phase 13 gate が分離されている。
