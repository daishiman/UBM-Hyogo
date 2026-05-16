# Phase 10: GO/NO-GO

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | merge readiness decision |

## 目的

Phase 11 evidence 作成前に、廃止条件を満たし fallback 削除が安全に完了したかを判定する。

## 実行タスク

| 判定 | 条件 |
| --- | --- |
| GO | AC coverage 100%、Phase 9 gate G-01〜G-07 全 PASS、NO-GO 0 |
| CONDITIONAL GO | MINOR が Phase 12（unassigned-task）へ明確に分離済み |
| NO-GO | test failure、static guard failure、`updateStableKey` を巻き添え削除、`findStableKeyByQuestionId` シグネチャ変更、Issue #299 を本 PR で close 操作、承認前 push/PR |
| DEFERRED | coverage SQL > 0 が prod / staging のいずれかで発生 → 本 PR から fallback 削除コミットを除外し、`unassigned-task-detection.md` で再判定タイミングを記録 |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 7 | `phase-07.md` | AC matrix |
| Phase 9 | `phase-09.md` | quality gates |

## 実行手順

1. Phase 7 の AC coverage を確認する。
2. Phase 9 の gate 結果を確認する。
3. NO-GO が 1 件でもあれば Phase 5/6/8 へ戻す。
4. DEFERRED の場合は本 PR を「coverage 確認 evidence + 廃止延期理由のみ」の docs-only PR としてユーザーに相談する。
5. GO の場合のみ Phase 11 evidence を完成させる。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| AC coverage | 100% |
| quality gate | G-01〜G-07 PASS |
| coverage SQL | 0 件（prod & staging 両方） |

## 多角的チェック観点（AIが判断）

- Issue #299 を本 PR で close/reopen しようとしていないか。
- `task-issue-191-direct-stable-key-update-guard-001` の scope を取り込んでいないか。

## サブタスク管理

| 判定 | 次 |
| --- | --- |
| GO | Phase 11 |
| CONDITIONAL GO | Phase 11 + Phase 12 unassigned |
| DEFERRED | Phase 12 only（fallback 削除を本 PR から除外） |
| NO-GO | 戻り先 Phase |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| GO/NO-GO | `phase-10.md` | decision gate |

## 完了条件

- [ ] GO/NO-GO/DEFERRED 条件が明確
- [ ] coverage SQL > 0 は DEFERRED として扱い、NO-GO と二重分類しない
- [ ] Phase 11 開始条件が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] NO-GO 0 件であることを確認した

## 次Phase

Phase 11: NON_VISUAL evidence
