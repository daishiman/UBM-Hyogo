---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 9
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 9 — 観測 / SLO

本 spec は monitoring 実装を含まないが、**観測経路の参照** を governance doc 内に固定して UT-08（監視設計）と連動する。

## 1. quota 使用率の観測経路

| metric | 取得元 | 集計頻度 | 用途 |
| --- | --- | --- | --- |
| `forms.responses.list` 呼び出し回数 | `apps/api/src/jobs/sync-forms-responses.ts:460` の `QUOTA` 分類 + Cloudflare logs | 5 分 | 余裕率算出 |
| 429 / `RESOURCE_EXHAUSTED` 件数 | `apps/api/src/sync/sheets-client.ts:71-93` の retry log | 5 分 | quota 逼迫検知 |
| SA 認証失敗（401 / 403） | 同上 | 5 分 | rotation / 共有設定漏れ検知 |
| Cron 実行成否 | Cloudflare Workers Cron status | per-cron | 同期パイプライン稼働確認 |

## 2. SLO（governance 観点）

| 指標 | 目標値 | 出典 |
| --- | --- | --- |
| quota 余裕率 | ≤ 70%（AC-3 trigger 閾値） | AC-3 / Phase 3-§3 |
| 429 発生率 | < 1%（24h window） | runtime backoff 設計余裕 |
| 同期失敗の連鎖（連続失敗） | ≤ 3 cron まで（4 回目で alert） | UT-08 で確定 |

本 spec は **閾値の根拠 doc** であり、実際の SLI / SLO の dashboard / alert ルールは UT-08 で設計する。

## 3. 観測ログのアクセス手順

```bash
# Cloudflare Workers logs（apps/api）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production

# QUOTA 分類のフィルタ（例）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --search "QUOTA"
```

`wrangler` 直接呼び出しは禁止（CLAUDE.md ルール）。

## 4. SLO 違反時の対応

| 違反 | 一次対応 | 二次対応 |
| --- | --- | --- |
| 余裕率 70% 超（1 週） | cron 間隔見直し（`*/5` → `*/10` 等） | runbook 6 章に基づき再評価 |
| 余裕率 70% 超（2 週連続） | 別 project 切替 trigger 発火（Phase 3-§3） | runbook 6 章フル実行 |
| 429 多発 | runtime backoff が機能しているか確認 | backoff 上限引き上げ検討 |
| SA 401 / 403 | rotation / 共有設定漏れ確認 | UT-25 で secret 再投入 |

## 5. governance doc としてのスコープ

本 spec は dashboard / alert を **作らない**。UT-08 で実装される dashboard が本 spec を参照する形で governance を完結させる。
