# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver |
| issue | #333 (U-UT01-07-FU01) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 1 で確定した「コード伝播経路確定 + UT-09 root 棚卸し + 直交性維持」の 3 軸要件を、以下 4 成果物に分解し、Phase 3 設計レビューゲートが PASS / MINOR / MAJOR で判定できる粒度の設計を確定する。

1. UT-09 実装受け皿 path 確定（`ut09-receiver-path.md`）
2. canonical 名引き渡しリファレンス表（`canonical-reference-table.md`）
3. コード変更スコープ表（`code-scope.md`）
4. U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリスト（`orthogonality-checklist.md`）

## 実行タスク

1. UT-09 実装タスク root の実在判定: `docs/30-workflows/**` 配下を grep し既存 UT-09 系統ファイル（`task-ut09-*.md` / `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` / `completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` 等）を棚卸しし、不足なら新規 workflow root path を提案する（完了条件: `ut09-receiver-path.md` に確定 path 1 件 + 採択根拠 + 棄却候補リスト）
2. UT-09 必須参照リスト設計: 親 #261 Phase 2 正本4ファイルの**絶対パス**を列挙し、UT-09 タスクの Phase 1 必須参照欄へ追加する（完了条件: `canonical-reference-table.md` に絶対パス4件 + 各ファイルの引き渡す canonical 値が表形式）
3. canonical 表作成: `sync_job_logs`（ledger 責務）/ `sync_locks`（lock 責務）/ `sync_log`（概念名注釈）の 3 行を表形式で作成し、UT-09 実装で参照する（完了条件: `canonical-reference-table.md` に 3 行 + 物理／概念区分が明記）
4. コード変更スコープ表: 実装が必要なファイル（`apps/api/src/jobs/sync-sheets-to-d1.ts` の参照名検証 / 新規 `apps/api/src/sync/` 配下の構造提案 / grep ガード追加）を `code-scope.md` に列挙する（完了条件: ファイル単位で「目的 / 変更種別 / 担当タスク（UT-09）」が表形式）
5. U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリスト: 本タスクが enum / retry / offset / 物理 schema 追加判定のいずれにも踏み込まないことを項目化（完了条件: `orthogonality-checklist.md` に各タスク委譲項目が明文）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/phase-01.md | 真の論点・依存境界・AC |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md | canonical 採択 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md | 1:N マッピング |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md | no-op 採択 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md | UT-04 / UT-09 引き継ぎ + 直交性 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（read-only） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存物理利用フロー（read-only） |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-09 受け皿候補 |
| 参考 | docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/ | UT-09 系統先行実装の構造模倣元 |

## 設計出力概要

### 1. UT-09 実装受け皿 path 確定（ut09-receiver-path.md）

- **棚卸し対象**:
  - `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/`（UT-09 直系の先行実装で完了済）
  - `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`（UT-09 後継 endpoint+audit 実装の unassigned 受け皿候補）
  - `docs/30-workflows/unassigned-task/task-ut09-*.md`（多数のフォローアップ）
- **採択方針（推奨）**: UT-09 実装受け皿 = `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` を正本タスク化（`docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/` を新 root として workflow root 化する設計）
- 採択根拠: U-04 は完了済で改変不可。`task-ut09-*.md` 群は副次フォローアップでメイン実装受け皿ではない。UT-21 は endpoint + audit 実装を含み、canonical 名を初めてコードに反映するスコープを持つ
- 採択結果は `ut09-receiver-path.md` に「確定 path / 採択根拠 / 棄却候補と棄却理由」を表形式で記述

### 2. canonical 名引き渡しリファレンス表（canonical-reference-table.md）

- **canonical 表（実装で参照する正本名）**:

| 名前 | 種別 | 物理／概念 | 責務 | 出典 |
| --- | --- | --- | --- | --- |
| `sync_job_logs` | テーブル | 物理 | ledger（実行履歴・status・retry_count・duration_ms 等） | `apps/api/migrations/0002_sync_logs_locks.sql` |
| `sync_locks` | テーブル | 物理 | lock（同時実行制御・expires_at） | `apps/api/migrations/0002_sync_logs_locks.sql` |
| `sync_log` | 概念名 | **物理化禁止** | UT-01 設計上の論理用語。コードへ物理名として降ろさない | `completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md` |

- **必須参照リスト（UT-09 タスク Phase 1 へ登録すべき絶対パス4件）**:
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md`

### 3. コード変更スコープ表（code-scope.md）

| ファイル / ディレクトリ | 目的 | 変更種別 | 担当タスク | 本タスクのアクション |
| --- | --- | --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存ジョブの canonical 名 (`sync_job_logs` / `sync_locks`) 参照確認 | read-only 検証 | UT-09 | grep で既に canonical 名利用を確認、AC-3 grep ガード対象 |
| `apps/api/src/sync/`（新規ディレクトリ提案） | sync ジョブ補助モジュール（lock 管理 / ledger 書込みヘルパ） | 新規 | UT-09 | ディレクトリ構造提案のみ・実装は UT-09 |
| grep ガード（CI / hook） | `CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` が 0 件であること | 新規（任意） | UT-09 | 検証手段として AC-3 に明示・実装は UT-09 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | 物理現状 | **read-only / 改変禁止** | （誰も触らない） | 改変禁止を本タスクで再宣言 |

### 4. U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリスト（orthogonality-checklist.md）

- U-UT01-08（#262 enum）委譲項目:
  - [ ] `status` enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped`）の canonical 決定は **U-UT01-08 で確定**
  - [ ] `trigger_type` enum 値の canonical 決定は **U-UT01-08 で確定**
- U-UT01-09（#263 retry/offset）委譲項目:
  - [ ] `DEFAULT_MAX_RETRIES` の正本値は **U-UT01-09 で確定**
  - [ ] `processed_offset` の意味論は **U-UT01-09 で確定**
- UT-04（D1 schema）委譲項目:
  - [ ] `idempotency_key` カラム追加要否は **UT-04 で判定**
  - [ ] `processed_offset` カラム追加要否は **UT-04 で判定**
  - [ ] `sheets_revision` カラム追加要否は **UT-04 で判定**
  - [ ] `sync_locks.expires_at` の追加 INDEX 要否は **UT-04 で判定**
- 本タスク自身の宣言:
  - [ ] 本タスクは canonical **名前** の UT-09 への引き渡し経路確定のみを扱う
  - [ ] 本タスクは enum 値・retry 値・offset 値・物理 schema 追加判定を**一切決定しない**

## 実行手順

### ステップ 1: Phase 1 入力の取り込み

- 真の論点 3 軸 / AC-1〜AC-4 / 4 条件 PASS 根拠を確認

### ステップ 2: UT-09 root 棚卸し

- `docs/30-workflows/**` 配下を grep し UT-09 系統ファイルを全件列挙
- 各候補を「完了済 / 受け皿候補 / フォローアップ」に分類
- 受け皿 1 件を採択し `ut09-receiver-path.md` に確定 path + 棄却理由を記載

### ステップ 3: canonical 表 + 必須参照リスト作成

- canonical 表（3 行）を物理／概念区分付きで作成
- 親 #261 Phase 2 4ファイル絶対パスを列挙

### ステップ 4: コード変更スコープ表作成

- 実装が必要なファイル / ディレクトリを列挙し、担当タスクを UT-09 に明示委譲
- 本タスクのアクションは「検証 / 構造提案 / read-only 確認」に限定

### ステップ 5: 直交性チェックリスト作成

- U-UT01-08 / U-UT01-09 / UT-04 への委譲項目を網羅
- 本タスクの非決定事項を宣言

### ステップ 6: 整合性自己レビュー

- `database-schema.md` の sync 系記述を grep で確認、drift があれば doc-only 更新案を成果物に含める

## 多角的チェック観点

- **棚卸し網羅性**: `docs/30-workflows/**` の UT-09 系全候補が `ut09-receiver-path.md` に登場し、採択 1 + 棄却 N が理由付きで明記
- **canonical 名引き渡し経路の網羅性**: UT-09 必須参照に親 Phase 2 4ファイル絶対パスが含まれ grep で検証可能
- **コード境界の grep ガード**: `CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` 等の禁止文言が AC-3 検証手段として明示
- **直交性**: enum / retry / offset / 物理 schema 追加判定の決定文言が**一切含まれていない**ことを成果物 grep で自己検証
- **drift 解消**: `database-schema.md` の grep 結果を AC 根拠として残す

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | UT-09 root 棚卸し + 確定 path 採択 | 2 | pending | ut09-receiver-path.md |
| 2 | canonical 表 + 必須参照リスト作成 | 2 | pending | canonical-reference-table.md |
| 3 | コード変更スコープ表作成 | 2 | pending | code-scope.md |
| 4 | 直交性チェックリスト作成 | 2 | pending | orthogonality-checklist.md |
| 5 | database-schema.md drift 確認 | 2 | pending | 成果物いずれかに記録 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/ut09-receiver-path.md | UT-09 root 棚卸し + 確定 path 採択 |
| 設計 | outputs/phase-02/canonical-reference-table.md | canonical 表 + 必須参照リスト |
| 設計 | outputs/phase-02/code-scope.md | コード変更スコープ + grep ガード |
| 設計 | outputs/phase-02/orthogonality-checklist.md | U-UT01-08 / U-UT01-09 / UT-04 直交性チェックリスト |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [ ] ut09-receiver-path.md に確定 path 1 件 + 棄却候補と棄却理由が表形式で記載
- [ ] canonical-reference-table.md に canonical 表 3 行（`sync_job_logs` / `sync_locks` / `sync_log` 概念名注釈）と必須参照4ファイル絶対パスが記載
- [ ] code-scope.md にファイル単位で「目的 / 変更種別 / 担当タスク」が網羅
- [ ] orthogonality-checklist.md に U-UT01-08 / U-UT01-09 / UT-04 委譲項目が明文化
- [ ] `apps/api/migrations/0002_sync_logs_locks.sql` 改変禁止が成果物本文で再宣言
- [ ] grep ガード（`CREATE TABLE sync_log` / `ALTER TABLE sync_job_logs RENAME` が 0 件）が code-scope.md に明示
- [ ] 成果物 4 ファイルが `outputs/phase-02/` 配下に配置

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビューゲート)
- 引き継ぎ事項:
  - 採択 UT-09 受け皿 path
  - canonical 表 + 必須参照4ファイル
  - コード変更スコープ + grep ガード
  - 直交性チェックリスト
  - PASS / MINOR / MAJOR 判定対象: canonical 名引き渡し経路網羅性、UT-09 root 確定の妥当性、コード境界の明確さ、直交性、aiworkflow-requirements drift
- ブロック条件:
  - UT-09 root 採択が棚卸しから導出されていない
  - 必須参照4ファイルの絶対パスが欠落
  - grep ガード未明示
  - 直交性チェックリストに enum / retry / offset / 物理 schema 追加判定の決定混入
  - 既存 migration / 既存 jobs コードを改変する方針が混入
