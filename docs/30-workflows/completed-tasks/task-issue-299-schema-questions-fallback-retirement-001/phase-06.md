# Phase 6: 異常系設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | failure cases |

## 目的

fallback 廃止後に発生し得る挙動変化と、coverage 不足時の安全弁を固定する。

## 実行タスク

| ID | 異常 | 期待 |
| --- | --- | --- |
| F-01 | coverage query で残存件数 > 0 | fallback 削除を実行しない。unresolved を `unassigned-task-detection.md` に記録 |
| F-02 | alias miss / known miss が増加する 03a sync | `stable_key='unknown'` で `schema_diff_queue` に enqueue され、人手 alias 確定の通常フローに乗る（silent 付与なし） |
| F-03 | D1 transient error during alias lookup | `findAliasByQuestionId` の既存エラー伝播経路で sync failure として retry。fallback で誤魔化さない |
| F-04 | 新規 question 流入で alias 未確定 row が増える | T-09 regression と 03a の通常 enqueue 経路で検出。Phase 13 承認直前または承認同日に coverage query を再実行し、継続検知を代替する |
| F-05 | `updateStableKey` 経由の直接書き込みが混入 | `task-issue-191-direct-stable-key-update-guard-001` 範囲。本タスクでは grep 検出のみ（編集しない） |
| F-06 | production と staging で coverage 結果が乖離 | 両方 0 件を必須とする。一方が > 0 件なら F-01 と同様に削除延期 |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| 上流 failure cases | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/phase-06.md` | 既存 F-05/F-06 と整合 |
| Phase 4 | `phase-04.md` | test matrix |

## 実行手順

1. F-01 と F-06 は Phase 5 の coverage step で検出する。
2. F-02 は T-06（`source='unknown'`）と 03a の `forms-schema-sync.ts` enqueue 経路で検証する。
3. F-03 は既存の `findAliasByQuestionId` テスト（schema_aliases repository test）が cover していることを確認する。
4. F-04 / F-05 は本タスクの責務外として明記し、Phase 12 `unassigned-task-detection.md` に既存タスク参照を残す。

## 統合テスト連携

| 異常 | test layer |
| --- | --- |
| F-01/F-06 | manual coverage step（Phase 5 / Phase 11） |
| F-02 | sync test (T-06) + integration |
| F-03 | repository test（既存） |
| F-04/F-05 | scope-out、ガード参照のみ |

## 多角的チェック観点（AIが判断）

- silent fallback が新経路で復活していないか。
- coverage 0 件確認を「once-only」ではなく Phase 13 承認直前または同日に再確認する設計か。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| coverage 失敗時の延期判断 | Phase 5 step 2 と一致 |
| `source='unknown'` 経路の test | T-06 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 異常系設計 | `phase-06.md` | failure cases |

## 完了条件

- [ ] F-01 から F-06 が検証可能
- [ ] coverage / fallback / scope-out の境界が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 7 AC matrix に転記できる

## 次Phase

Phase 7: ACマトリクス
