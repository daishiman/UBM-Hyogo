# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | Phase 1-2 の GO/NO-GO レビュー |

## 目的

Phase 4 以降へ進む前に、仕様矛盾、実 DB 前提の誤り、責務混入を検出する。

## 実行タスク

- Phase 1 AC と Phase 2 design の 1:1 対応を確認する。
- `schema_aliases` 正本と migration 設計の差分を確認する。
- 07b stale contract（旧 `schema_questions.stableKey` 更新）を NO-GO 条件として明記する。
- fallback retirement が本タスクへ混入していないか確認する。

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 2 | `phase-02.md` | 設計 |
| issue-191 close-out | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/implementation-guide.md` | close-out 判断 |

## 実行手順

1. 以下を MAJOR/NO-GO として扱う。

| NO-GO | 理由 |
| --- | --- |
| `POST /admin/schema/aliases` の path rename | downstream UI/tests を壊す |
| `UPDATE schema_questions SET stable_key` を apply path に残す | issue-191 方針違反 |
| lookup error を alias miss と扱う | data loss / silent drift |
| fallback retirement を同時実施 | scope creep |

2. MINOR がある場合は Phase 5 または Phase 9 の確認項目へ転記する。
3. GO 判定時のみ Phase 4 へ進む。

## 統合テスト連携

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| 設計レビュー | NO-GO 0 件 | Phase 3 実行時に記録 |
| MINOR 追跡 | 解決 Phase がある | Phase 3 実行時に記録 |

## 多角的チェック観点（AIが判断）

- 既存 07b docs の stale 記述を踏襲していないか。
- D1 transaction の failure 時に半端な queue resolved が起きないか。
- admin UI 側変更が不要な理由が説明できるか。

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
