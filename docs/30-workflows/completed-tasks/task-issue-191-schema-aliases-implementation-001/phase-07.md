# Phase 7: ACマトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | AC と test/evidence の対応 |

## 目的

Phase 1 AC を Phase 4/6 の検証へ接続し、漏れを防ぐ。

## 実行タスク

| AC | 検証 | evidence |
| --- | --- | --- |
| AC-1 | T-01 | migration apply + PRAGMA |
| AC-2 | T-02 | repository contract |
| AC-3 | T-03/T-04 | route contract |
| AC-4 | T-03/F-04 | transaction/batch test |
| AC-5 | T-08 | static guard |
| AC-6 | T-05/T-06 | sync tests |
| AC-7 | T-07/F-05 | transient failure test |
| AC-8 | T-02/T-05/T-06/T-07 | regression suite |
| AC-9 | T-09 | route auth/audit evidence |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 4 | `phase-04.md` | tests |
| Phase 6 | `phase-06.md` | failure cases |

## 実行手順

1. 各 AC に最低 1 つの automated test または static evidence を割り当てる。
2. automated test が不可の場合は、Phase 11 NON_VISUAL evidence の具体コマンドを割り当てる。
3. uncovered AC があれば Phase 4 に戻す。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| AC coverage | 100% |
| failure coverage | F-01 から F-07 のうち scope 内 100% |

## 多角的チェック観点（AIが判断）

- AC-5 の static guard が実行経路を十分に検出できるか。
- duplicate alias と collision の用語が混ざっていないか。

## サブタスク管理

| サブタスク | 戻り先 |
| --- | --- |
| uncovered AC | Phase 4 |
| ambiguous error mapping | Phase 6 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| ACマトリクス | `phase-07.md` | coverage table |

## 完了条件

- [ ] AC coverage 100%
- [ ] evidence path が Phase 11 に引き継げる
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] uncovered AC がない

## 次Phase

Phase 8: DRY/責務確認
