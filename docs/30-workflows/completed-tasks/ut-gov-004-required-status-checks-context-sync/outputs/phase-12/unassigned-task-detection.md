# unassigned-task-detection.md

## 検出方針

本タスク (UT-GOV-004) 実行中に発見された「対応すると問題が生じる恐れがあるが、現時点で本タスクのスコープ外」の項目を未タスクとして列挙する。

## 検出された未タスク

### 1. UT-GOV-005 — 4 つの除外 context の workflow 新設

- **内容**: `unit-test` / `integration-test` / `security-scan` / `docs-link-check` の workflow 新規追加
- **理由**: 本タスクのスコープ「含まない: 新規 CI job / workflow の追加実装」に該当
- **影響**: 投入されないと branch protection の status check 機能が 3 件のみで運用される
- **既存の登録**: `index.md` の関連タスクとして UT-GOV-005 を参照済み。新規発行は不要だが、実装時は global `docs/30-workflows/unassigned-task/` または completed-task 側の正本パスを再確認する。

### 2. UT-GOV-007 — workflow `name:` 変更検出 CI の追加

- **内容**: PR diff で `^name:` 行の変更を検出して経路 A（同一 PR）を強制する CI
- **理由**: 名前変更事故の自動検出は本タスクの「設計 + ドキュメント化」スコープを越える実装作業
- **影響**: 経路 A は人手の運用ルールとして文書化されているが、自動 enforcement は未整備
- **既存の登録**: `index.md` の関連タスクとして UT-GOV-007 を参照済み。新規発行は不要だが、CI 実装着手時に正本パスを再確認する。

### 3. lefthook pre-push hook の追加

- **内容**: `outputs/phase-08/lefthook-ci-mapping.md` の「推奨追加 pre-push」4 件
- **理由**: hook 実装は `task-git-hooks-lefthook-and-post-merge` の責務
- **影響**: 推奨レベルのため未実装でも CI 側で必ず検証される
- **既存の登録**: `artifacts.json` の related に `task-git-hooks-lefthook-and-post-merge` を記録済み。新規発行不要。

## 新規未タスク発行が必要なもの

なし。すべての未タスクは既存タスクで吸収可能。

## 検出ルール（本タスクで使用）

- スコープ「含まない」に明記された項目はスコープ外
- 既存 UT-GOV-001 / UT-GOV-005 / UT-GOV-006 / UT-GOV-007 / task-git-hooks-lefthook-and-post-merge へ責務移譲できるものは新規発行しない
- アプリ層 (`apps/`, `packages/`) への変更が必要な場合は別タスクとして分離（本タスクでは発生せず）
