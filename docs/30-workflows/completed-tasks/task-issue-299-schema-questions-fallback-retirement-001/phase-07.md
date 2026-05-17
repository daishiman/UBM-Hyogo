# Phase 7: ACマトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | AC と test/evidence の対応 |

## 目的

Phase 1 AC を Phase 4 test と Phase 6 failure へ接続し、漏れを防ぐ。

## 実行タスク

| AC | 検証 | evidence |
| --- | --- | --- |
| AC-1 | coverage SQL (production / staging) | `outputs/phase-11/coverage-evidence.md` |
| AC-2 | 03a sync log / metric 確認 | `outputs/phase-11/sync-log-evidence.md`（取得不能なら理由記載） |
| AC-3 | T-08 + diff レビュー | `outputs/phase-11/static-guard.md` |
| AC-4 | T-02/T-06 | `outputs/phase-11/test-results.md` |
| AC-5 | T-02/T-03 | `outputs/phase-11/test-results.md` |
| AC-6 | T-07 | `outputs/phase-11/static-guard.md` |
| AC-7 | `database-implementation-core.md` diff | `outputs/phase-12/system-spec-update-summary.md` |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 4 | `phase-04.md` | tests |
| Phase 6 | `phase-06.md` | failure cases |

## 実行手順

1. 各 AC に最低 1 つの automated test または static evidence を割り当てる。
2. AC-1 / AC-2 は read-only D1 / log query で evidence 化（手動）。
3. uncovered AC があれば Phase 4 に戻す。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| AC coverage | 100% |
| failure coverage | F-01 / F-02 / F-03 を scope 内で 100% |

## 多角的チェック観点（AIが判断）

- AC-1 と AC-2 を「同じ coverage evidence」で兼用していないか（D1 query と sync log は別 evidence）。
- AC-7 の更新差分が `documentation-changelog.md` にも記録されるか。

## サブタスク管理

| サブタスク | 戻り先 |
| --- | --- |
| uncovered AC | Phase 4 |
| 取得不能な log evidence | Phase 6 / Phase 11 で代替手段検討 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| ACマトリクス | `phase-07.md` | coverage table |

## 完了条件

- [ ] AC coverage 100%
- [ ] evidence path が Phase 11 / Phase 12 に引き継げる
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] uncovered AC がない

## 次Phase

Phase 8: DRY/責務確認
