# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-9 と Phase 4 verify suite と Phase 5 runbook step と Phase 6 failure case を 1 対 1 以上で対応させ、空白セルを 0 にする。

## 実行タスク

1. positive AC matrix
2. negative AC matrix（failure case 12 種）
3. 空白セル check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | AC |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-04.md | verify suite |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-06.md | failure case |

## 実行手順

### ステップ 1: positive AC matrix

### ステップ 2: negative AC matrix

### ステップ 3: 空白セル check

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO 根拠 |
| Phase 11 | manual evidence の checklist |
| 並列 09a | 同 AC matrix の構造を統一 |
| 下流 09c | 同様の AC matrix を production へ転用 |

## 多角的チェック観点（不変条件）

- AC-7 (#5) / AC-8 (#6) / AC-9 (#10) と #15 (rollback) が matrix で完全担保

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | positive AC matrix | 7 | pending | AC-1〜9 |
| 2 | negative AC matrix | 7 | pending | F-1〜12 |
| 3 | 空白セル check | 7 | pending | 0 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | matrix サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | matrix 表 |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 完了条件

- [ ] positive 9 件すべて対応
- [ ] negative 12 件すべて対応
- [ ] 空白 0 件

## タスク100%実行確認【必須】

- 全実行タスクが completed
- ac-matrix.md 完成
- artifacts.json の phase 7 を completed に更新

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: ac-matrix.md
- ブロック条件: 空白 1 件以上で次 Phase に進まない

## AC matrix（positive）

| AC | 内容 | verify suite | runbook step | 不変条件 |
| --- | --- | --- | --- | --- |
| AC-1 | wrangler.toml triggers 定義 | U-1 | cron-deployment Step 1 | - |
| AC-2 | cron 確認方法 runbook 記載 | U-1 + R-1 | cron-deployment Step 2 | - |
| AC-3 | release-runbook.md 完成 | R-1, R-2 | Phase 12 outputs | - |
| AC-4 | incident response runbook | C-1〜C-4 + R-3 | Phase 12 outputs | - |
| AC-5 | dashboard URL 一覧 | U-2 + U-3 | release runbook | - |
| AC-6 | sync_jobs running 参照 | I-1 | cron-deployment Step 3 | - |
| AC-7 | rollback で web D1 操作なし | R-2 | rollback A/B/C/D | #5 |
| AC-8 | GAS apps script trigger なし | U-1 (検査) | - | #6 |
| AC-9 | cron 頻度 100k 内 | C-4 + 試算 | release runbook | #10 |

## AC matrix（negative）

| Failure | 検出 verify suite | 検出 runbook step | mitigation | 不変条件 |
| --- | --- | --- | --- | --- |
| F-1 cron 不動作 | I-1 + 監視 | cron Step 2 | wrangler 再 deploy | - |
| F-2 cron 二重起動 | I-1 | cron Step 3 | guard 強化 | - |
| F-3 sync 連続 fail | I-2 | runbook | cron 一時停止 → 修正 | - |
| F-4 Forms 429 | C-1 | wrangler tail | retry 待機 | - |
| F-5 D1 read timeout | C-2 | wrangler tail | query 最適化 | #10 |
| F-6 D1 write 上限 | C-2 | dashboard | 頻度低下 | #10 |
| F-7 Workers req 上限 | C-4 | dashboard | 頻度低下 | #10 |
| F-8 rollback 不可 | R-2 失敗時 | dashboard | 手動 rollback | - |
| F-9 D1 migration 不整合 | R-2 関連 | rollback C | 後方互換 fix migration | - |
| F-10 secret 漏洩 | (log review) | incident response | secret rotation | - |
| F-11 dashboard URL 変更 | U-2 失敗時 | runbook 走破 | URL 更新 | - |
| F-12 web に D1 import | (`rg`) | - | 02c へ差し戻し | #5 |

## 空白セル check

- positive 9 × 5 列 = 45 セル → 全埋め
- negative 12 × 5 列 = 60 セル → 全埋め
- 合計 105 セル空白 0 件
