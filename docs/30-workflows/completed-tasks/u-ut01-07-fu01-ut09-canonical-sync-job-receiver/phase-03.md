# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver |
| issue | #333 (U-UT01-07-FU01) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 2 で確定した 4 成果物（`ut09-receiver-path.md` / `canonical-reference-table.md` / `code-scope.md` / `orthogonality-checklist.md`）に対し、5 つの比較軸で PASS / MINOR / MAJOR を付与し、Phase 4 以降（テスト戦略 / 実装ランブック / AC マトリクス等）への着手可否を判定する。

## 実行タスク

1. Phase 2 全成果物（4 ファイル）に対して PASS / MINOR / MAJOR を付与する（完了条件: マトリクスに空セルゼロ）
2. 比較軸を 5 軸（canonical 名引き渡し経路の網羅性 / UT-09 root 確定の妥当性 / コード境界の明確さ / 直交性 / aiworkflow-requirements drift）で確定する
3. PASS / MINOR / MAJOR 判定基準を定義する
4. ゲート GO / NO-GO 条件を確定する
5. 戻り条件（NO-GO の場合に Phase 2 へ差し戻す条件）を明示する
6. レビュアー視点（UT-04 / UT-09 / U-UT01-08 / U-UT01-09 各観点）を明文化する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-02.md | レビュー対象設計の Phase 仕様 |
| 必須 | outputs/phase-02/ut09-receiver-path.md | UT-09 root 確定 |
| 必須 | outputs/phase-02/canonical-reference-table.md | canonical 表 + 必須参照 |
| 必須 | outputs/phase-02/code-scope.md | コード変更スコープ + grep ガード |
| 必須 | outputs/phase-02/orthogonality-checklist.md | 直交性チェックリスト |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/*.md | 親タスク Phase 2 正本4ファイル |

## 5 比較軸とレビュー観点

### 軸 1: canonical 名引き渡し経路の網羅性

- 親 #261 Phase 2 4ファイル絶対パスが UT-09 必須参照に登録されているか
- canonical 表（`sync_job_logs` / `sync_locks` / `sync_log` 概念名注釈）が 3 行揃っているか
- レビュー観点: UT-09 着手担当者が本タスク成果物のみを読めば canonical 名と物理／概念区分を即座に把握できるか

### 軸 2: UT-09 root 確定の妥当性

- 棚卸しが `docs/30-workflows/**` 全候補を網羅しているか
- 採択 1 + 棄却 N が理由付きで明記されているか
- 採択 path が unassigned detection から到達可能か
- レビュー観点: UT-09 担当者が「自分のタスクは何か」を path で一意に特定できるか

### 軸 3: コード境界の明確さ

- コード変更スコープ表が「ファイル / 目的 / 変更種別 / 担当タスク / 本タスクのアクション」を網羅しているか
- 本タスクのアクションが「検証 / 構造提案 / read-only 確認」に限定されているか
- grep ガード（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME`）が AC-3 検証手段として明示されているか
- レビュー観点: 本タスクが自分のスコープを越えて UT-09 のコード本体に手を入れていないか

### 軸 4: 直交性（U-UT01-08 / U-UT01-09 / UT-04 への非侵食）

- enum 値（`status` / `trigger_type`）の決定が含まれていないか（U-UT01-08 委譲）
- retry / offset 値の決定が含まれていないか（U-UT01-09 委譲）
- 物理 schema 追加判定（`idempotency_key` / `processed_offset` / `sheets_revision` / INDEX 等）が含まれていないか（UT-04 委譲）
- レビュー観点: 直交タスクの担当者が「自分のスコープに侵食されていない」と確認できるか

### 軸 5: aiworkflow-requirements drift 解消可能性

- `database-schema.md` の grep 結果が成果物に明記されているか
- drift 不要の場合、不要であることが明記されているか
- drift がある場合、doc-only 更新案が提示されているか

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 軸の判断基準を満たす。ゲート通過可能 |
| MINOR | 警告レベル。Phase 4 以降で補足対応が必要だが、ゲート通過は許可。MINOR は handoff 系成果物に記録する |
| MAJOR | block。Phase 2 へ差し戻し。修正後に Phase 3 を再実行する |

## Phase 2 成果物の最終判定（期待値）

| 成果物 | 軸 1（経路網羅） | 軸 2（root 確定） | 軸 3（コード境界） | 軸 4（直交性） | 軸 5（drift） | 総合判定 |
| --- | --- | --- | --- | --- | --- | --- |
| ut09-receiver-path.md | n/a | PASS（棚卸し + 採択根拠） | PASS（受け皿確定） | PASS | n/a | **PASS** |
| canonical-reference-table.md | PASS（4ファイル絶対パス + canonical 表 3 行） | n/a | PASS（物理／概念区分） | PASS | PASS（drift 確認結果） | **PASS** |
| code-scope.md | PASS（参照名検証範囲） | n/a | PASS（grep ガード明示・本タスク非実装） | PASS（U-UT01-08/09 / UT-04 委譲明記） | n/a | **PASS** |
| orthogonality-checklist.md | n/a | n/a | n/a | PASS（委譲項目網羅） | n/a | **PASS** |

## ゲート GO / NO-GO 条件

### GO 条件（全て満たすこと）

- [ ] 4 成果物すべての総合判定が PASS
- [ ] MAJOR が一つも残っていない
- [ ] AC-1〜AC-4 すべてが該当成果物に対応付いて記載されている
- [ ] 親 #261 Phase 2 4ファイル絶対パスが canonical-reference-table.md に列挙されている
- [ ] U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリストの全項目が「決定しない」確認済
- [ ] grep ガード（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` が 0 件）が AC-3 検証手段として明示
- [ ] `apps/api/migrations/0002_sync_logs_locks.sql` を改変しない方針が成果物本文で繰り返し宣言されている
- [ ] UT-09 受け皿 path が unassigned detection から到達可能であることを確認

### NO-GO 条件（一つでも該当）

- 5 軸のいずれかに MAJOR が残る
- UT-09 root 採択が棚卸しから導出されていない
- 親 #261 Phase 2 4ファイル絶対パスのいずれかが欠落している
- 直交性チェックリストに enum / retry / offset / 物理 schema 追加判定の決定が混入している
- 既存物理 migration / 既存 jobs コードを改変する方針が混入している
- AC-1〜AC-4 の対応成果物が欠落している

## 戻り条件（NO-GO 時の差し戻し先）

| NO-GO 種別 | 差し戻し先 | 修正範囲 |
| --- | --- | --- |
| UT-09 root 棚卸し不足 | Phase 2 ステップ 2 | ut09-receiver-path.md の棚卸しを再実行 |
| 必須参照4ファイル絶対パス欠落 | Phase 2 ステップ 3 | canonical-reference-table.md に絶対パスを追記 |
| grep ガード未明示 | Phase 2 ステップ 4 | code-scope.md に検証手段を追記 |
| 直交性侵食 | Phase 2 ステップ 5 | orthogonality-checklist.md の該当文言を削除し委譲に書き換え |
| 既存物理改変方針の混入 | Phase 2 ステップ 4 | code-scope.md で改変禁止を再宣言 |
| drift 確認漏れ | Phase 2 ステップ 6 | grep 再実行 + 結果を成果物に明記 |

## レビュアー視点

### UT-04 視点

- `idempotency_key` / `processed_offset` / `sheets_revision` / INDEX 追加要否が本タスクで決定されていないことを確認
- `sync_log` 物理化禁止が UT-04 schema 設計の前提条件として明文化されているか確認
- 本タスク採択受け皿 path で D1 schema 追加判定が UT-04 へ確実に委譲されているか

### UT-09 視点

- 自分のタスク root が確定 path で一意に特定できるか
- canonical 名 `sync_job_logs` / `sync_locks` の根拠資料（親 Phase 2 4ファイル）に絶対パスで到達できるか
- 既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` の参照名がすでに canonical と整合しているか grep で検証できるか
- grep ガードが CI / hook として導入可能な粒度で記述されているか

### U-UT01-08 視点

- enum 値（`status` / `trigger_type`）の canonical 決定が本タスクで踏まれていないことを確認
- 直交性チェックリストに enum 委譲項目が明記されているか

### U-UT01-09 視点

- `DEFAULT_MAX_RETRIES` / `processed_offset` 意味論の決定が本タスクで踏まれていないことを確認
- 直交性チェックリストに retry / offset 委譲項目が明記されているか

## 多角的チェック観点

- canonical 名引き渡し経路が UT-09 担当者から見て single source of truth として機能しているか
- UT-09 root 確定が unassigned detection の自動巡回から到達可能か
- コード境界が「本タスクは仕様書のみ・実装は UT-09」と明確化されているか
- 直交性チェックリストが「決定しない」を網羅的に列挙しているか
- AC-1〜AC-4 すべてが Phase 2 成果物に明示的に対応付いているか
- ownership 宣言（既存物理は read-only）が成果物本文で繰り返し確認されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Phase 2 成果物 4 件への PASS/MINOR/MAJOR 付与 | 3 | pending | main.md |
| 2 | 比較軸 5 軸の確定 | 3 | pending | main.md |
| 3 | PASS/MINOR/MAJOR 基準の定義 | 3 | pending | main.md |
| 4 | GO/NO-GO 条件確定 | 3 | pending | main.md |
| 5 | 戻り条件明示 | 3 | pending | main.md |
| 6 | レビュアー視点（UT-04 / UT-09 / U-UT01-08 / U-UT01-09）明文化 | 3 | pending | main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビューゲート判定（PASS/MINOR/MAJOR・GO/NO-GO・戻り条件・レビュアー視点） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [ ] 4 成果物すべての総合判定が PASS
- [ ] 比較軸 5 軸の判定基準が明文化
- [ ] GO/NO-GO 条件が記述
- [ ] 戻り条件が NO-GO 種別ごとに記述
- [ ] レビュアー視点 4 種（UT-04 / UT-09 / U-UT01-08 / U-UT01-09）が明文化
- [ ] AC-1〜AC-4 すべてが Phase 2 成果物に対応付け済

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- ゲート GO 後の引き継ぎ:
  - UT-09 受け皿 path 確定（テスト戦略では grep ガードの CI 配線方針を確定）
  - canonical 名引き渡し経路（テスト戦略では参照名検証テストの設計を確定）
  - 直交性チェックリスト（テスト戦略では非侵食を回帰テストとして固定）
- ブロック条件（GO 不能）:
  - Phase 2 のいずれかの成果物に MAJOR
  - AC-1〜AC-4 のいずれかが対応成果物に欠落
  - 直交性チェックリストに enum / retry / offset / 物理 schema 追加判定の決定混入
  - 既存物理 migration / 既存 jobs コードを改変する方針が混入
