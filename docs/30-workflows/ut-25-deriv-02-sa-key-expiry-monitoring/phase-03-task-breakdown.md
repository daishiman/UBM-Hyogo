---
phase: 3
title: Task Breakdown
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 3: Task Breakdown — SA key 失効監視

[実装区分: 実装仕様書]

## SRP に基づく step 一覧（CONST_007: すべて 1 サイクル完了前提）

| step | 内容 | 主担当ファイル | 出力 |
| --- | --- | --- | --- |
| step-01 | `sheets-auth-classifier.ts` 実装 — 純関数で 401/403/その他を `SheetsAuthClassification` に分類 | `apps/api/src/jobs/sheets-auth-classifier.ts` | 関数 export + 型 export |
| step-02 | `sheets-auth-logger.ts` 実装 — classifier 結果を `console.error` で構造化ログ化 | `apps/api/src/jobs/sheets-auth-logger.ts` | 関数 export |
| step-03 | 既存 sync ジョブへ catch → log → rethrow injection | `apps/api/src/sync/backfill.ts`、`apps/api/src/sync/manual.ts`、`apps/api/src/jobs/sync-sheets-to-d1.ts` | diff（既存 throw 経路維持） |
| step-04 | `sheets-auth-healthcheck.ts` 実装 — Sheets API 最小 read を発行し classifier に渡す | `apps/api/src/scheduled/sheets-auth-healthcheck.ts` | 関数 export |
| step-05 | 既存 `*/15 * * * *` cron に health check を `ctx.waitUntil` で相乗り | `apps/api/src/index.ts`（scheduled 401-510） | 1〜2 行追記。新規 cron 追加なし |
| step-06 | `alert-relay.ts` payload に `category: 'sheets-auth'` を拡張 | `apps/api/src/routes/internal/alert-relay.ts` | zod schema 更新 + 既存 dedup 流用 |
| step-07 | rollback-runbook 逆参照追記 | `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` | 冒頭 1 段落追記 |
| step-08 | staging dry-run 検証手順整備（コード変更なし） | Phase 10 / Phase 11 | 検証ログ |
| step-09 | production roll-out 手順整備（コード変更なし） | Phase 10 / Phase 13 | runbook |

## step 間の依存関係

```
step-01 ─┬─ step-02 ─┬─ step-03 ───┐
         │           │             ├─ step-08 ─ step-09
         └─ step-04 ─┴─ step-05 ───┤
                        step-06 ───┘
                        step-07 (独立)
```

## 各 step の SRP 自己点検

- step-01: 「分類のみ」担当。ログ出力・通知は含まない。
- step-02: 「ログ出力のみ」担当。通知判断は含まない（呼び出し元責務）。
- step-04: 「能動検出のみ」担当。分類とログは step-01/02 に委譲。
- step-05: 「相乗り配線のみ」担当。実装は step-04 に委譲。
- step-06: 「通知 payload 拡張のみ」担当。dedup は既存ロジック流用。

## CONST_007 補足

各 step は単独でレビュー・PR 可能な粒度に維持するが、本 issue は 1 PR で完結させる方針（base=dev、production 適用は merge 後 manual deploy）。
