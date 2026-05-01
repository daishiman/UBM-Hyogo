# Phase 6 出力: 異常系検証サマリ

## 1. 目的

cron / 監視 / runbook で起こり得る失敗ケース 12 種を `failure-cases.md` に列挙し、それぞれの検出 / mitigation を整理。worker / pages / D1 migration / cron の 4 種 rollback 手順を `rollback-procedures.md` に固定する。

## 2. 失敗ケース 12 種の概要

| # | カテゴリ | 失敗内容 | 重大度（標準） |
| --- | --- | --- | --- |
| F-1 | cron 不動作 | 15 分経っても sync_jobs に新規行なし | P1 |
| F-2 | cron 二重起動 | sync_jobs.running が 2 件以上 | P2 |
| F-3 | sync 連続 fail | sync_jobs.failed が 3 連続 | P1 |
| F-4 | Forms API 429 | rate limit | P2 |
| F-5 | D1 read timeout | timeout | P1 |
| F-6 | D1 write 上限 | writes 100k 接近 | P1 |
| F-7 | Workers req 上限 | req 100k 接近 | P1 |
| F-8 | rollback 不可 | wrangler rollback がエラー | P0 |
| F-9 | D1 migration 不整合 | production migration 適用失敗 | P0 |
| F-10 | secret 漏洩 | log に secret 露出 | P0 |
| F-11 | 監視 dashboard URL 変更 | URL が 404 | P2 |
| F-12 | apps/web に D1 import | bundle に D1Database 出現（不変条件 #5 違反） | P0 |

詳細（検出 / mitigation / 担当者）は `failure-cases.md` 参照。

## 3. rollback 4 種

| 種別 | runbook 章 | 主操作 |
| --- | --- | --- |
| A. Worker | `rollback-procedures.md` § A | `wrangler rollback <id> --env production` |
| B. Pages | `rollback-procedures.md` § B | Cloudflare Dashboard 手動 |
| C. D1 migration | `rollback-procedures.md` § C | 後方互換 fix migration（直接 SQL 禁止） |
| D. Cron | `rollback-procedures.md` § D | `crons = []` 再 deploy |

各 rollback 後の attendance 整合性確認（不変条件 #15）は § attendance 整合性確認 に集約。

## 4. 不変条件への対応

| 不変条件 | 対応 |
| --- | --- |
| #5 | rollback A〜D は `apps/api/wrangler.toml` 経由のみ。`apps/web` 経由 D1 操作は記載しない |
| #6 | 失敗時 mitigation で apps script trigger を選択肢に出さない |
| #10 | F-6/F-7 で無料枠超過の検出 + cron 頻度低下を mitigation に記載 |
| #15 | rollback 後の attendance 重複 / 削除済み除外 SQL を `rollback-procedures.md` に必須記載 |

## 5. 完了条件

- [x] failure case 12 種完成
- [x] 各ケースに検出 + mitigation
- [x] rollback procedures 4 種

## 6. 次 Phase への引き継ぎ

- `failure-cases.md` を Phase 7 negative AC matrix の base に
- `rollback-procedures.md` を Phase 12 release-runbook と incident-response-runbook に転記
