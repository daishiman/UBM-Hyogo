# Phase 02 Decision Matrix

state: completed

## 採用判断

採用: **GraphQL Analytics API（aggregate-only query）**

Fallback: dashboard 手動 CSV export（保存前 redaction 必須）

Reject: dashboard screenshot（数値 diff と PII 不在検証に弱い）

| 評価軸 | GraphQL Analytics API | 手動 CSV | Screenshot |
| --- | --- | --- | --- |
| Free plan 整合 | PASS: API 自体は全 plan 共通制限で利用、dataset availability は settings で確認 | PASS: dashboard 操作で取得 | PASS: dashboard 目視 |
| 自動化適性 | PASS: 後続 cron fetcher に接続しやすい | MINOR: 手動操作前提 | REJECT: OCR / 手動読取が必要 |
| PII 混入リスク | PASS: aggregate field のみ select | MINOR: CSV 列削除が必要 | MINOR: 画面表示範囲依存 |
| 比較分析 | PASS: JSON 数値 diff 可能 | PASS: CSV 数値 diff 可能 | REJECT: 機械比較不可 |
| retention 管理 | PASS: repo path + 12件 retention | PASS | MINOR: 画像が肥大化 |
| 運用負荷 | PASS: 月次 5-10 分 | MINOR: 手順が長い | MINOR: 人手判定が増える |
| 後続拡張 | PASS: token + script 化可能 | MINOR | REJECT |

## 判定

GraphQL Analytics API を canonical にする。Cloudflare GraphQL API は global / user / node の 3 層制限を持つため、Phase 9 では「API がある」だけではなく、対象 account / zone の dataset availability と node limits を確認対象にする。

CSV fallback は GraphQL dataset が当該 plan / account で利用不可だった場合の緊急手段に限定する。Screenshot は long-term analytics evidence ではなく UI 操作証跡であり、本タスクの目的から外す。
