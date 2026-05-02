# Phase 8: ドキュメントリファクタリング（DRY 化 / 重複排除）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメントリファクタリング（DRY 化 / 構成最適化） |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| workflow_state | spec_created |
| sourceIssue | #333 (CLOSED) |

## 目的

本タスクは UT-09 同期ジョブ実装で canonical 名 `sync_job_logs` / `sync_locks` を採用させる「受け皿確定」スコープであり、コード変更は constants 定義 + grep ガード script の追加に限定される。
Phase 1〜7 で確定した「canonical 名定義 / 必須参照リスト / `sync_log` 物理化禁止ルール / U-UT01-08・09 / UT-04 直交性」は、UT-09 receiver path（`docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）・親 U-UT01-07 outputs・本タスク outputs の 3 箇所に分散しがちで、用語揺れと二重正本化リスクが発生する。

本 Phase で **canonical 名定義の単一正本化 / 必須参照リスト集約 / grep ガード script 一本化 / aiworkflow-requirements との二重記述検出** を行い、Phase 9 (静的検証 + CI gate) と Phase 10 (Go/No-Go) が「単一正本を読めば判定できる」状態を担保する。

## 実行タスク

1. canonical 名定義の単一正本化: `apps/api/src/sync/canonical-names.ts`（または `apps/api/src/sync/constants.ts` 同等）に `SYNC_JOB_LOGS_TABLE = 'sync_job_logs'` / `SYNC_LOCKS_TABLE = 'sync_locks'` を const export として集約し、UT-09 mapper / job 実装はここからのみ参照する仕様を確定する（完了条件: 物理テーブル名のリテラル文字列が constants ファイル以外に出現しない設計）。
2. 必須参照リストの単一正本化: 親 U-UT01-07 の `outputs/phase-02/canonical-reference-table.md` を SSOT とし、UT-09 root と本タスク root からは「symlink もしくは明示的な相対 link 参照」のみとする方針を確定する（完了条件: 必須参照リストの実体記述が 1 箇所のみ）。
3. grep ガード script の単一化: `scripts/check-canonical-sync-names.sh` 1 本に集約し、UT-09 PR / 本タスク PR / aiworkflow-requirements drift の 3 用途で同一 script を再利用する仕様を確定する（完了条件: 同等機能の script 重複 0）。
4. aiworkflow-requirements `database-schema.md` との二重記述検出: 物理テーブル仕様の正本を migration（`apps/api/migrations/0002_sync_logs_locks.sql`）に置き、`database-schema.md` 側は「canonical 名のみ言及・詳細は migration 参照」形式に縮約する方針を確定する（完了条件: スキーマ定義の重複 0）。
5. 重複検出 grep 戦略の確定: 概念名 `sync_log` 単独表記 / 物理テーブル CREATE / RENAME / DROP / 旧揺れ `sync_logs` / `sync_lock` の検出パターンを表化する（完了条件: 検出パターン 5 件以上）。
6. outputs/phase-08/main.md に Before / After 比較 + 集約方針 + 重複検出戦略を統合する（完了条件: 5 観点すべて記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/outputs/phase-02/ | canonical 名・必須参照リスト・grep 戦略の正本候補 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | 親タスクの単一正本群（canonical-reference-table.md など） |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-09 実装タスク root（受け皿確定対象） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理 canonical の正本（Read のみ・改変禁止） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理利用フロー（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 二重記述検出対象 |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-08.md | 書式模倣元 |

## Before / After 比較テーブル

### canonical 名定義

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 物理テーブル名リテラル | mapper / job / migration / docs に文字列が散在 | `apps/api/src/sync/canonical-names.ts` に const export 集約 | 単一正本化・grep 容易化 |
| 概念名 `sync_log` | コード中に物理 table name として出現する余地あり | constants ファイル不採用・docs 中の概念名としてのみ存在 | AC-3（物理化禁止）担保 |
| migration 内テーブル名 | `0002_sync_logs_locks.sql` で確定済 | 改変禁止・参照のみ | 既存実装尊重 |

### 必須参照リスト

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 必須参照リスト本体 | UT-09 root / 本タスク root / 親 U-UT01-07 outputs に類似記述が分散 | 親 `outputs/phase-02/canonical-reference-table.md` を SSOT とし他は link 参照のみ | 二重正本化排除 |
| UT-09 root からの参照 | テキスト言及のみ | 相対 link で SSOT を明示参照 | trace 容易化 |

### grep ガード

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| canonical 名違反検出 script | UT-09 / FU01 / aiworkflow drift で script が分かれる懸念 | `scripts/check-canonical-sync-names.sh` 1 本に集約 | 重複排除・保守容易化 |
| 検出対象パターン | 各所で揺れ | 5 パターン固定（後述） | 機械可読化 |

### aiworkflow-requirements 二重記述

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| schema 定義の正本 | migration と `database-schema.md` 両方に DDL 詳細 | migration を正本・`database-schema.md` は canonical 名 + migration 参照のみ | 二重記述排除 |
| canonical 名言及 | 揺れ可能性あり | `sync_job_logs` / `sync_locks` のみ採用 | drift 検出基準明示 |

## 重複記述の集約方針

| # | 重複対象 | 集約先（単一正本） | 他箇所の扱い |
| --- | --- | --- | --- |
| 1 | canonical 名リテラル | `apps/api/src/sync/canonical-names.ts` | import 経由で参照のみ |
| 2 | 必須参照リスト | 親 `outputs/phase-02/canonical-reference-table.md` | link 参照のみ |
| 3 | grep ガード script | `scripts/check-canonical-sync-names.sh` | UT-09 / FU01 / CI gate / pre-commit hook で同一 script を呼び出し |
| 4 | 物理テーブル DDL | `apps/api/migrations/0002_sync_logs_locks.sql` | docs / aiworkflow-requirements は migration を参照 |
| 5 | `sync_log` 物理化禁止ルール | 本タスク `outputs/phase-02/code-scope.md` と `outputs/phase-02/orthogonality-checklist.md` | UT-09 root から link 参照のみ |

## 重複検出 grep 戦略

| # | 検出パターン | コマンド例 | 期待値 |
| --- | --- | --- | --- |
| 1 | 物理テーブル文字列の constants 外出現 | `rg -n "'sync_job_logs'\|\"sync_job_logs\"\|'sync_locks'\|\"sync_locks\"" apps/ --glob '!apps/api/src/sync/canonical-names.ts' --glob '!apps/api/migrations/**'` | 0 件 |
| 2 | `sync_log` を物理テーブル扱いするコード | `rg -n "CREATE\s+TABLE\s+sync_log\b\|FROM\s+sync_log\b\|INTO\s+sync_log\b" apps/` | 0 件 |
| 3 | 物理テーブル CREATE/RENAME/DROP（既存 migration 以外） | `rg -n "(CREATE\|RENAME\|DROP)\s+TABLE\s+(sync_log\|sync_logs\|sync_job_logs\|sync_locks)" apps/api/migrations/ --glob '!0002_sync_logs_locks.sql'` | 0 件 |
| 4 | 旧揺れ表記 | `rg -n "sync_logs\b\|sync_lock\b" apps/ docs/` | 0 件（複数形 vs 単数形混在 0） |
| 5 | aiworkflow-requirements 二重 DDL | `rg -n "CREATE\s+TABLE" .claude/skills/aiworkflow-requirements/references/database-schema.md` | 0 件（migration 参照のみ） |

## 削除対象

- UT-09 root / 本タスク root に散在する canonical 名リテラル文字列の重複記述（const import に置換）。
- 必須参照リストの実体記述（親 SSOT への link に置換）。
- aiworkflow-requirements `database-schema.md` 内の `sync_job_logs` / `sync_locks` DDL 詳細（migration 参照に置換）。
- 旧揺れ表記 `sync_logs` / `sync_lock` の単独使用箇所。

## 共通化パターン

- canonical 名はコード側 `apps/api/src/sync/canonical-names.ts` const、docs 側親 SSOT、物理 DDL は migration の 3 層に役割分担し、それぞれを単一正本とする。
- grep ガード script は `scripts/check-canonical-sync-names.sh` に統一し、pre-commit hook / CI gate / drift 検出で再利用する。
- 概念名 `sync_log` は docs 内の注釈付き表記のみ許容、コード中の物理テーブル名としての出現は禁止する。

## navigation drift 確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| 本タスク phase-XX.md ↔ outputs link | grep 突き合わせ | 完全一致 |
| 親 U-UT01-07 SSOT への相対 link | 全 phase で実在確認 | リンク切れ 0 |
| UT-09 root からの参照 link | UT-09 root / 必須参照節を確認 | 実在 |
| canonical-names.ts への import 設計記述 | UT-09 phase-05（実装計画）に明記 | 言及あり |
| aiworkflow-requirements drift 対象 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在 |

## 実行手順

### ステップ 1: canonical 名 const 設計の確定
- `apps/api/src/sync/canonical-names.ts` の export 仕様（const 名 / 値 / readonly）を仕様書として記述する（実装は UT-09 で発火）。

### ステップ 2: 必須参照リスト SSOT 化
- 親 `outputs/phase-02/canonical-reference-table.md` を SSOT と宣言し、UT-09 root / 本タスクからは link のみとする旨を明記。

### ステップ 3: grep ガード script 仕様確定
- `scripts/check-canonical-sync-names.sh` の入力 / 出力 / exit code 仕様を記述（実装は本タスク or UT-09 のどちらで発火するかを Phase 9 と整合）。

### ステップ 4: aiworkflow-requirements 二重記述検出
- `database-schema.md` を `rg "CREATE TABLE"` で実測し、検出された場合は migration 参照形式への縮約案を Phase 12 で formalize する旨を引き継ぎ。

### ステップ 5: 重複検出 grep 戦略表完成
- 5 パターンを `outputs/phase-08/main.md` に転記。

### ステップ 6: outputs/phase-08/main.md に集約
- Before/After 4 区分・集約方針 5 件・grep 戦略 5 パターン・navigation drift 表をすべて 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | grep ガード script 仕様を静的検証 / pre-commit hook / CI gate の前提として使用 |
| Phase 10 | 単一正本化結果を Go/No-Go の判定根拠に使用 |
| Phase 12 | aiworkflow-requirements drift を documentation で formalize |
| UT-09 | canonical-names.ts import 設計を mapper / job 実装の入力に使用 |
| UT-04 | 物理 canonical 名・migration 戦略の継続的尊重 |

## 多角的チェック観点

- 価値性: UT-09 実装着手時の「どのテーブル名を使うか」の再質問を 0 にする。
- 実現性: const ファイル 1 + script 1 の最小追加で完結し、既存 migration を改変しない。
- 整合性: 不変条件 #5（D1 access apps/api 内閉鎖）に整合し、constants も `apps/api` 配下に閉じる。
- 運用性: grep ガードを 1 本に集約することで保守コストが削減される。
- 認可境界: 本 Phase は文書編集 + 仕様確定のみで権限境界を変更しない。
- 直交性: U-UT01-08（enum）/ U-UT01-09（retry/offset）/ UT-04（DDL）への侵食 0。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | canonical-names.ts 設計確定 | 8 | spec_created | const export 仕様 |
| 2 | 必須参照リスト SSOT 化 | 8 | spec_created | 親 outputs を SSOT |
| 3 | grep ガード script 単一化 | 8 | spec_created | 1 script で 3 用途 |
| 4 | aiworkflow-requirements 二重記述検出 | 8 | spec_created | migration 参照形式 |
| 5 | 重複検出 grep 戦略 | 8 | spec_created | 5 パターン |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（Before/After・集約方針・grep 戦略・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] Before / After 4 区分（canonical 名 / 必須参照 / grep ガード / aiworkflow 二重記述）が埋まっている
- [ ] 重複集約方針が 5 件以上列挙されている
- [ ] 重複検出 grep 戦略が 5 パターン以上記述されている
- [ ] navigation drift が 0
- [ ] canonical-names.ts / `scripts/check-canonical-sync-names.sh` の単一正本化方針が明文化されている
- [ ] outputs/phase-08/main.md が作成済み
- [ ] 既存 migration（`0002_sync_logs_locks.sql`）の改変計画が含まれていない（Read のみ）

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- Before/After 4 区分網羅、集約 5 件、grep 戦略 5 パターン、navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - 単一正本（canonical-names.ts / 親 SSOT / script / migration）を品質ゲート対象に固定
  - 5 パターンの grep 戦略を静的検証コマンドとして再利用
  - aiworkflow-requirements drift 検出を Phase 9 で実測する前提条件
  - taskType=docs-only のため CI gate 提案は UT-09 実装タスクまたは後続 governance guard へ橋渡し
- ブロック条件:
  - canonical 名の集約先が決まっていない
  - grep ガード script の集約先が決まっていない
  - 親 SSOT への参照経路が確定していない
