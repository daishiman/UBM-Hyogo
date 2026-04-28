# Phase 7: カバレッジレポート

## 1. AC カバレッジ

| AC | カバー状況 | 一次証跡 | 二次証跡 | 備考 |
| --- | --- | --- | --- | --- |
| AC-1 | DOC | Phase 5 deploy-execution-log.md | Phase 11 smoke-test-result.md (S-01) | 実値 TBD |
| AC-2 | DOC | Phase 5 deploy-execution-log.md | Phase 11 smoke-test-result.md (S-02) | 実値 TBD |
| AC-3 | DOC | Phase 5 migration-apply-record.md | — | 実値 TBD |
| AC-4 | DOC | Phase 5 deploy-execution-log.md | Phase 11 smoke-test-result.md (S-03) | 実値 TBD |
| AC-5 | DOC | Phase 11 smoke-test-result.md | — | S-01〜S-10 |
| AC-6 | DOC | Phase 5 deploy-execution-log.md | — | テンプレ整備済 |
| AC-7 | DOC | Phase 5 d1-backup-evidence.md | バックアップ本体 | 実値 TBD |
| AC-8 | DONE | Phase 2 rollback-runbook.md | Phase 6 abnormal-case-matrix.md / rollback-rehearsal-result.md | 机上確認完了 |

> DOC = ドキュメント整備のみ完了、実コマンド未発火。実行時に DOC → DONE に更新。

## 2. 上流 dependency edge カバレッジ

| 上流 | 提供物 | カバー Phase | 状態 |
| --- | --- | --- | --- |
| 02-serial | mise / pnpm 環境 | Phase 4 verify | DOC PASS |
| 03-serial | D1 runbook | Phase 2 / 5 | DOC PASS |
| 04-serial | Secrets 配置 | Phase 4 / 9 | DOC PASS |
| 05b-parallel | readiness checklist | Phase 4 / 11 | DOC PASS |

## 3. 異常系カバレッジ

| カテゴリ | シナリオ数 | 対応参照 |
| --- | --- | --- |
| 認証・binding | 2 (A-1 / A-2) | rollback-runbook §1 |
| D1 | 2 (A-3 / A-11) | rollback-runbook §2 |
| Workers | 2 (A-4 / A-5) | rollback-runbook §1 |
| smoke FAIL | 3 (A-6 / A-7 / A-8) | rollback-runbook §1 §2 |
| 運用 | 2 (A-9 / A-10) | rollback-runbook §4 |
| 準備不足 | 1 (A-12) | リハーサル必須化 |

## 4. ギャップと是正

| ギャップ | 影響 | 是正 |
| --- | --- | --- |
| 実コマンド未発火 (docs-only) | AC-1〜AC-7 が DOC 状態 | 実行時に Phase 5/11 で DONE 化 |
| staging リハーサル未実施 | A-3 / W-1 / D-1 の実機確認なし | 実行時に Phase 6 リハーサル実施 |
| OpenNext Workers 形式整合 | apps/web が Pages 形式のまま | Phase 12 unassigned-task-detection.md に別タスクとして記録 |

## 5. カバレッジ判定

- ドキュメントレベル: 100% カバー
- 実機レベル: 0% (docs-only モードのため意図的)
- 実行時 GO 判定の前提: Phase 4 verify suite + Phase 6 リハーサルで実機カバレッジを補完
