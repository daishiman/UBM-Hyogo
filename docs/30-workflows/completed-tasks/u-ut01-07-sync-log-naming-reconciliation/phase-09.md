# Phase 9: 品質保証（docs-only QA）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合 (U-UT01-07) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-30 |
| 前 Phase | 8 (ドキュメントリファクタリング) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |

## 目的

本タスクは設計 reconciliation のみ・コード変更 0・migration 改変 0 のため、Phase 9 の品質ゲートはコード品質ゲートではなく **文書品質ゲート** として実施する。
具体的には以下を検証し、Phase 10 の Go/No-Go 判定の根拠を揃える。

1. markdown lint 想定の構造整合（見出し階層 / 表整合 / コードブロック閉じ）
2. 用語整合（`sync_log` 概念 / `sync_job_logs` 物理 ledger / `sync_locks` 物理 lock の使い分け一貫性 grep）
3. AC トレース完全性（AC-1〜AC-6 すべてが Phase 2〜8 のいずれかで仕様確定）
4. 苦戦箇所 4 件 → リスク表 → 対策の連鎖検証（親仕様の苦戦箇所が成果物まで貫通している）
5. aiworkflow-requirements `references/database-schema.md` の現状 drift を grep で実測し Phase 12 へ引き渡す

a11y / 無料枠 / セキュリティスキャン / カバレッジは本タスクの性質上 **対象外**（schema 適用なし・UI なし・コード変更なし）と明記する。

## 実行タスク

1. 構造整合チェック: 各 phase-XX.md と outputs/*.md の見出し階層 / 表閉じ / コードブロック閉じを目視 + 簡易スクリプトで確認する（完了条件: 構造エラー 0）。
2. 用語整合 grep: 「`sync_log`（概念）」「`sync_job_logs`（物理 ledger）」「`sync_locks`（物理 lock）」の使い分けが Phase 2〜8 全文で一貫しているか rg で確認する（完了条件: 不整合 0）。
3. AC トレース完全性: AC-1〜AC-6 と Phase 2〜8 成果物のマッピングを表化し、PASS / FAIL を確定する（完了条件: 全 AC が成果物に紐付く）。
4. 苦戦箇所連鎖検証: 親仕様の苦戦箇所 4 件が「リスクと対策表 → Phase 2 採択ロジック → Phase 8 単一正本」へ貫通しているか確認する（完了条件: 4 件すべてに貫通経路を特定）。
5. aiworkflow-requirements drift 実測: `.claude/skills/aiworkflow-requirements/references/database-schema.md` 内の `sync_log` / `sync_job_logs` / `sync_locks` 言及を rg で実測し、現状 drift（言及あり / なし / 不一致）を表化して Phase 12 へ引き渡す（完了条件: drift 表が完成）。
6. line budget 確認: 各 phase-XX.md が 100-250 行、outputs/*.md が 50-400 行、index.md が 250 行以内（完了条件: 全 PASS / 逸脱は Phase 10 で分割検討）。
7. mirror parity / a11y / 無料枠 / セキュリティの非該当判定を明記する（完了条件: それぞれ N/A 理由が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/phase-08.md | DRY 化済み構造 |
| 必須 | docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/ | 単一正本群 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | AC-1〜AC-6・苦戦箇所・リスク表 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理 canonical の正本（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理利用フロー（Read のみ） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | drift 実測対象 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-09.md | 書式模倣元 |

## 文書品質ゲート

| 観点 | チェック内容 | 合格条件 |
| --- | --- | --- |
| 構造整合 | 見出し階層・表閉じ・コードブロック閉じ | エラー 0 |
| 用語整合 | 概念 / 物理 canonical の使い分け | 不整合 0 |
| AC トレース | AC-1〜AC-6 × 成果物 | 全 PASS |
| 苦戦箇所連鎖 | 親仕様 4 件 → リスク → 対策 → 成果物 | 全件貫通 |
| aiworkflow-requirements drift | `database-schema.md` の sync 系記述 | drift 実測表完成 |
| line budget | phase-XX.md 100-250 行 / outputs 50-400 行 / index 250 行以内 | 全 PASS（逸脱は Phase 10 検討） |
| mirror parity | `.claude` ↔ `.agents` 同期 | N/A（本タスクは skill 資源を更新しない） |
| a11y | WCAG 2.1 | 対象外（UI なし） |
| 無料枠 | D1 storage / reads / writes | 対象外（DDL 適用なし） |
| セキュリティスキャン | PII / Secrets | 対象外（コード変更なし） |

## 用語整合 grep 計画

```bash
# 概念名（必ず注釈付き）の出現箇所
rg -n "sync_log\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 物理 ledger（注釈不要）
rg -n "sync_job_logs\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 物理 lock（注釈不要）
rg -n "sync_locks\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/

# 旧揺れ表記（After で 0 件であるべき）
rg -n "sync_logs\b|sync_lock\b" docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/
```

期待値: 旧揺れ表記が 0 件、概念 `sync_log` には注釈が付与されている。

## AC トレース表

| AC | 内容 | 仕様確定先 | 判定 |
| --- | --- | --- | --- |
| AC-1 | canonical 命名決定 + 採択理由 | Phase 2 outputs `naming-canonical.md` | PASS |
| AC-2 | 論理 13 カラム × 物理対応 1:N マッピング表 | Phase 2 outputs `column-mapping-matrix.md` | PASS |
| AC-3 | 後方互換 4 案比較 + 採択 + 却下理由 + データ消失なし明示 | Phase 2 outputs `backward-compatibility-strategy.md` | PASS |
| AC-4 | UT-04 引き継ぎ migration 戦略 | Phase 2 outputs `handoff-to-ut04-ut09.md` | PASS |
| AC-5 | U-8 / U-9 直交性チェックリスト | Phase 2 outputs `handoff-to-ut04-ut09.md` | PASS |
| AC-6 | aiworkflow-requirements drift 整合確認 + 必要時 doc-only 更新案 | Phase 9 drift 実測 + Phase 12 で formalize | PASS（実測は本 Phase で実施） |

## 苦戦箇所連鎖検証

| # | 親仕様 苦戦箇所 | リスク表 該当行 | 対策ルート | 成果物 |
| --- | --- | --- | --- | --- |
| 1 | 論理正本 vs 物理稼働の優先順位判断軸 | 二重 ledger 化 | 採択基準を明文化（「破壊的変更コスト < 概念純度」） | `naming-canonical.md` |
| 2 | 論理 1 vs 物理 2 テーブル翻訳の漏れ | 論理→物理マッピング誤訳 | 1:N マッピング表で N:0/1/M 対応許容 | `column-mapping-matrix.md` |
| 3 | 「何もしない」を明示しないと migration 衝突 | migration 衝突 / データ消失 | no-op 採択でも採否理由必須 | `backward-compatibility-strategy.md` |
| 4 | U-8 / U-9 とのスコープ境界曖昧 | 直交タスク侵食 | 直交性チェックリスト | `handoff-to-ut04-ut09.md` |

## aiworkflow-requirements drift 実測計画

```bash
# 実測コマンド（実行は Phase 11 / Phase 12）
rg -n "sync_log\b|sync_logs\b|sync_job_logs\b|sync_locks\b" \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

| 観点 | 期待結果 | drift 判定 |
| --- | --- | --- |
| 物理 canonical（`sync_job_logs` / `sync_locks`）の言及 | 0 件以上 | 0 件 → 既存記述 drift なし、追補要否は UT-04 で判定 |
| 論理概念 `sync_log` の単独言及 | 注釈付き or 0 件 | 注釈なし → drift あり |
| 旧揺れ `sync_logs` / `sync_lock` | 0 件 | 1 件以上 → drift あり |

drift が検出された場合は AC-6 充足のため Phase 12 で doc-only 更新案を成果物に含める（実適用は実装フェーズではなく本タスクの doc-only スコープ内）。

## line budget 計測対象

| ファイル種別 | 上限 | 下限 | 想定 |
| --- | --- | --- | --- |
| `index.md` | 250 行 | - | 200 行前後 |
| `phase-01.md` 〜 `phase-13.md` | 250 行 | 100 行 | 各 150-220 行 |
| `outputs/phase-XX/*.md` | 400 行 | 50 行 | 個別判定 |

## 非該当判定の明記

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| a11y | 対象外 | UI なし・schema 設計 reconciliation のみ |
| 無料枠 | 対象外 | DDL 発行 0 / migration 適用 0 / D1 書き込み 0 |
| セキュリティスキャン | 対象外 | コード変更 0 / Secrets / PII 取り扱い 0 |
| mirror parity | N/A | `.claude/skills/aiworkflow-requirements/references/database-schema.md` への doc-only 更新が発生する場合のみ Phase 12 で .agents 同期を発火、本 Phase は drift 実測のみ |
| カバレッジ | 対象外 | テスト追加 0 |

## 実行手順

### ステップ 1: 構造整合チェック
- 各 .md の見出し階層 / 表 / コードブロック閉じを目視確認。

### ステップ 2: 用語整合 grep
- 上記 4 コマンドを実行し、結果を `outputs/phase-09/main.md` に貼付。

### ステップ 3: AC トレース表作成
- AC-1〜AC-6 を Phase 2〜8 成果物にマッピング。

### ステップ 4: 苦戦箇所連鎖検証
- 親仕様 4 件 → リスク → 対策 → 成果物の貫通経路を表化。

### ステップ 5: aiworkflow-requirements drift 実測
- 上記 rg コマンドで実測し drift 表を完成。

### ステップ 6: line budget 計測
- `wc -l` で全ファイル行数を取得。

### ステップ 7: 非該当判定明記
- a11y / 無料枠 / セキュリティ / mirror / カバレッジの 5 観点に N/A 理由を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 文書品質ゲート結果を Go/No-Go 判定の根拠に使用 |
| Phase 11 | 用語整合 grep / drift 実測コマンドを manual-smoke-log に再実行可能形式で引き渡す |
| Phase 12 | aiworkflow-requirements drift を documentation 更新で formalize |
| UT-04 | 用語統一済み引き継ぎ事項を migration 計画の入力として引き渡す |
| UT-09 | canonical name を mapper 実装の入力として引き渡す |

## 多角的チェック観点

- 価値性: Phase 10 が単一の品質ゲート結果を見るだけで判定できる。
- 実現性: docs-only であり、grep / wc / 目視のみで完結する。
- 整合性: 用語統一 + AC トレース + 苦戦箇所連鎖の 3 軸で抜け漏れを検出。
- 運用性: aiworkflow-requirements drift 実測コマンドが Phase 11 / 12 で再利用可能な形式。
- 認可境界: 本 Phase は読み取り（Read / grep）のみで権限境界を変更しない。
- 直交性: U-8 / U-9 の判定を含めない（直交性チェックリストの存在のみ確認）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 構造整合チェック | 9 | spec_created | エラー 0 |
| 2 | 用語整合 grep | 9 | spec_created | 4 コマンド |
| 3 | AC トレース表 | 9 | spec_created | AC-1〜AC-6 |
| 4 | 苦戦箇所連鎖検証 | 9 | spec_created | 4 件 |
| 5 | aiworkflow-requirements drift 実測 | 9 | spec_created | rg 実行 |
| 6 | line budget 計測 | 9 | spec_created | wc 実行 |
| 7 | 非該当判定明記 | 9 | spec_created | 5 観点 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 文書品質ゲート結果（grep / AC トレース / drift / line budget / 非該当判定） |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] 構造整合チェックでエラー 0
- [ ] 用語整合 grep で旧揺れ 0 件確認
- [ ] AC-1〜AC-6 すべてが成果物に紐付き PASS 判定
- [ ] 苦戦箇所 4 件すべての貫通経路が特定済み
- [ ] aiworkflow-requirements drift 実測表が作成済み（drift あり / なしの結論を含む）
- [ ] line budget が全ファイルで PASS（逸脱は Phase 10 で分割検討）
- [ ] a11y / 無料枠 / セキュリティ / mirror / カバレッジの 5 観点に N/A 理由が記述
- [ ] outputs/phase-09/main.md が作成済み

## タスク 100% 実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-09/main.md` 配置予定
- 文書品質ゲート 6 観点すべてに合否判定
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビューゲート)
- 引き継ぎ事項:
  - 文書品質ゲート全 PASS（または逸脱と是正方針）
  - aiworkflow-requirements drift 実測結果（あり / なし / 件数）
  - AC-1〜AC-6 全 PASS の確認結果
  - 苦戦箇所 4 件の貫通経路
  - 非該当判定（a11y / 無料枠 / セキュリティ / mirror / カバレッジ）
- ブロック条件:
  - 旧揺れ表記が残置している
  - AC のいずれかが成果物に紐付かない
  - drift 実測未完了
