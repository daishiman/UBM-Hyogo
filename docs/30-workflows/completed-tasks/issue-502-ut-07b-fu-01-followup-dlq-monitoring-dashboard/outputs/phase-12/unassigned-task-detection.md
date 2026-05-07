# Unassigned Task Detection — Issue #502

> 0 件出力必須 / 4 パターン照合表必須

## 検出結果

**追加未タスクなし。**

DLQ 監視 runbook 整備の結果、追加未タスクは検出されなかった。Pager / 通知基盤（Slack / PagerDuty 等）の自動化、しきい値の自動調整、CPU budget 監視 dashboard 化は **本仕様書 scope 外（「含まない」節に明記）** であり、本 follow-up の責務ではない。現時点で実装必須の漏れではないため、未タスク昇格しない。

## 4 パターン照合表（0 件根拠）

| # | パターン | 該当 | 根拠 |
| --- | --- | --- | --- |
| 1 | 型定義 → 実装の乖離 | **非該当** | 本タスクはコード変更ゼロ（docs-only）。既存 `apps/api/src/repository/schemaDiffQueue.ts` の型は無変更、新規型定義なし |
| 2 | 契約 → テストの乖離 | **非該当** | API contract 変更なし。テスト追加なし（CONST_004 例外）。既存テスト（`schemaDiffQueue.test.ts` 等）の修正もなし |
| 3 | UI → component の乖離 | **非該当** | NON_VISUAL（UI/UX 変更なし） |
| 4 | 仕様間差異 → 設計決定の不在 | **非該当** | runbook 本体（`docs/runbooks/dlq-monitoring/schema-alias-backfill.md`）と skill references（`dlq-monitoring.md`）が同一しきい値・同一 binding 名・同一列名・同一 SQL を相互参照（AC-8 逆引き経路一致） |

## 観察事項のみ（**未タスク昇格なし** / 将来 follow-up の議論材料）

以下は将来 follow-up の議論材料として記録するが、本タスクで未タスクとして昇格させない。実装が必要になった時点で改めて unassigned task として起票する。

- DLQ 件数の時系列推移を CSV 化する補助スクリプト（dash 履歴のローカル可視化）
- `retry_count` ヒストグラム（特定の `diff_id` への偏り検出）
- `references/monitoring/` サブカテゴリの新設（DLQ 監視 / GHA conclusion / D1 retention の再編）

## CONST_009 適合性

- 本タスクは「今回の実装」で Phase 12 成果物を完了済み（runbook + references + changelog + indexes/正本導線 + Phase 12 strict 7）。Phase 11 の実 D1 SQL / dash runtime evidence は user approval 後の `contract_ready_runtime_pending`
- 別タスク化した項目: なし
- 観察事項として記録した項目（上記 3 件）は scope 外であり、ユーザー承認下で別タスク起票判断する
