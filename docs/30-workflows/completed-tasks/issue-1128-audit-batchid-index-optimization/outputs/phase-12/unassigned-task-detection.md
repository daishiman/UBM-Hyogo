# 未タスク検出レポート — issue-1128 audit_log batchId index 最適化

workflow_state: `implemented_local_evidence_captured` / 更新日: 2026-06-07 / related issue: #1128（CLOSED 維持）

検出件数（current）: **0 件**。本タスクは migration 1 本 + repository 1 ファイル変更 + test で 1 サイクル完了する
（CONST_007・単一サイクル完了）ため、分割や先送りによる新規未タスクは発生しない。

## current（本サイクルで新規起票すべき未タスク）

**0 件。**

本タスクは `0026` migration（batchId 相関列 + index）+ `auditLog.ts` `listFiltered` の SQL 切替 + test に閉じ、
分割・先送りはしない（CONST_007）。実装後に TODO / FIXME / `.skip` / 未実装分岐が残らないことを確認し、
current 0 件とする。

## baseline（スコープ外候補・記録のみ・本サイクルでは起票しない）

| ID | 候補 | 起票しない理由 |
| --- | --- | --- |
| B-1 | 他 audit JSON payload フィールド（batchId 以外の相関キー）の index 化 | 需要未顕在・YAGNI。本タスクは batchId 単一相関に限定。別の相関キーで full scan が顕在化した時点で別タスクとして検討する |
| B-2 | audit export（`listForExport`）側のクエリ最適化 | 別関心・スコープ外。export は別 index 系統（`idx_audit_log_export`）であり、本タスクの batchId index とは独立。export 側のコスト顕在化は別トリガで判断 |
| B-3 | VIRTUAL → STORED generated column への移行（テーブル再構築） | トリガ未達。行数が極端化し VIRTUAL の都度算出コストが顕在化した場合のみ、テーブル再構築を伴う STORED 化を検討する。現時点では VIRTUAL（方式A）/ plain 列（方式B）で十分であり、再構築コストに見合わない |

> baseline 候補はいずれも「需要未顕在 / 別関心 / トリガ未達」であり、本サイクルでは起票せず記録のみとする。current は 0 件。

## 関連タスク差分確認

- 元 unassigned-task spec `docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md`
  （status: `consumed_by_issue_1128`）は **本タスク（issue-1128）で消費済み**。これは新規起票ではなく既存 spec の消費であり、重複起票は無い。
- 親 workflow `issue-1079-bulk-tag-audit-batch-filter`（baseline B-1 起票元）の performance 改善 follow-up を本タスクが根本解決する。
  重複する未タスクは検出されない。

## 0 件判定ソース（確認した検出ソース）

| ソース | 確認項目 | 結果 |
| --- | --- | --- |
| 元タスク仕様（index.md スコープ「含まない」） | スコープ外として明示された項目 | query surface 変更 / bulk tag write 変更 / deploy・apply は user-gated 委譲。新規未タスク化すべき分割項目なし |
| Phase 3 / Phase 10 レビュー | MINOR 判定の指摘事項 | 該当なし（単一サイクルで AC-1..7 を満たす設計。MINOR 由来の分割項目なし） |
| Phase 11 手動テスト | スコープ外の発見事項・改善提案 | focused D1 test + EXPLAIN QUERY PLAN PASS。追加未タスクなし |
| コードコメント | TODO / FIXME / HACK / XXX | 新規 TODO/FIXME/HACK/XXX なし |
| `describe.skip` ブロック | 旧 testid / 要素名の残存参照 | 該当なし。本タスクは test を同 wave で更新し `.skip` を残していない |

> 検出 0 件は「0 件にしない」ためのこじつけ回避の結果であり、上記ソースを全て確認のうえ単一サイクル完了（CONST_007）と判定した。
