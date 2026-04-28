# Skill Feedback Report

## テンプレート改善

- `spec_created` の verification タスク向けテンプレートを追加する。
- unassigned task テンプレートに「条件付き follow-up」「既存 completed-tasks 指示書との関係」を明示する欄を追加する。

## ワークフロー改善

- Phase 7 のカバレッジ表は `covered` / `queued` / `verified` / `blocked_by_followup` を標準語彙にする。
- docs-only でも Phase 12 Step 1-A〜1-C は active/backlog/LOGS/changelog/index を実更新したか確認する。

## ドキュメント改善

- NON_VISUAL の Phase 12 では「サマリ + canonical 詳細成果物」の数え方を明記する。
- runbook は空 repo / missing settings / destructive command mismatch が起きないよう、実行前提コマンドと refusal-only 観測をテンプレート化する。

## skill 定義への即時変更

なし。`task-specification-creator/LOGS.md` に deferred feedback として残し、テンプレート大改修は別タスク化候補とする。
