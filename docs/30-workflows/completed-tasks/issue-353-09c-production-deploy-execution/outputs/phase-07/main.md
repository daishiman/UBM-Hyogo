[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 7 Output: AC マトリクス — 09c-A-production-deploy-execution

## 1. AC 一覧（index.md より）

| AC | 内容 |
| --- | --- |
| AC-1 | user approval evidence が保存される |
| AC-2 | production D1 migration が Applied として確認される |
| AC-3 | api/web production deploy が exit 0 |
| AC-4 | production public/member/admin smoke が green |
| AC-5 | release tag と 24h verification summary が保存される |

## 2. positive AC matrix（5 行 × 5 列 = 25 セル、空白 0）

| AC | 検証手段（コマンド / 操作） | evidence path | 期待結果（PASS 条件） | runbook step / verify suite | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `outputs/phase-11/user-approval-log.md` に Phase 10 / G-1 / G-2 / G-3 / G-4 / G-5 の scoped `状態: approved` entry がある（rollback 発生時は G-R も） | `outputs/phase-11/user-approval-log.md` | 各 mutation gate に scoped `状態: approved` entry 1 件以上、決定者・日時・対象が明記 | Step 1.6 / Step 2 / Step 3.3 / Step 4.2 / Step 5.4 / Step 6.2（L1-8 / L2-1 / L3-1 / L3-4） | -（gate そのもの） |
| AC-2 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` を apply 前後で実行、`d1-migrations-diff.txt` で件数確認 | `d1-migrations-list-before.txt`, `d1-apply.log`, `d1-migrations-apply.txt`, `d1-migrations-list-after.txt`, `d1-migrations-diff.txt`, `d1-backup-<ts>.sql` | apply 後の Applied 件数 ≥ apply 前、apply exit 0、backup size > 0 | Step 3.1〜3.5（L1-6, L1-7, L2-1〜L2-3） | -（前提保全） |
| AC-3 | `bash scripts/cf.sh deploy --config apps/{api,web}/wrangler.toml --env production` exit 0、version_id を抽出 | `api-deploy.log`, `api-version.md`, `web-build.log`, `web-deploy.log`, `web-version.md` | 両 deploy exit 0、version_id が `api-version.md` / `web-version.md` に記録、worker.js < 3 MiB | Step 4.3 / Step 5.5（L3-3, L3-6, L3-7） | #6（Step 5.3 で D1Database 0 hit） |
| AC-4 | curl で 10 ルート、ブラウザで member/admin role 手動確認、`POST /admin/sync/*`、`rg "D1Database" apps/web/.open-next/`、09b-B healthcheck 発火 | `smoke-public.md`, `smoke-member.md`, `smoke-admin.md`, `smoke-screenshots/*.png`, `invariants.md`, `post-deploy-healthcheck.md` | public 4 ルートが 200、member/admin が role どおり、authz boundary 一致、編集 form 不在（#4 / #11）、Sentry/Slack 通知到達 | Step 7.1〜7.7（L4-1〜L4-9） | #5, #6, #11 |
| AC-5 | `git push origin <release-tag>` 後 `git ls-remote --tags origin` で確認、24h 経過後に Cloudflare Dashboard の screenshot と `sync_jobs` 24h 集計 SQL を実行 | `release-tag.txt`, `24h-verification-summary.md`, `24h-metrics-screenshots/workers-requests-<ts>.png`, `d1-rows-<ts>.png`, `sync-jobs-<ts>.png`, `sync-jobs-24h.txt` | tag が remote 反映、24h 後の Workers req < 5k/day、D1 reads/writes が free-tier 10% 以下、`failed` 連続なし | Step 6.1〜6.3 / Step 8（L4 末尾, L5-1〜L5-6） | #14, #6（24h 再確認） |

## 3. negative AC matrix（9 行 × 5 列 = 45 セル、空白 0）

異常系を「検知できることが AC」と捉え、AN-1〜AN-9 をマトリクスに展開する。

| Failure | 検知 verify suite / コマンド | 検知 runbook step | mitigation 分岐 | evidence | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AN-1 upstream-not-green | L1-1〜L1-3（上流 outputs/phase-11/ を ls） | Step 1 | M-（NO-GO 待機）、本 runbook STOP | `anomaly-upstream-not-green.md` | -（前提） |
| AN-2 cf-token-revoked | L1-5（`cf.sh whoami` exit ≠ 0） | Step 1.2 / 全 mutation | M-2（incident P1）、`.env` op 参照復旧 | `anomaly-cf-token.md` | -（前提） |
| AN-3 d1-backup-fail | L1-6（`d1 export` exit / size 0） | Step 3.1 | M-2（incident P1）、Step 3.4 に進まない | `anomaly-d1-backup-fail.md` | -（保全） |
| AN-4 d1-apply-fail | L2-2（`d1 migrations apply` stderr）／ L2-3（list-after 不整合） | Step 3.4 | M-1（rollback C） + M-2（incident P0/P1） | `anomaly-d1-apply-fail.md`, `rollback-d1.md` | -（データ整合） |
| AN-5 api-deploy-fail | L3-2（typecheck）／ L3-3（deploy exit / esbuild） | Step 4.x | M-1（rollback A） + M-3（02/03/04 wave 差し戻し） | `anomaly-api-deploy-fail.md`, `api-deploy.log` | -（service） |
| AN-6 web-deploy-fail | L3-5（OpenNext build）／ L3-6（deploy exit）／ Step 5.3（`D1Database` 検出） | Step 5.x | M-1（rollback B） + M-3（02c 差し戻し）、#6 違反は P0 | `anomaly-web-deploy-fail.md`, `web-build.log`, `web-deploy.log` | **#6**（D1Database 検出時） |
| AN-7 smoke-fail-5xx-or-authz | L4-1〜L4-4（curl HTTP）／ L4-6（authz）／ L4-8（admin form 確認） | Step 7.x | M-1（rollback A/B） + M-3（07a/07b/認証 wave） | `anomaly-smoke-fail.md`, `smoke-*.md` | **#5, #11**（5xx は #14 にも波及） |
| AN-8 observability-silent | L4-9（healthcheck 発火後の Sentry/Slack 確認） | Step 7.7 / Step 8.4 | M-2（09b-A binding 修正後再発火） | `anomaly-observability-silent.md`, `post-deploy-healthcheck.md` | -（監視 gap） |
| AN-9 metrics-threshold-exceeded | L5-1〜L5-3（dashboard / SQL） | Step 8 | M-1（cron 頻度低下 / SQL 最適化）、連続超過なら rollback A 候補 | `anomaly-metrics-threshold.md`, `24h-verification-summary.md` | **#14**（free-tier） |

## 4. PASS / PASS_WITH_BLOCKER 境界

| 状態 | 定義 | 例 |
| --- | --- | --- |
| **PASS** | 該当 AC の evidence path がすべて埋まり、期待結果を満たす | AC-2: backup ≥ 0、apply exit 0、list-after ≥ list-before |
| **PASS_WITH_BLOCKER** | skip ルール（Phase 4 §5）を満たし、`manual-smoke-log.md` に skip 理由・代替経路・再実行予定が記録されている。再実行 deadline が明示されている | AC-4 で manual sync を cookie 取得不能で skip → SQL のみで状態確認、cookie 取得後の再実行予定を記録 |
| **PENDING_RUNTIME_EVIDENCE** | 実測前 / approval 待ち。**PASS とは扱わない** | AC-5 で 24h 経過前 |
| **FAIL** | 期待結果不一致、不変条件違反、silent failure | AC-3 で deploy exit ≠ 0、AC-4 で `D1Database` 検出 |
| **EXECUTED_BLOCKED** | 実行は試みたが上流 / 環境 blocker で確認不可 | AC-4 で 09b-A 沈黙が続き healthcheck 確認不能 |

silent skip（記録なしの skip）は **FAIL** として扱う。silent failure（出力 PASS、内部異常）は AN-8 で検知し、検知できない場合は AC-4 を **FAIL** にする。

## 5. 09a / 09b 依存 AC の citation 形式

本タスクは下記の上流 AC を **再検証しない**。前提として `outputs/phase-11/upstream-green-evidence.md` に citation を置く。

| 上流 task | 依存 AC（要旨） | citation 先 | 本タスクで参照する evidence |
| --- | --- | --- | --- |
| 09a-A staging smoke | staging で public/member/admin smoke green | `docs/30-workflows/09a-*/outputs/phase-11/main.md` | smoke-public/member/admin の green ログ |
| 09b-A observability | Sentry / Slack runtime 通知の到達 | `docs/30-workflows/09b-A-*/outputs/phase-11/main.md` | 通知到達 evidence |
| 09b-B post-deploy healthcheck | silent failure 検知 mechanism の動作 | `docs/30-workflows/09b-B-*/outputs/phase-11/main.md` | 検知 mechanism の green |

citation テンプレ:

```md
# upstream-green-evidence
- 09a-A staging smoke
  - phase-11 path: docs/30-workflows/09a-*/outputs/phase-11/
  - public smoke: <relative path to evidence>
  - member smoke: <relative path>
  - admin smoke: <relative path>
- 09b-A observability
  - phase-11 path: docs/30-workflows/09b-A-*/outputs/phase-11/
  - sentry binding: <evidence>
  - slack binding: <evidence>
- 09b-B post-deploy healthcheck
  - phase-11 path: docs/30-workflows/09b-B-*/outputs/phase-11/
  - detection mechanism: <evidence>
- checked_at: <ISO 8601>
```

上流 path に green evidence が無い場合は AN-1（upstream-not-green）として扱い、本 runbook を STOP する。

## 6. evidence 取得タイミング × runbook step

| Step | 取得 evidence | 該当 AC |
| --- | --- | --- |
| Step 1 | upstream-green-evidence.md, cf-whoami.txt, main-merge-commit.txt, user-approval-log.md（Phase 10） | AC-1（前提） |
| Step 2 | main-merge-commit.txt 更新, main-merge-log.txt | AC-1 |
| Step 3 | d1-backup-<ts>.sql, d1-migrations-list-before/after, d1-apply.log, d1-migrations-apply.txt, d1-migrations-diff.txt, user-approval-log.md（G-2） | AC-1, AC-2 |
| Step 4 | api-typecheck.log, api-deploy.log, api-version.md, user-approval-log.md（G-3） | AC-1, AC-3 |
| Step 5 | web-build.log, web-deploy.log, web-version.md, invariants.md（#6 PASS）, user-approval-log.md（G-4） | AC-1, AC-3, AC-4（#6） |
| Step 6 | release-tag.txt, user-approval-log.md（G-5） | AC-1, AC-5（tag） |
| Step 7 | smoke-{public,member,admin}.md, smoke-screenshots/*.png, invariants.md, post-deploy-healthcheck.md, production-endpoints.md | AC-4 |
| Step 8 | sync-jobs-24h.txt, 24h-verification-summary.md, 24h-metrics-screenshots/*.png | AC-5（24h） |
| 異常時 | anomaly-<type>.md, rollback-{api,web,d1}.md | negative AC（AN-*） |

## 7. 空白セル check

| matrix | 行 × 列 | セル数 | 空白 |
| --- | --- | --- | --- |
| positive | 5 × 5（AC / 検証手段 / evidence / 期待結果 / runbook step）+ 不変条件列 = 5 × 6 | 30 | 0 |
| negative | 9 × 5（Failure / 検知 / step / mitigation / 不変条件）+ evidence 列 = 9 × 6 | 54 | 0 |
| 計 | | 84 | 0 |

> Phase 7 仕様書の 70 セル目標は最低限。本 matrix は不変条件列を独立列で持つため計 84 セルとなる。

## 8. AC matrix の運用

- Phase 10 最終レビューで本 matrix を GO/NO-GO 判定に使う（GO 条件は AC-1〜AC-5 全てが PASS or PASS_WITH_BLOCKER + 上流 green）
- Phase 11 実測時に本 matrix を checklist に転用、各 AC ごとに `EXECUTED_PASS / PASS_WITH_BLOCKER / EXECUTED_BLOCKED / FAIL` を割り当てる
- Phase 12 documentation で AC × evidence の最終 path 表に再利用

## 9. 完了条件

- [ ] positive AC 5 件 × 6 列が完成
- [ ] negative AC 9 件 × 6 列が完成
- [ ] 計 84 セル空白 0
- [ ] 不変条件 #5 / #6 / #11 / #14 が matrix で参照
- [ ] PASS / PASS_WITH_BLOCKER / PENDING_RUNTIME_EVIDENCE / FAIL / EXECUTED_BLOCKED の 5 状態が定義される
- [ ] 上流 09a / 09b の citation 形式が確定
