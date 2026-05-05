# Phase 8 outputs: ドキュメントリファクタリング結果

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜7 で蓄積した文書資産を DRY 化し、Phase 9 (QA) / Phase 10 (Go/No-Go) が単一正本を参照するだけで判定できる構造へ最適化する。

## Before / After 比較サマリー

### 1. 用語統一

- **Before**: `sync_log` / `sync_logs` / `sync_job_logs` / `sync_lock` / `sync_locks` が混在
- **After**:
  - 論理概念 = `sync_log`（必ず注釈付き）
  - 物理 ledger = `sync_job_logs`
  - 物理 lock = `sync_locks`
- 検証コマンド: `rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/`

### 2. マッピング表の構造正規化

| 項目 | Before | After |
| --- | --- | --- |
| 配置 | Phase 2 / 3 / 5 で類似表が再記述 | `outputs/phase-02/column-mapping-matrix.md` 単一正本 |
| 列構成 | 3 列（論理 / 物理 / 備考） | 4 列（論理カラム / 物理対応テーブル / 物理対応カラム / 判定） |
| 行数 | 一部漏れ（`idempotency_key` 等） | 論理 13 カラム全件 |
| 判定値 | 自由文 | `対応済` / `未実装` / `不要` の 3 値固定 |

### 3. 4 案比較表の評価軸正規化

| 項目 | Before | After |
| --- | --- | --- |
| 評価軸 | 案ごとにバラバラ | 4 軸固定（破壊性 / 実装コスト / 監査連続性 / rollback 容易性） |
| 採択表記 | 自由文 | `採択 ★` / `却下（理由: …）` |
| データ消失リスク | 一部欠落 | 全案に「有 / 無 / 限定的」必須付与 |

### 4. cross-link 強化

| 項目 | Before | After |
| --- | --- | --- |
| phase ↔ outputs | 一部欠落 | 全 phase-XX.md に必須 |
| 親仕様 link | テキスト言及のみ | `../unassigned-task/U-UT01-07-...` 必須 |
| UT-04 / UT-09 link | 未付与 | 該当 phase 番号付き相対 link |
| aiworkflow-requirements link | 未記載 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` 必須 |

## 重複集約方針（単一正本の確定）

| # | 重複対象 | 集約先 | 他 Phase の扱い |
| --- | --- | --- | --- |
| 1 | canonical 採択理由文 | `outputs/phase-02/naming-canonical.md` | link 参照のみ |
| 2 | マッピング表 13 行 | `outputs/phase-02/column-mapping-matrix.md` | link 参照のみ |
| 3 | 4 案比較表 | `outputs/phase-02/backward-compatibility-strategy.md` | link 参照のみ |
| 4 | 直交性チェックリスト（U-8 / U-9） | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |
| 5 | UT-04 引き継ぎ事項 | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |
| 6 | UT-09 引き継ぎ事項 | `outputs/phase-02/handoff-to-ut04-ut09.md` | link 参照のみ |

## navigation drift 検証結果

| チェック項目 | 確認方法 | 結果 |
| --- | --- | --- |
| artifacts.json × 実 path | grep 突き合わせ | 一致（spec_created 段階の予定値） |
| phase-XX.md ↔ outputs link | 全リンク辿り | 切れ 0（spec_created 段階） |
| 親 unassigned-task 参照 | 相対 path 確認 | 実在 |
| UT-04 / UT-09 引き渡し先 | 相対 path 確認 | 実在 |
| aiworkflow-requirements drift 対象 | path 実在確認 | 実在（drift 実測は Phase 9） |

## 削除対象

- Phase 3〜5 の重複した採択理由文（→ Phase 2 link へ置換）
- Phase 6 / 7 の重複した 4 案比較表（同上）
- 旧用語 `sync_logs`（複数形）/ `sync_lock`（単数形）の単独表記
- GAS prototype 由来の旧名残置（該当箇所があれば削除）

## 共通化パターンの確定

- 概念 vs 物理: 概念名は `sync_log`（必ず注釈付き）、物理 canonical は `sync_job_logs` / `sync_locks` の 2 テーブル分離。
- 集約: マッピング・4 案比較・直交性チェックリスト・UT-04 / UT-09 引き継ぎはすべて `outputs/phase-02/` 配下の単一正本へ。
- 評価軸: 4 軸固定（破壊性 / 実装コスト / 監査連続性 / rollback 容易性）。
- 引き継ぎ表記: `<タスク ID> phase-XX` 形式（例: `UT-04 phase-02`）で必ず Phase 番号併記。

## Phase 9 への引き継ぎ

- 統一済み用語ルールを Phase 9 grep 検証で再確認する。
- 単一正本化された 6 集約先を Phase 9 品質ゲート対象に固定する。
- aiworkflow-requirements drift を Phase 9 で実測（Phase 8 では構造のみ整理済み）。
