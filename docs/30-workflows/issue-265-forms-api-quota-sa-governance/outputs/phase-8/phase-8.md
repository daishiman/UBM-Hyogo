---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 8
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 8 — 運用 / リスク

## 1. リスク一覧

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R-1 | 旧 Sheets API 文脈の混入（用語ドリフト） | 読み手の混乱・誤実装 | 本 spec 内すべて Forms API 文脈に統一。`Sheets API` の表記は「旧 / 移行済」コンテキストでのみ使用 |
| R-2 | SA メール / project ID / API Token の実値混入 | 機密漏洩 / AI 学習汚染 | Phase 4 grep gate #1〜#3 で 0 件確認。Phase 11 secret-grep-log.md にログ残置 |
| R-3 | 別 API（Drive API watch / Calendar API / Apps Script）同居発生 | quota 競合・SA 影響範囲拡大 | 同居検知時に SA 分離 trigger 発火（Phase 3-§2）。本 spec の `outputs/phase-11/sa-separation-policy.md` を再評価 |
| R-4 | cron 間隔 / batch size の変更で余裕率が 70% 超過 | quota 逼迫 | `apps/api/wrangler.toml` の `[triggers]` 変更時に本 spec の `quota-allocation-table.md` を併修義務化（runbook 5 章） |
| R-5 | `wrangler` 直接呼び出しによる ESBUILD バージョン不整合 / OAuth トークン残置 | deploy 失敗・トークン漏洩 | runbook で `bash scripts/cf.sh` 一本化を明記（CLAUDE.md 準拠） |
| R-6 | 別 project 切替時の Form 共有設定漏れで 403 多発 | 復旧長時間化 | Phase 3-§3 切替手順 4 ステップを runbook 6 章に転記 |
| R-7 | UT-03 CLOSED 後に本 spec への参照が孤立 | 知識消失 | Phase 7-§3 で aiworkflow `deployment-secrets-management.md` への cross-link 提案を残置 |

## 2. 運用ポリシー

| 項目 | ポリシー |
| --- | --- |
| 本 spec の更新トリガー | (a) cron / batch 変更 (b) 別 API 同居発生 (c) SA rotation (d) project 切替 |
| レビュアー | solo dev（CI gate + grep gate で品質担保） |
| 監査対象 | `outputs/phase-11/secret-grep-log.md` の 0 件状態 |

## 3. 将来同居発生時の追記運用

別 API（Drive API / Calendar API / Apps Script）が同 project で稼働開始した場合の追記フロー:

1. `outputs/phase-11/quota-allocation-table.md` に新 API 行を追加。
2. 配分余裕率を再計算し、70% 超なら Phase 3-§3 trigger に到達するか判定。
3. SA 分離フローを再評価（`outputs/phase-11/sa-separation-policy.md`）。
4. 必要なら本 spec を「v2」として更新（破壊的変更ではなく追記）。

## 4. 廃止条件

本 spec は **Forms API 撤退** または **同期方式根本変更**（push 化等）が決定した時点で `completed-tasks/` ではなく **新 spec で置換**する。それまで standalone governance doc として維持。
