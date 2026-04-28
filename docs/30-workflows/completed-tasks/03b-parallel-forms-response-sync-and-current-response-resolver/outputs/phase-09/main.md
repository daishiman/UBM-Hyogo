# Phase 9: 運用面（Free-tier / Secrets / Logging）

## 観点

- Cloudflare 無料枠の上限内に収まるか（cron 起動回数 / D1 R/W / Workers CPU 時間）
- Forms API quota とリトライ戦略の整合
- secret hygiene（`.env` を直接読まないこと、ログに email / token を残さないこと）
- 観測（`sync_jobs.metrics_json`）

## 結論

- `*/15 * * * *` (= 1 日 96 回) + `0 */6 * * *` (= 1 日 4 回) で **1 日 100 invocations 以下**、Workers Free 100k req/day に対し十分なマージン
- D1 Free 5M reads / 100k writes / day に対し、本同期は 1 cron あたり最大 200 writes（`writeCap`）→ 1 日最大 19,200 writes、Free 枠内
- Forms API quota（プロジェクト単位）は 100 req/100s 程度の実績、`pageSize=100` + `*/15min` で十分余裕
- secret は **すべて 1Password 参照（`.env` には `op://...` のみ）→ Cloudflare Secrets** に二段階で隔離
- log には email / token を出さない（`redact()` 通過）

→ 詳細は `free-tier-estimate.md` / `secret-hygiene.md`
