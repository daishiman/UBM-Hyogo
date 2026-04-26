# Phase 12 / unassigned-task-detection.md — 未タスク検出結果

## サマリ

本タスクで unassigned（別 task として起票しない、本タスクスコープ外の継続観察項目）として記録するもの。新規タスク起票は行わない（[Feedback unassigned-task-guidelines]）。

## 検出件数: 5 件（HIGH 1 / MEDIUM 1 / MINOR 3）

| ID | 内容 | 重大度 | 起票しない理由 | 引き継ぎ先 |
| --- | --- | --- | --- | --- |
| U-01 | 仕様書本文の表記揺れ軽微残存 | MINOR | docs-only / 次回 spec sync で吸収可能 | Phase 12 / 将来の docs PR |
| U-02 | runbook の細則追記候補（observability metrics 詳細） | MINOR | 運用開始後の実測値で更新する方が妥当 | 05a-observability-and-cost-guardrails |
| U-03 | sync constants 最終チューニング（batch / retry / timeout） | MINOR | 実トラフィック観測後に決定する性質 | 05a-observability-and-cost-guardrails |
| U-04 | Sheets -> D1 sync implementation formalize | HIGH | 本タスクは contract-only / docs-only。`apps/api/src/sync/*`、manual endpoint、scheduled handler、audit writer は後続実装として切り出す方が安全 | 04-cicd-secrets / 05b-smoke-readiness 前の実装タスク |
| U-05 | D1 migration SQL 実体作成 | MEDIUM | 本タスクは migration contract を確定したが `apps/api/migrations/0001_init.sql` は未作成。DB適用タイミングは Cloudflare権限と連動するため後続へ委譲 | 04-cicd-secrets-and-environment-sync |

## 別タスク起票しない判断根拠

- U-01〜U-03 は MINOR で、本タスクの AC-1〜AC-5 / 不変条件 1〜7 / gate=PASS には影響しない
- U-04〜U-05 は実装タスクとして重要だが、対応すると docs-only contract task の境界を超えるため、ここでは正式な未タスク候補として明示する
- 既存の downstream タスク（04 / 05a / 05b）スコープに自然に接続できる

## 0 件ではない理由（本ファイルが空でない理由）

Phase 10 で MINOR 指摘 3 件を記録済み。30種思考法レビューで contract-only と implementation の境界漏れを検出したため、U-04 / U-05 を追加して管理上の所在を明確化。

## 指示書配置済み（HIGH / MEDIUM）

HIGH / MEDIUM の未タスクは `docs/30-workflows/unassigned-task/` に独立指示書として昇格済み（task-specification-creator skill の `unassigned-task-guidelines` 準拠）:

| ID | 重大度 | 指示書パス |
| --- | --- | --- |
| U-04 | HIGH | [docs/30-workflows/unassigned-task/U-04-sheets-to-d1-sync-implementation.md](../../../../../docs/30-workflows/unassigned-task/U-04-sheets-to-d1-sync-implementation.md) |
| U-05 | MEDIUM | [docs/30-workflows/unassigned-task/U-05-d1-migration-sql-creation.md](../../../../../docs/30-workflows/unassigned-task/U-05-d1-migration-sql-creation.md) |

U-01〜U-03 は MINOR のため指示書化を行わず、本ファイルおよび downstream タスクスコープでの吸収とする。

## 完了条件

- [x] 未タスク項目を列挙（0 件でも明示）
- [x] 起票しない理由を明記
- [x] 引き継ぎ先を割当
- [x] HIGH / MEDIUM は `docs/30-workflows/unassigned-task/` に指示書を配置済み
