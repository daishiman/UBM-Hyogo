# Phase 10 — ローカル検証

本タスクは **production runtime 状態を直接対象とする runtime ops** であり、ローカル / staging では再現できない事象 (Cloudflare Secrets 投入 / production cron 発火) を扱う。したがって本 Phase は「該当なし」扱いとする。

## 10.1 該当なし宣言

- localhost dev (`wrangler dev`) / miniflare では production secrets / cron schedule を再現しないため、本タスクの AC を local で測定する手段は存在しない。
- staging 環境は本タスクの対象外 (Issue #956 は production 環境の Forms ingest 復旧が目的)。

## 10.2 代替検証

| 種別 | 実施先 | 参照 |
|------|--------|------|
| H1 検出ロジック単体回帰 | 既存 vitest (`apps/api/src/diagnostics/forms-pipeline.spec.ts`) | 親 PR #960 で実施済 |
| snapshot schema 契約 | 既存 contract spec | 同上 |
| sync-lock TTL 回収 | 既存 unit (`apps/api/src/jobs/sync-lock.ts` 由来 spec) | 同上 |
| production AC 達成 | Phase 05 S1〜S9 で取得する evidence | `outputs/phase-11/` |

## 10.3 ローカルで実施するチェック

下記は **本タスク commit 前** に走らせる docs 整合チェックのみ:

```bash
mise exec -- pnpm typecheck      # コード差分が混入していないことを確認 (期待: pass)
mise exec -- pnpm lint           # 同上
bash scripts/verify-pr-ready.sh  # docs-only gate (phase12 compliance / artifacts schema / indexes drift)
```

これら 3 つは「本タスクが docs-only である」自体の不変条件検証であり、production runtime AC とは別の gate。
