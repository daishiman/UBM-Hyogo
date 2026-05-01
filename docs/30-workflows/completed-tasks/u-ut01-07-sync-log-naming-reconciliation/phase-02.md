# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 |
| issue | #261 (U-UT01-07) |
| Phase 番号 | 2 / 3 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-30 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビューゲート) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

Phase 1 で確定した「契約提供 + 直交性担保 + 1:N 翻訳明示」の 3 軸要件を、以下 4 成果物に分解し、Phase 3 設計レビューゲートが PASS / MINOR / MAJOR で判定できる粒度の設計を確定する。

1. canonical 命名決定（`naming-canonical.md`）
2. 論理 13 カラム ↔ 物理 1:N マッピング（`column-mapping-matrix.md`）
3. 後方互換戦略 4 案比較（`backward-compatibility-strategy.md`）
4. UT-04 / UT-09 引き継ぎ + U-8 / U-9 直交性チェックリスト（`handoff-to-ut04-ut09.md`）

## 実行タスク

1. canonical 候補 3 案（A / B / C）を「破壊性 / 実装コスト / 監査連続性 / rollback 容易性」4 軸で比較し、採択 1 + 却下 2 を決定する（完了条件: `naming-canonical.md` に表 + 採否理由）
2. 論理 13 カラムを抽出し、物理側 `sync_job_logs` / `sync_locks` の対応カラム / 物理未実装 / 不要 のいずれかへ分類した 1:N マッピング表を作成する（完了条件: `column-mapping-matrix.md` にカラム漏れ 0 / 判定空欄 0）
3. 後方互換戦略 4 案（no-op / view / rename / 新テーブル+移行）を 4 軸で比較し、データ消失を伴う案を明示却下する（完了条件: `backward-compatibility-strategy.md` に採択 1 + 却下 3 すべて理由付き）
4. UT-04 への migration 計画引き継ぎ（idempotency_key 等の追加要否は **UT-04 で判定** と明示委譲）と UT-09 が参照する canonical name 宣言を作成する（完了条件: `handoff-to-ut04-ut09.md` に決定事項 / 未決定事項 / 関連タスクが網羅）
5. U-8 / U-9 直交性チェックリストを作成する（完了条件: enum 値 / retry 値 / offset 値の決定が含まれていないことが明文）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-01.md | 真の論点・依存境界・AC |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-01/main.md | Phase 1 主成果物 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（read-only） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理側利用フロー（read-only） |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | 親 issue 仕様（AC 正本） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 確認対象 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-02.md | 書式模倣元 |

## 設計出力概要

### 1. canonical 命名決定（naming-canonical.md）

- 候補 3 案:
  - **案 A（推奨）**: 物理 `sync_job_logs` + `sync_locks` を canonical に固定。論理 `sync_log` は UT-01 ドキュメント上の概念用語（言及時は注釈付き）に降格
  - **案 B（却下）**: 論理 `sync_log` を canonical 化し、物理 2 テーブルを `sync_log` 単一テーブルへ rename + データ移行
  - **案 C**: 論理を概念名降格 + 物理を canonical 化（実質 A と同義のため A に統合）
- 評価軸: 破壊性 / 実装コスト / 監査連続性 / rollback 容易性
- 採択: **案 A**（破壊性ゼロ・既存稼働物理保護・監査連続性最大）

### 2. 論理 13 カラム → 物理 1:N マッピング（column-mapping-matrix.md）

- 論理 13 カラム（UT-01 Phase 2 sync-log-schema.md 想定）を物理側責務テーブルへ振り分け:
  - ledger 責務（`sync_job_logs`）: run_id / status / started_at / finished_at / fetched_count / upserted_count / failed_count / retry_count / duration_ms / error_reason / trigger_type
  - lock 責務（`sync_locks`）: lock_expires_at → `sync_locks.expires_at`
  - 物理未実装（UT-04 で追加要否判定）: idempotency_key / processed_offset 等
- 表形式で「論理カラム / 物理対応 / 判定（実装済 / 物理未実装→UT-04 委譲 / 不要）/ 備考」を網羅

### 3. 後方互換戦略 4 案比較（backward-compatibility-strategy.md）

- 案 1: **no-op（推奨）** - 既存物理を canonical に固定、論理は概念名降格
- 案 2: view 化 - `CREATE VIEW sync_log AS SELECT ... FROM sync_job_logs JOIN sync_locks` で論理単一を擬似提供
- 案 3: rename - `ALTER TABLE sync_job_logs RENAME TO sync_log` 等
- 案 4: 新テーブル+データ移行 - `sync_log` を新規 CREATE + 既存データ移行 + 旧テーブル DROP
- 評価 4 軸: 破壊性 / 実装コスト / 監査連続性 / rollback 容易性
- 採択: **案 1（no-op）**。案 4 はデータ消失リスクで明示却下

### 4. UT-04 / UT-09 引き継ぎ + 直交性チェックリスト（handoff-to-ut04-ut09.md）

- UT-04 への引き継ぎ:
  - canonical 名 = `sync_job_logs` / `sync_locks`
  - migration 戦略 = no-op（新規 migration 追加不要）
  - 物理未実装カラム（idempotency_key 等）の追加要否は **UT-04 で判定**（本タスクは委譲）
- UT-09 への引き継ぎ:
  - 実装で参照する canonical name = `sync_job_logs` / `sync_locks`
  - lock TTL / status enum 値は **U-8 で確定**（本タスクは決定しない）
- U-8 / U-9 直交性チェックリスト:
  - [ ] 本タスクは enum 値（`pending|in_progress|completed|failed` ↔ `running|success|failed|skipped`）を決定しない
  - [ ] 本タスクは `DEFAULT_MAX_RETRIES` を決定しない
  - [ ] 本タスクは `processed_offset` の意味論を決定しない
  - [ ] 本タスクは命名 reconciliation のみを扱う

## 実行手順

### ステップ 1: Phase 1 入力の取り込み

- 真の論点 3 軸 / AC-1〜AC-6 / 4 条件 PASS 根拠を確認する

### ステップ 2: canonical 採択

- 候補 3 案を 4 軸で評価し、案 A を採択
- 採否理由を `naming-canonical.md` に固定

### ステップ 3: マッピング表作成

- 論理 13 カラムを左軸、物理対応を右軸として表化
- 「物理未実装」判定箇所には UT-04 委譲ラベルを付与

### ステップ 4: 後方互換戦略確定

- 4 案比較表を作成、no-op を第一採用
- 案 4（新テーブル+移行）は明示却下

### ステップ 5: 引き継ぎ + 直交性チェックリスト

- UT-04 / UT-09 への引き継ぎ事項を箇条書き化
- U-8 / U-9 直交性チェックリストを作成

### ステップ 6: 整合性自己レビュー

- `database-schema.md` の sync 系記述を grep で確認、drift があれば doc-only 更新案を成果物に含める（grep 結果ゼロなら「drift 不要」を明記）

## 多角的チェック観点

- **破壊性ゼロ確認**: 案 A 採択により `0002_sync_logs_locks.sql` を改変しないことを再確認
- **1:N 翻訳の網羅性**: 論理 13 カラム全てがマッピング表に登場し空欄ゼロ
- **no-op の正当性**: データ消失ゼロ・rollback 不要・監査連続性 100% を表で立証
- **直交性**: enum / retry / offset の決定文言が**一切含まれていない**ことを成果物 grep で自己検証
- **drift 解消**: `database-schema.md` の grep 結果を AC-6 根拠として残す

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | canonical 候補 3 案比較 | 2 | pending | naming-canonical.md |
| 2 | 論理 13 カラム → 物理 1:N マッピング | 2 | pending | column-mapping-matrix.md |
| 3 | 後方互換戦略 4 案比較 | 2 | pending | backward-compatibility-strategy.md |
| 4 | UT-04 / UT-09 引き継ぎ | 2 | pending | handoff-to-ut04-ut09.md |
| 5 | U-8 / U-9 直交性チェックリスト | 2 | pending | handoff-to-ut04-ut09.md |
| 6 | database-schema.md drift 確認 | 2 | pending | AC-6 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/naming-canonical.md | canonical 候補 3 案比較 + 採択（案 A） |
| 設計 | outputs/phase-02/column-mapping-matrix.md | 論理 13 カラム → 物理 1:N マッピング |
| 設計 | outputs/phase-02/backward-compatibility-strategy.md | 4 案比較 + no-op 採択 |
| 設計 | outputs/phase-02/handoff-to-ut04-ut09.md | UT-04 / UT-09 引き継ぎ + 直交性チェックリスト |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [ ] naming-canonical.md に候補 3 案 + 4 軸評価 + 案 A 採択理由が記載
- [ ] column-mapping-matrix.md に論理 13 カラム全ての物理対応 / 委譲先が記載（漏れ・空欄ゼロ）
- [ ] backward-compatibility-strategy.md に 4 案 × 4 軸の比較表 + no-op 採択 + 案 4 の明示却下
- [ ] handoff-to-ut04-ut09.md に UT-04 / UT-09 への引き継ぎ事項が箇条書き
- [ ] handoff-to-ut04-ut09.md に U-8 / U-9 直交性チェックリストが含まれる
- [ ] AC-6 対応として `database-schema.md` の grep 結果（drift 有無）が成果物に明記
- [ ] 成果物 4 ファイルが `outputs/phase-02/` 配下に配置

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビューゲート)
- 引き継ぎ事項:
  - 採用 base case = 案 A（物理 canonical 化）+ no-op
  - PASS / MINOR / MAJOR 判定対象: 概念純度 vs 破壊性、4 案比較の採択妥当性、直交性、aiworkflow-requirements drift 解消可能性
  - UT-04 / UT-09 視点での self-review 観点
- ブロック条件:
  - canonical 採択が代替案比較から導出されていない
  - マッピング表に空欄が残る
  - 案 4（データ消失伴う案）が却下されていない
  - 直交性チェックリストに enum / retry / offset の決定が混入
