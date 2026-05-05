# Phase 7 — 統合検証（09c 親 workflow との整合）

## 目的

09c phase-12 unassigned-task-detection で発見された未タスクが、本ディレクトリ内の AC-1〜8 に完全トレースされていることを確認し、AC ↔ Phase の整合表を確定する。

## AC ↔ Phase mapping

| AC | 主担当 Phase | 検証 Phase |
| --- | --- | --- |
| AC-1 export 方式確定 | Phase 2 | Phase 3 / Phase 11 |
| AC-2 保存先正本化 | Phase 5 | Phase 11 |
| AC-3 retention | Phase 5 | Phase 11 |
| AC-4 集計値限定・PII 除外 | Phase 5 / 6 | Phase 11 |
| AC-5 Free plan 制約確認 | Phase 9 | Phase 9 |
| AC-6 サンプル取得 + redaction | Phase 11 | Phase 11 |
| AC-7 aiworkflow-requirements 導線 | Phase 12 | Phase 12 |
| AC-8 09c root state 据え置き | Phase 10 / 12 | Phase 12 |

## 09c 親仕様との整合

| 項目 | 09c 側 | 本仕様 | 整合 |
| --- | --- | --- | --- |
| 24h post-release verification 範囲 | 24h まで | 24h より長期（>=1 週間 / 月次比較） | 補完関係 |
| evidence path | outputs/phase-11/ | outputs/phase-11/long-term-evidence/ | サブディレクトリで分離 |
| workflow_state | spec_created or completed（変更しない） | spec_created を据え置き宣言 | 一致 |

## 出力

- `outputs/phase-07/main.md`: AC ↔ Phase mapping + 09c 整合表

## 完了条件

- [ ] AC-1〜8 すべてに主担当 / 検証 Phase が割当
- [ ] 09c 側の workflow_state を変更しない宣言が記述
- [ ] unassigned-task-detection.md の完了条件 4 項が AC-1〜AC-6 に対応

## 受け入れ条件（AC mapping）

- AC-1〜8 のトレース確認

## 検証手順

```bash
grep -c "^| AC-" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-07/main.md
# 期待: 8
```

## リスク

| リスク | 対策 |
| --- | --- |
| 09c phase-11 ディレクトリ命名が変更されている | Phase 10 で実 path を `find` 確認後に runbook 化 |
