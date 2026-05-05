# Phase 3 — 設計レビュー

## Alternative 評価

| 案 | 判定 | 評価 |
|---|---|---|
| **単一 PR / 単一コミット** | **PASS（採用）** | 14 ファイルを一括置換。layer 依存（repository → use-case → view-model → route）の整合を 1 commit で取れる。focused test もまとめて 1 回で確認できる。solo dev 運用に最適。 |
| family 分割 PR | MINOR | 7 PR に分割可能だが、7 件 PR/review/CI のオーバーヘッドが solo 運用に対して過大。最終 strict gate 昇格までを 1 PR でまとめる本案が合理的。 |
| 段階的 strict count 削減（per-family commit） | MINOR | 同 PR 内で commit 単位を分割する案。個別 commit で部分的な strict 数値を残せるが、最終 PASS 状態でのみ意味があり、blame の追跡コストが増える。本タスクでは単一 commit を採用。 |

## 採用判断
**単一 PR / 単一コミット**。理由は solo 開発 + 機械的な置換 + 全体での AC 検証が必要なため。
