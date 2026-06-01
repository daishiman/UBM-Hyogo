# Phase 3 Output: 設計レビュー（判定再解釈方針固定）

## 1. 監査タスク再解釈方針の宣言（冒頭固定）

本 workflow は **NON_VISUAL / 設計判定タスク** であり、実装タスク骨格を機械適用しない。Phase の責務を以下に再解釈する。

| Phase | 監査タスクでの責務 | 主成果物 |
| --- | --- | --- |
| 4 | raw evidence 収集（rg/grep 検索ログの一次記録） | outputs/phase-04/raw-evidence.md |
| 5 | 判定確定（Phase 2 verdict の承継・docs-only 確定・解除条件） | outputs/phase-05/verdict-runbook.md |
| 6 | 異常系 = 誤判定シナリオ（過剰実装 / 早期却下 / 解除条件未記録） | outputs/phase-06/failure-cases.md |
| 8 | 正本突合（DRY 化の代替：親 close-out §(d) / task-workflow.md との重複排除） | outputs/phase-08/main.md |
| 9 | 品質保証 = 正本整合監査 | outputs/phase-09/main.md |
| 11 | 再現コマンド実行 → 0 差分確認（screenshot 不要） | outputs/phase-11/manual-test-result.md |

## 2. 代替案比較

| 案 | 価値 | コスト | 整合性 | 採否 |
| --- | --- | --- | --- | --- |
| A. 新設要（`sync_audit_logs` + `sync_audit_outbox` を今作る） | 将来監査要件に先回り | 高（DDL 2 + writer + flush job + test）。実需なしの過剰実装 | 判定基準 4.3 の 3 条件すべて非該当に反する | **却下** |
| B. `sync_jobs` 拡張（カラム追加） | 中間 | 中（DDL 変更 + migration） | `metrics_json` が passthrough zod で拡張済みのため DDL 変更不要 | **却下**（拡張も不要） |
| C. 新設不要（現行 ledger で充足・docs-only 確定） | 「保留」を確定判定へ閉じ、過剰実装と再 litigation を同時回避 | 最小（コード変更ゼロ） | 親 §(d) 解除条件・不変条件 #4/#5 と整合 | **採用** |

## 3. Phase 11 特化の宣言

- UI/UX 変更なしのため Phase 11 スクリーンショット不要。
- Phase 11 は「現行 ledger 群の存在」「`sync_audit_*` の非存在」を再現コマンドで再確認し、判定の前提が崩れていないことを 0 差分で確認することに特化する。

## 4. MINOR / MAJOR 判定

| 重大度 | 件数 | 内容 |
| --- | --- | --- |
| MAJOR | 0 | 判定論理に致命的な穴なし（3 条件非該当が実測で裏付け済み） |
| MINOR | 0 | N/A。判定は現行コードに完全に閉じており、追跡すべき残課題なし。将来トリガ T-1〜T-3 は未タスク化対象ではない（実需発生時に新規起票する将来条件） |

> MINOR 0 件のため Phase 12 未タスク検出は「0 件 + baseline 説明」で閉じる。

## 5. 判定: Phase 4 へ進行可（GO）

Phase 2 の「新設不要」確定を Phase 4 以降で証跡化・確認する。論点の再定義は不要。
