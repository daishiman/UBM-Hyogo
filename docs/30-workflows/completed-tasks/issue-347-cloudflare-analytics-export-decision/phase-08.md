# Phase 8 — 運用負荷評価

## 目的

採用方式（GraphQL Analytics API + 月次手動取得）の運用負荷を見積もり、担当・頻度・所要時間を確定する。

## 運用フロー

| 項目 | 値 |
| --- | --- |
| 取得頻度 | 月次（毎月 1 日に前月分を取得） |
| 取得方法 | Cloudflare dashboard の GraphQL Explorer に query 貼付 → JSON コピー → repo に保存 |
| 所要時間 | 5〜10 分 / 回 |
| 担当 | release ops owner（CLAUDE.md governance 参照） |
| commit メッセージ | `chore(analytics): export YYYY-MM long-term evidence` |
| review | solo dev につきレビュー不要、CI gate のみ |

## 自動化（本タスクのスコープ外）

- 後続タスクで `scripts/fetch-cloudflare-analytics.ts` + GitHub Actions cron を作成
- API token は 1Password + scripts/cf.sh 経由で注入
- 本タスクではポリシーのみ確定し、自動化は別 issue で起票（CONST_007 例外: 独立スコープのため別タスクが妥当）

## 出力

- `outputs/phase-08/main.md`: 運用フロー + 自動化スコープ外宣言

## 完了条件

- [ ] 取得頻度が定量定義（月次）
- [ ] 担当が明示
- [ ] 自動化を別タスクとする宣言と理由が記述

## 受け入れ条件（AC mapping）

- AC-2（保存先運用）, AC-3（retention 運用）

## 検証手順

```bash
grep -E "月次|月1|monthly" docs/30-workflows/issue-347-cloudflare-analytics-export-decision/outputs/phase-08/main.md
```

## リスク

| リスク | 対策 |
| --- | --- |
| 月次取得が忘却される | aiworkflow-requirements の release ops checklist に追加（Phase 12 で diff 計画） |
