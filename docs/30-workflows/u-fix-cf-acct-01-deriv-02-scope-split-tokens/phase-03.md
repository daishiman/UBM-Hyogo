# Phase 3: 設計レビューゲート

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-3/phase-3.md` |

## 目的
Phase 2 設計の妥当性レビュー（scope 過不足・job 分割順序・rollback の独立性）を実施し、実装着手の最終承認を得る。

## 参照資料
- `outputs/phase-3/phase-3.md`
- `outputs/phase-2/`

## 成果物
- `outputs/phase-3/phase-3.md`
- `outputs/phase-3/review-checklist.md`

## 完了条件
- 5 観点（最小 scope / job 順序 / rollback 独立 / failure mode 切り分け / オペコスト）レビューが PASS。

## 実行タスク
- [ ] scope 過不足、現行 workflow 整合、rollback 独立性をレビューする。

## 統合テスト連携
- 統合テストは Phase 5 以降の local shell smoke と Phase 11 GHA run evidence で代替する。
