# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | Phase 1-2 の GO/NO-GO レビュー |

## 目的

Phase 4 以降へ進む前に、scope creep、coverage 不足、fallback 削除の安全性違反を検出する。

## 実行タスク

- Phase 1 AC と Phase 2 design の 1:1 対応を確認する。
- coverage query 設計が AC-1 を満たすか確認する。
- direct update guard 強化（別タスク）と scope が混ざっていないか確認する。
- `updateStableKey` 等の alias-resolution 外の書き込み経路を巻き添え削除していないか確認する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 2 | `phase-02.md` | 設計 |
| 上流 close-out | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/unassigned-task-detection.md` | 廃止判断の依存条件 |

## 実行手順

1. 以下を MAJOR/NO-GO として扱う。

| NO-GO | 理由 |
| --- | --- |
| coverage query で 0 件確認せずに fallback 削除 | data loss / silent unresolved 増 |
| `updateStableKey` 削除や `listFieldsByVersion` の編集 | scope 外、alias backfill 経路を破壊 |
| `findStableKeyByQuestionId` シグネチャ変更 | 03a sync の呼び出し側を壊す |
| direct update guard 強化を同時実施 | `task-issue-191-direct-stable-key-update-guard-001` の scope creep |
| Issue #299 を本 PR で close/reopen 操作 | ユーザー指示違反 |

2. MINOR がある場合は Phase 5 または Phase 9 の確認項目へ転記する。
3. GO 判定時のみ Phase 4 へ進む。

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| 設計レビュー | NO-GO 0 件 | Phase 3 実行時に記録 |
| MINOR 追跡 | 解決 Phase がある | Phase 3 実行時に記録 |

## 多角的チェック観点（AIが判断）

- coverage が将来時点で再度破れる可能性（新規 question 流入）の後段ガードを Phase 6 / 8 に持たせているか。
- staging / production の両 D1 で coverage 確認する設計か。

## サブタスク管理

| 判定 | 戻り先 |
| --- | --- |
| PASS | Phase 4 |
| MINOR | Phase 4 へ進み、Phase 9/10 で確認 |
| MAJOR | Phase 2 に戻る |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計レビュー | `phase-03.md` | GO/NO-GO 条件 |

## 完了条件

- [ ] NO-GO 条件が明確
- [ ] Phase 4 開始条件が明確
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 1-3 が完了するまで Phase 4 へ進んでいない
- [ ] MAJOR の戻り先が定義されている

## 次Phase

Phase 4: テスト戦略
