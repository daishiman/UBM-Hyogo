# Skill Feedback Report

## テンプレ改善

CLOSED issue を Refs として扱う spec 化パターン（state を変えず、PR body にも `Refs #<n>` のみを書く運用）は既存の `task-specification-creator` Phase 1 メタ情報セクションで吸収可能。本ワークフローは applied example として記録する。

| Routing | Decision |
| --- | --- |
| promotion target | `task-specification-creator` Phase 1 メタ情報セクション |
| decision | no same-wave skill edit |
| reason | 既存の Phase 1 spec template は `issue_number` / `state` フィールドを許容し、`Refs` 運用も既存 lessons でカバー済み。本タスクは applied example であり、新規 structural rule ではない |
| evidence path | `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-01.md`（1.1 セクション） |

## ワークフロー改善

Markdown SSOT（表組み形式）を CI lint で扱う際の正規表現抽出パターン（行 anchor + セル抽出 + 内部一致検証）は、後続の similar drift-lint タスク（例: design tokens drift, env var drift）で再利用可能な汎用構造。

| Routing | Decision |
| --- | --- |
| promotion target | `task-specification-creator` references / future patterns-lessons |
| decision | no same-wave skill edit |
| reason | 単一事例で promote するには時期尚早。後続で 2 例目（design tokens / env var 等）が出現した段階で patterns-lessons に汎化する。本タスクは applied example として skill-feedback-report に記録 |
| evidence path | `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-03.md` / `phase-05.md` |

## ドキュメント改善

「任意 source の動的拡張（不在時 2-source / 出現時 3-source）」設計は、Codecov 等の SaaS 導入意思決定タスクとの結合を切り離す重要パターン。Issue #255 のように「将来導入が確定していないが drift gate は欲しい」ケースに有効。

| Routing | Decision |
| --- | --- |
| promotion target | `aiworkflow-requirements` artifact inventory / task-workflow-active |
| decision | captured in same-wave artifact inventory |
| reason | focused Vitest で 2-source / optional codecov 3-source / drift / parse failure を裏取り済み。単一事例のため独立 lessons ではなく workflow artifact inventory と task-workflow-active に集約する |
| evidence path | `docs/30-workflows/issue-255-coverage-threshold-sync-lint/phase-03.md` 3.4 / phase-09.md 9.2 |

## Skill 編集サマリ

| skill | this-wave edit | rationale |
| --- | --- | --- |
| `task-specification-creator` | none | 既存の strict 7 / 9 canonical heading / NON_VISUAL Phase 11 evidence inventory / Refs 運用が本 workflow を吸収できる |
| `aiworkflow-requirements` | references/indexes/changelog/logs | SSOT (quality-requirements-advanced.md) は read-only のまま、workflow ledger と artifact inventory を同一 wave で同期 |
| `github-issue-manager` | none | Issue #255 は CLOSED 維持 / Refs 運用で完結。state 変更 API mutation は行わない |
