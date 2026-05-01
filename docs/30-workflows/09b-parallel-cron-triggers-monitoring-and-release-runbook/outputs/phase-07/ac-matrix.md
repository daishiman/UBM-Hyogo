# ac-matrix

## Positive AC matrix（AC-1〜AC-9）

| AC | 内容 | verify suite | runbook step | failure case 関連 | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | wrangler.toml `[triggers] crons` 正本記録 | U-1 | cron-deployment Step 1 | F-1（cron 不動作） | - |
| AC-2 | cron 確認方法 runbook 記載（`wrangler deployments list` + Dashboard Triggers） | U-1 + R-1 | cron-deployment Step 2 | F-1, F-11 | - |
| AC-3 | release-runbook.md 完成（go-live + rollback + cron 制御） | R-1, R-2, R-3 | Phase 12 outputs/phase-12/release-runbook.md | F-1, F-3, F-8, F-9 | - |
| AC-4 | incident response runbook（initial / escalation / postmortem） | I-2, I-3, C-1, C-2, R-3 | Phase 12 outputs/phase-12/incident-response-runbook.md | F-3, F-4, F-5, F-10 | - |
| AC-5 | dashboard URL 一覧（Workers/D1/Pages × staging/production = 6） + Sentry/Logpush placeholder | U-2 + U-3 | release-runbook § dashboard URL | F-11 | - |
| AC-6 | cron 二重起動防止（sync_jobs.running 参照） | I-1, C-3 | cron-deployment Step 3 | F-2 | - |
| AC-7 | rollback で apps/web 経由 D1 操作なし | R-2 | rollback-procedures A/B/C/D | F-12 | #5 |
| AC-8 | GAS apps script trigger なし | U-1（grep） | cron-deployment Step 1 sanity | - | #6 |
| AC-9 | cron 頻度 Workers 100k req/day 内（121 req/day = 0.121%） | C-4 + Phase 9 試算 | release-runbook § cron 制御 | F-6, F-7 | #10 |

各 AC の必須証跡（artifacts.json `outputs` ベース）:
- AC-1: `outputs/phase-02/cron-schedule-design.md` + `outputs/phase-05/cron-deployment-runbook.md`
- AC-2: 同上 + `outputs/phase-12/release-runbook.md`
- AC-3: `outputs/phase-12/release-runbook.md`
- AC-4: `outputs/phase-12/incident-response-runbook.md`
- AC-5: `outputs/phase-12/release-runbook.md` § dashboard URL
- AC-6: `outputs/phase-02/cron-schedule-design.md` § 3 + `outputs/phase-05/cron-deployment-runbook.md` Step 3
- AC-7: `outputs/phase-06/rollback-procedures.md`
- AC-8: `outputs/phase-05/cron-deployment-runbook.md` Step 1 sanity
- AC-9: `outputs/phase-09/main.md` § 無料枠試算

## Negative AC matrix（F-1〜F-12）

| Failure | 検出 verify suite | 検出 runbook step | mitigation 章 | 担当 | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| F-1 cron 不動作 | I-1 拡張 + 監視 dashboard | cron-deployment Step 2 | failure-cases § F-1 | release-runbook | - |
| F-2 cron 二重起動 | I-1 | cron-deployment Step 3 | failure-cases § F-2 | dev | - |
| F-3 sync 連続 fail | I-2 | release-runbook § rollback フロー | failure-cases § F-3 | release-runbook | - |
| F-4 Forms 429 | C-1 | wrangler tail | failure-cases § F-4 | dev | - |
| F-5 D1 read timeout | C-2 | wrangler tail / D1 metrics | failure-cases § F-5 | dev | #10 |
| F-6 D1 write 上限 | C-2 + dashboard | D1 metrics 監視 | failure-cases § F-6 | dev | #10 |
| F-7 Workers req 上限 | C-4 + dashboard | Workers metrics 監視 | failure-cases § F-7 | dev | #10 |
| F-8 rollback 不可 | R-2 失敗時 | release-runbook § rollback A | failure-cases § F-8 | release-runbook | - |
| F-9 D1 migration 不整合 | R-2 関連 | rollback-procedures § C | failure-cases § F-9 | release-staging | - |
| F-10 secret 漏洩 | log review（手動 / 拡張 grep） | incident-response § initial | failure-cases § F-10 | release-runbook | - |
| F-11 dashboard URL 変更 | U-2 失敗時 | runbook 走破 R-1 失敗時 | failure-cases § F-11 | release-runbook | - |
| F-12 apps/web に D1 import | U-1 拡張 grep | - | failure-cases § F-12（02c へ差し戻し） | dev | #5 |

## 空白セル check

- positive: 9 × 5 = 45 セル → **空白 0**
- negative: 12 × 5 = 60 セル → **空白 0**
- 合計: 105 セル → **空白 0**

## 不変条件 ↔ AC ↔ failure 完全照合

| 不変条件 | 関連 AC | 関連 failure |
| --- | --- | --- |
| #5 apps/web → D1 直接禁止 | AC-7 | F-12 |
| #6 GAS prototype 昇格しない | AC-8 | （該当なし、grep で 0 hit を担保） |
| #10 Cloudflare 無料枠 | AC-9 | F-5, F-6, F-7 |
| #15 attendance 重複防止 / 削除済み除外 | rollback A〜D 全件 | rollback-procedures § attendance 整合性確認 |
