# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 |
| issue | #261 (U-UT01-07) |
| Phase 番号 | 3 / 3 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | なし（本タスクは Phase 1-3 で完結する docs-only design reconciliation） |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 2 で確定した 4 成果物（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md`）に対し、4 つの比較軸で PASS / MINOR / MAJOR を付与し、UT-04 / UT-09 への引き渡しが可能なゲート通過判定を行う。本タスクは docs-only design reconciliation のため、Phase 4 以降は存在せず、本 Phase の GO 判定をもって全体完了とする。

## 実行タスク

1. Phase 2 全成果物（4 ファイル）に対して PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）
2. 比較軸を 4 軸（概念純度 vs 破壊性 / 4 案比較の採択妥当性 / 直交性 / aiworkflow-requirements drift 解消可能性）で確定する
3. PASS / MINOR / MAJOR 判定基準を定義する
4. ゲート GO / NO-GO 条件を確定する
5. 戻り条件（NO-GO の場合に Phase 2 へ差し戻す条件）を明示する
6. 残課題（open question）を UT-04 / UT-09 / U-8 / U-9 へ振り分ける

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-02.md | レビュー対象設計の Phase 仕様 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | canonical 採択 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | マッピング表 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | 4 案比較 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | 引き継ぎ + 直交性チェックリスト |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | AC 正本 |

## 4 比較軸とレビュー観点

### 軸 1: 概念純度 vs 破壊性（採択 trade-off の妥当性）

- 採択案 A は概念純度で MINOR（物理 2 分離が論理 1 より重い）だが破壊性ゼロ
- 案 B は概念純度 PASS だが破壊性 MAJOR
- レビュー観点: trade-off の選択が「破壊的変更コスト < 概念純度」原則（issue 本文）に合致しているか

### 軸 2: 4 案比較の採択妥当性

- no-op / view / rename / 新テーブル+移行 の 4 案が 4 軸で評価されているか
- データ消失を伴う案 4 が**明示却下**されているか
- 採択案（no-op）の根拠が代替案比較から導出されているか

### 軸 3: 直交性（U-8 / U-9 への非侵食）

- enum 値（status / trigger_type）の決定が含まれていないか
- retry / offset 値の決定が含まれていないか
- マッピング表に「U-8 委譲」「U-9 委譲」ラベルが該当箇所に付与されているか

### 軸 4: aiworkflow-requirements drift 解消可能性

- `database-schema.md` の grep 結果が成果物に明記されているか
- drift 不要の場合、不要であることが明記されているか
- drift がある場合、doc-only 更新案が提示されているか

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 軸の判断基準を満たす。ゲート通過可能 |
| MINOR | 警告レベル。UT-04 / UT-09 着手時に補足対応が必要だが、ゲート通過は許可。MINOR は handoff-to-ut04-ut09.md に記録する |
| MAJOR | block。Phase 2 へ差し戻し。修正後に Phase 3 を再実行する |

## Phase 2 成果物の最終判定

| 成果物 | 軸 1（概念純度 vs 破壊性） | 軸 2（4 案比較） | 軸 3（直交性） | 軸 4（drift 解消） | 総合判定 |
| --- | --- | --- | --- | --- | --- |
| naming-canonical.md | PASS（trade-off が破壊性ゼロを優先・正当化済） | PASS（候補 3 案比較で導出） | PASS（enum / retry に踏み込まない） | n/a | **PASS** |
| column-mapping-matrix.md | PASS（責務分離の翻訳明示） | n/a | PASS（U-8 / U-9 委譲ラベル付与） | n/a | **PASS** |
| backward-compatibility-strategy.md | PASS（破壊性ゼロ採択） | PASS（4 案 × 4 軸 + 案 4 明示却下） | n/a | n/a | **PASS** |
| handoff-to-ut04-ut09.md | n/a | n/a | PASS（直交性チェックリスト網羅） | PASS（grep 結果ゼロ → 不要明記） | **PASS** |

## ゲート GO / NO-GO 条件

### GO 条件（全て満たすこと）

- [ ] 4 成果物すべての総合判定が PASS
- [ ] MAJOR が一つも残っていない
- [ ] AC-1〜AC-6 すべてが該当成果物に対応付いて記載されている
- [ ] U-8 / U-9 直交性チェックリストの全項目が「決定しない」確認済
- [ ] `database-schema.md` drift 確認結果（grep ゼロ → 不要）が明記
- [ ] 案 4（新テーブル+移行）が明示却下されていることを確認
- [ ] `apps/api/migrations/0002_sync_logs_locks.sql` を改変しない方針が成果物本文で繰り返し宣言されている

### NO-GO 条件（一つでも該当）

- 4 軸のいずれかに MAJOR が残る
- canonical 採択が代替案比較から導出されていない
- 後方互換戦略でデータ消失を伴う案が却下されていない
- 直交性チェックリストに enum / retry / offset の決定が混入している
- 既存物理 migration を改変する方針が混入している
- AC-1〜AC-6 の対応成果物が欠落している

## 戻り条件（NO-GO 時の差し戻し先）

| NO-GO 種別 | 差し戻し先 | 修正範囲 |
| --- | --- | --- |
| canonical 採択根拠不足 | Phase 2 ステップ 2 | naming-canonical.md の代替案比較を再実行 |
| マッピング表の空欄 / 漏れ | Phase 2 ステップ 3 | column-mapping-matrix.md の論理 13 カラム再走査 |
| 案 4 却下不明示 | Phase 2 ステップ 4 | backward-compatibility-strategy.md に明示却下文を追記 |
| 直交性侵食 | Phase 2 ステップ 5 | handoff-to-ut04-ut09.md の該当文言を削除し、U-8 / U-9 委譲に書き換え |
| drift 確認漏れ | Phase 2 ステップ 6 | grep 再実行 + 結果を成果物に明記 |

## open question（後続タスクへ送る）

| # | 質問 | 受け皿 | 備考 |
| --- | --- | --- | --- |
| 1 | `idempotency_key` カラム追加要否 | UT-04 | UT-09 冪等性要件確定後 |
| 2 | `processed_offset` カラム追加要否 + 意味論 | UT-04（追加要否）/ U-9（意味論） | 二者間で分担 |
| 3 | `sheets_revision` カラム追加要否 | UT-04 | schema_diff_queue で代替検証 |
| 4 | `sync_locks.expires_at` の追加 INDEX 要否 | UT-04 | UT-09 クエリパターン確定後 |
| 5 | `database-schema.md` への sync 系テーブル追補時期 | UT-04 | 全体更新タイミングで統合 |
| 6 | `status` / `trigger_type` enum 値 canonical | U-8 | 直交タスク |
| 7 | `DEFAULT_MAX_RETRIES` 正本値 | U-9 | 直交タスク |

## 多角的チェック観点

- 概念純度 vs 破壊性の trade-off が「破壊性ゼロ最優先」原則に従っているか
- 4 案比較で全軸が埋まり、空セルがないか
- 直交性チェックリストが「決定しない」を網羅的に列挙しているか
- AC-1〜AC-6 すべてが Phase 2 成果物に明示的に対応付いているか
- ownership 宣言（既存物理は read-only）が成果物本文で繰り返し確認されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 2 成果物 4 件への PASS/MINOR/MAJOR 付与 | 3 | pending | main.md |
| 2 | 比較軸 4 軸の確定 | 3 | pending | main.md |
| 3 | PASS/MINOR/MAJOR 基準の定義 | 3 | pending | main.md |
| 4 | GO/NO-GO 条件確定 | 3 | pending | main.md |
| 5 | 戻り条件明示 | 3 | pending | main.md |
| 6 | open question の Phase 振り分け | 3 | pending | main.md（7 件） |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビューゲート判定（PASS/MINOR/MAJOR・GO/NO-GO・戻り条件・open question） |
| メタ | artifacts.json | Phase 3 状態の更新（全 Phase spec_created） |

## 完了条件

- [ ] 4 成果物すべての総合判定が PASS
- [ ] 比較軸 4 軸の判定基準が明文化
- [ ] GO/NO-GO 条件が記述
- [ ] 戻り条件が NO-GO 種別ごとに記述
- [ ] open question 7 件すべてに受け皿（UT-04 / U-8 / U-9）が割り当て済
- [ ] AC-1〜AC-6 すべてが Phase 2 成果物に対応付け済

## 次 Phase への引き渡し

- 次 Phase: なし（本タスクは Phase 3 GO 判定で完了）
- ゲート GO 後の引き継ぎ:
  - UT-04 着手前提条件として本タスクの 4 成果物を Phase 1 必須参照に登録
  - UT-09 実装前提条件として canonical 名宣言を参照
  - U-8 / U-9 は本タスクの直交性チェックリストを参照し、命名議論には踏み込まない
- ブロック条件（GO 不能）:
  - Phase 2 のいずれかの成果物に MAJOR
  - AC-1〜AC-6 のいずれかが対応成果物に欠落
  - 直交性チェックリストに enum / retry / offset の決定混入
