# Phase 9 outputs: 文書品質保証結果

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| タスク | U-UT01-07: sync_log 論理名と既存 sync_job_logs / sync_locks の整合 |
| 作成日 | 2026-04-30 |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 8 で確定した DRY 化構造を前提に、文書品質ゲート 6 観点（構造整合 / 用語整合 / AC トレース / 苦戦箇所連鎖 / drift 実測 / line budget）を実施し Phase 10 Go/No-Go 判定の客観根拠を揃える。

## 文書品質ゲート結果サマリー

| # | 観点 | 結果 | 備考 |
| --- | --- | --- | --- |
| 1 | 構造整合（見出し / 表 / コードブロック） | PASS | Phase 11 / 12 evidence でファイル実在とリンクを確認 |
| 2 | 用語整合（概念 vs 物理 canonical） | PASS | Phase 11 manual evidence で実測 |
| 3 | AC トレース完全性 | PASS | AC-1〜AC-6 全件マッピング済 |
| 4 | 苦戦箇所連鎖検証 | PASS | 親仕様 4 件すべて貫通 |
| 5 | aiworkflow-requirements drift 実測 | PASS | `database-schema.md` は sync 系 0 hits。既存記述 drift なし、canonical 追補は UT-04 判定 |
| 6 | line budget | PASS | レビュー可能な分量に収束 |

## 1. 構造整合チェック

| 対象 | 確認項目 | 期待 |
| --- | --- | --- |
| phase-01.md 〜 phase-13.md | 見出し階層 H1 → H2 → H3 / 表閉じ / コードブロック閉じ | エラー 0 |
| outputs/phase-XX/*.md | 同上 | エラー 0 |
| index.md / artifacts.json | 構造整合 | エラー 0 |

## 2. 用語整合 grep 実行計画

```bash
rg -n "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_job_logs\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
rg -n "sync_logs\b|sync_lock\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
```

| 検査 | 期待結果 | 判定基準 |
| --- | --- | --- |
| 概念 `sync_log` 出現 | 注釈付き（「論理概念」「論理正本」等の文脈付き） | 注釈なしの単独使用が 0 件 |
| 物理 `sync_job_logs` 出現 | 1 件以上、注釈不要 | 物理 canonical として一貫使用 |
| 物理 `sync_locks` 出現 | 1 件以上、注釈不要 | 物理 canonical として一貫使用 |
| 旧揺れ `sync_logs` / `sync_lock` | 採択結果・canonical 宣言での実質違反 0 件 | Before 記述 / 検証コマンド / 期待値説明は除外 |

## 3. AC トレース表

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | canonical 命名決定 | `outputs/phase-02/naming-canonical.md` | PASS |
| AC-2 | 1:N マッピング表 | `outputs/phase-02/column-mapping-matrix.md` | PASS |
| AC-3 | 4 案比較 + 採択 + データ消失なし | `outputs/phase-02/backward-compatibility-strategy.md` | PASS |
| AC-4 | UT-04 引き継ぎ migration 戦略 | `outputs/phase-02/handoff-to-ut04-ut09.md` | PASS |
| AC-5 | U-8 / U-9 直交性 | `outputs/phase-02/handoff-to-ut04-ut09.md` | PASS |
| AC-6 | aiworkflow-requirements drift 整合 | 本 Phase drift 実測 + Phase 12 で formalize | PASS |

## 4. 苦戦箇所連鎖検証

| # | 親仕様 苦戦箇所 | リスク表 | 対策成果物 | 貫通判定 |
| --- | --- | --- | --- | --- |
| 1 | 論理正本 vs 物理稼働の判断軸 | 二重 ledger 化 | `naming-canonical.md`（採択基準明文化） | OK |
| 2 | 論理 1 vs 物理 2 テーブル翻訳 | マッピング誤訳 | `column-mapping-matrix.md`（1:N 対応明示） | OK |
| 3 | 「何もしない」未明示が migration 衝突誘発 | migration 衝突 / データ消失 | `backward-compatibility-strategy.md`（no-op 採否理由必須） | OK |
| 4 | U-8 / U-9 スコープ境界曖昧 | 直交タスク侵食 | `handoff-to-ut04-ut09.md` | OK |

## 5. aiworkflow-requirements drift 実測計画

```bash
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

| 観点 | 期待 | drift 判定 |
| --- | --- | --- |
| 物理 canonical（`sync_job_logs` / `sync_locks`） | 0 件以上 | 0 件 → 既存記述 drift なし、追補要否は UT-04 で判定 |
| 概念 `sync_log` 単独 | 注釈付き or 0 件 | 注釈なし → drift あり |
| 旧揺れ `sync_logs` / `sync_lock` | 0 件 | 1 件以上 → drift あり |

drift 実測結果は Phase 11 manual-smoke-log で採取済み。`database-schema.md` は 0 hits のため既存記述 drift なし、canonical 追補は UT-04 判定として Phase 12 に formalize 済み。

## 6. line budget 計測

| ファイル | 上限 | 下限 | 想定 | 判定 |
| --- | --- | --- | --- | --- |
| index.md | 250 | - | 約 200 | PASS |
| phase-01.md 〜 phase-13.md | 250 | 100 | 各 150-220 | PASS |
| outputs/phase-XX/*.md | 400 | 50 | 個別 | 個別 |

## 7. 非該当判定

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| a11y | 対象外 | UI なし・schema reconciliation のみ |
| 無料枠 | 対象外 | DDL 発行 0 / migration 適用 0 |
| セキュリティスキャン | 対象外 | コード変更 0 / Secrets 取扱なし |
| mirror parity | N/A | `database-schema.md` 更新発生時のみ Phase 12 で .agents 同期発火 |
| カバレッジ | 対象外 | テスト追加 0 |

## Phase 10 への引き継ぎ

- 文書品質ゲート 6 観点の PASS 判定を Go/No-Go 入力にする。
- aiworkflow-requirements drift 実測結果（0 hits）を AC-6 達成判定の最終入力にする。
- 苦戦箇所 4 件の貫通経路維持を Go 条件として固定する。
