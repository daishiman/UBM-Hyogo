[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 6 Output: 異常系検証 — 09c-A-production-deploy-execution

## 1. 異常系 9 種類の列挙

A タスクのスコープ（実 production execution gate のみ）に絞り、Step ごとに代表的な異常を 9 件選定する。完了済み 09c serial（13 件）から、A タスクで再発生する可能性が高い 9 件を抽出した。

| # | 異常系 type | 対応 Step | 検知経路 | mitigation 分岐 |
| --- | --- | --- | --- | --- |
| AN-1 | upstream-not-green | Step 1 | 上流 outputs/phase-11/ 不在 | NO-GO（待機）|
| AN-2 | cf-token-revoked | Step 1 / 全 mutation | `bash scripts/cf.sh whoami` exit ≠ 0 / `Authentication error` | `.env` op 参照を確認、本 runbook STOP（incident）|
| AN-3 | d1-backup-fail | Step 3.1 | `d1 export` exit ≠ 0 or size 0 | リトライ → 継続失敗で incident（D1 mutation 不可）|
| AN-4 | d1-apply-fail | Step 3.4 | `d1 migrations apply` exit ≠ 0 | rollback C（forward fix migration）+ user approval、incident escalation |
| AN-5 | api-deploy-fail | Step 4 | `bash scripts/cf.sh deploy` exit ≠ 0 / esbuild error | rollback A（worker rollback）+ 02c / 03 / 04 wave へ差し戻し |
| AN-6 | web-deploy-fail | Step 5 | OpenNext build fail / bundle size 超過 / `D1Database` 検出 / deploy exit ≠ 0 | rollback B（worker rollback）+ 02c へ差し戻し（不変条件 #6 違反は即停止）|
| AN-7 | smoke-fail-5xx-or-authz | Step 7 | curl 5xx / role 別 authz が期待外（403 が 200 / 200 が 403） | rollback A/B + 該当 UI wave 差し戻し（不変条件 #5 / #11） |
| AN-8 | observability-silent | Step 7.7 / Step 8 | Sentry / Slack に通知未到達、healthcheck mechanism が沈黙 | 09b-A binding を確認、09b incident runbook へ escalation |
| AN-9 | metrics-threshold-exceeded | Step 8 | Workers req > 5k/day、D1 reads / writes が free-tier 10% 超過 | cron 頻度低下（09b D rollback）/ SQL 最適化（02b / 03b）/ rollback A 候補 |

### Phase 1-3 risk との対応

| Phase 3 risk | AN-* | 補足 |
| --- | --- | --- |
| R1 未承認 mutation | -（gate で防止） | Phase 5 G-1〜G-5 が前提 |
| R2 wrangler 直実行 drift | -（規約で防止） | Phase 5 §0 で禁止明示 |
| R3 main 昇格不一致 | (G-1) | Phase 13 approval で防止 |
| R4 D1 部分適用 | AN-4 | rollback C |
| R5 deploy 失敗 | AN-5, AN-6 | rollback A/B |
| R6 smoke 5xx / authz | AN-7 | rollback A/B |
| R7 release tag 失敗 | -（再 push で吸収） | Phase 5 §6 / rollback D |
| R8 24h 取り忘れ | -（runbook で防止） | Phase 5 Step 8 |
| R9 secret 転記 | -（grep で防止） | Phase 5 §0 / Step 全体で mask 必須 |
| R10 上流未 green 見切り | AN-1 | NO-GO |
| R11 esbuild 不整合 | AN-5（一部） | `scripts/cf.sh` で解決 |
| R12 Node drift | AN-5（一部） | `mise exec --` で防止 |

## 2. 検知経路 5 分類

| 経路 | 取得方法 | 主な異常系 |
| --- | --- | --- |
| E-1 exit code | `pnpm typecheck` / `bash scripts/cf.sh deploy` / `git push` | AN-5, AN-6 |
| E-2 CLI stderr | `bash scripts/cf.sh d1 export / migrations *` の stderr | AN-3, AN-4, AN-2 |
| E-3 HTTP smoke | curl の HTTP status / response body | AN-7 |
| E-4 SQL | `SELECT status FROM sync_jobs` 等 | AN-7（manual sync）, AN-9（24h 集計） |
| E-5 observability | Sentry issue / Slack 通知 / Cloudflare Dashboard metrics | AN-8, AN-9 |

silent failure（出力が成功に見えるが内部で異常）は E-5 で検知する。E-5 が沈黙する場合（AN-8）は、09b-A の binding 不備が疑われるため即時 incident escalation。

## 3. mitigation 分岐 3 経路

| 経路 | 内容 | 異常系 |
| --- | --- | --- |
| M-1 rollback | Phase 5 §9 A/B/C を user approval 経由で実行 | AN-4, AN-5, AN-6, AN-7, AN-9 |
| M-2 incident | 09b incident runbook（severity 判定 → 初動）に escalation | AN-2, AN-4（破壊的）, AN-8 |
| M-3 差し戻し | 該当 wave（02 / 03 / 04 / 06 / 07 等）へ task として戻す | AN-5, AN-6, AN-7 |

異常系によっては M-1 + M-2 を並行（rollback で時間を稼ぎつつ incident 起票）。本タスクは A スコープのため M-1 / M-2 を実行できる権限を別 user approval で取得する前提。

## 4. 異常系詳細（9 件）

### AN-1: upstream-not-green

| 項目 | 内容 |
| --- | --- |
| Step | Step 1 |
| 検知 | 09a-A / 09b-A / 09b-B の `outputs/phase-11/` が空、または smoke 結果が green でない |
| 影響 | 不変条件 #5 / #6 / #14 の前提が崩れる |
| 即時対応 | 本 runbook STOP（GO 条件不成立） |
| 復旧 | 該当上流 task の Phase 11 を完了させる |
| evidence | `outputs/phase-11/anomaly-upstream-not-green.md`（該当上流の状態と citation） |
| escalation | 不要（待機） |

### AN-2: cf-token-revoked

| 項目 | 内容 |
| --- | --- |
| Step | Step 1.2 / 全 mutation Step |
| 検知 | `bash scripts/cf.sh whoami` で `Authentication error` / 401 |
| 影響 | mutation 不可 |
| 即時対応 | runbook STOP。`.env` の op 参照（`op://...`）を確認 |
| 復旧 | 1Password Environments で token を再発行、`.env` に反映 |
| evidence | `outputs/phase-11/anomaly-cf-token.md`（whoami 結果 mask 済み + 復旧 timestamp） |
| escalation | severity P1（admin endpoint 全件 5xx の可能性） |

### AN-3: d1-backup-fail

| 項目 | 内容 |
| --- | --- |
| Step | Step 3.1 |
| 検知 | `d1 export` exit ≠ 0 or 出力 .sql の size が 0 |
| 影響 | apply 後の rollback 経路が消える |
| 即時対応 | リトライ最大 3 回。size 0 のまま継続失敗で **Step 3.4 に進まない** |
| 復旧 | Cloudflare Status を確認、incident severity P1 |
| evidence | `outputs/phase-11/anomaly-d1-backup-fail.md`（コマンド全文と stderr） |
| escalation | 09b incident runbook（P1） |

### AN-4: d1-apply-fail

| 項目 | 内容 |
| --- | --- |
| Step | Step 3.4 |
| 検知 | `d1 migrations apply` の stderr に error / `d1 migrations list` で applied 件数が想定外 |
| 影響 | データ不整合の可能性、API deploy 不可 |
| 即時対応 | `d1 migrations list` で current state を確認、forward fix migration を新規作成 |
| 復旧 | rollback C（user approval 必須）。破壊的 SQL 禁止 |
| evidence | `outputs/phase-11/anomaly-d1-apply-fail.md` + `rollback-d1.md` |
| escalation | severity P1（データ破損疑いなら P0） |

### AN-5: api-deploy-fail

| 項目 | 内容 |
| --- | --- |
| Step | Step 4.3 |
| 検知 | `bash scripts/cf.sh deploy` exit ≠ 0、または esbuild error / typecheck error |
| 影響 | 旧版が稼働継続（mutation なし） |
| 即時対応 | 失敗 log を確認。esbuild 不整合は `ESBUILD_BINARY_PATH` を再点検 |
| 復旧 | コード起因なら 02 / 03 / 04 / 06 / 07 wave へ差し戻し。中間状態（一部 deploy 済）なら rollback A |
| evidence | `outputs/phase-11/anomaly-api-deploy-fail.md` + `api-deploy.log` |
| escalation | severity P1（cron 停止が伴う場合） |

### AN-6: web-deploy-fail

| 項目 | 内容 |
| --- | --- |
| Step | Step 5.x |
| 検知 | `build:cloudflare` exit ≠ 0、worker.js > 3 MiB、`rg "D1Database"` で hit、`bash scripts/cf.sh deploy` exit ≠ 0 |
| 影響 | UI が古いまま、または不変条件 #6 違反 |
| 即時対応 | `D1Database` 検出時は **Step 5.5 を実行しない**（mutation 中止） |
| 復旧 | OpenNext 設定 / 02c 修正、bundle size は minify。incident 後 rollback B |
| evidence | `outputs/phase-11/anomaly-web-deploy-fail.md` + `web-build.log` / `web-deploy.log` |
| escalation | 不変条件 #6 違反は P0、それ以外は P1 |

### AN-7: smoke-fail-5xx-or-authz

| 項目 | 内容 |
| --- | --- |
| Step | Step 7.2〜7.5 |
| 検知 | curl で 5xx、role 別 authz が期待外、admin UI に編集 form が存在（不変条件 #11 違反） |
| 影響 | 公開機能の停止、不変条件違反 |
| 即時対応 | 即 rollback A/B（user approval 必須） |
| 復旧 | UI / authn / authz 起因は 07a / 07b / 認証 wave |
| evidence | `outputs/phase-11/anomaly-smoke-fail.md` + `smoke-*.md` の該当行 |
| escalation | severity P0（public 全停止）/ P1（authz violation 単発） |

### AN-8: observability-silent

| 項目 | 内容 |
| --- | --- |
| Step | Step 7.7 / Step 8.4 |
| 検知 | 09b-B healthcheck mechanism を発火しても Sentry / Slack に通知未到達 |
| 影響 | silent failure 検知不能、24h 監視が機能しない |
| 即時対応 | 09b-A binding（DSN / Slack webhook）を再確認 |
| 復旧 | 09b-A 修正後に再発火試験 |
| evidence | `outputs/phase-11/anomaly-observability-silent.md`（発火コマンド / 期待通知 / 実測） |
| escalation | severity P1（24h 監視 gap） |

### AN-9: metrics-threshold-exceeded

| 項目 | 内容 |
| --- | --- |
| Step | Step 8 |
| 検知 | Workers req > 5k/day、D1 reads / writes > free-tier 10%、`sync_jobs.failed` 連続 |
| 影響 | 不変条件 #14 違反のリスク、free-tier 撤退の可能性 |
| 即時対応 | cron 頻度低下（09b rollback D）、SQL 最適化検討 |
| 復旧 | 02b / 03b で query / index 改善、それでも超過なら有料プラン判断（別 task） |
| evidence | `outputs/phase-11/anomaly-metrics-threshold.md` + `24h-verification-summary.md` |
| escalation | severity P2（即時停止は不要）、連続超過なら P1 |

## 5. 09b incident runbook への引き渡し

09b-A / 09b-B の incident response runbook（`docs/30-workflows/09b-*/outputs/phase-12/release-runbook.md` または同等）に従い、以下の情報を escalation 起票時に渡す:

- 異常系 type（AN-1〜AN-9）
- severity（spec 15 の P0/P1/P2 表）
- 発生 Step（Phase 5 の Step 番号）
- 検知経路（E-1〜E-5）
- 直近の evidence path（`outputs/phase-11/anomaly-*.md` + 関連 log）
- 既に実施した mitigation（M-1 / M-2 / M-3）
- user approval log の該当 entry（rollback approval 含む）

09b incident runbook 側で次の責務を引き受ける:

- severity 判定の確定
- 関係者通知（Slack / Email）
- post-mortem 起票
- 根本原因タスクの formalize（unassigned-task へ）

本タスクの責務は incident **検知 + 一次 mitigation + escalation 起票** までであり、根本原因解析 / 仕様改修は scope out。

## 6. Phase 5 rollback との接続

| 異常系 | 接続する rollback |
| --- | --- |
| AN-4 | C（D1 forward fix） |
| AN-5 | A（API worker rollback） |
| AN-6 | B（Web worker rollback） |
| AN-7 | A / B（5xx は API、UI 起因は Web） |
| AN-9 | A（cron 含む API rollback）または D（tag 取消は通常不要） |

各 rollback は user approval を必要とし、`outputs/phase-11/user-approval-log.md` に rollback 専用 section（G-R）で記録する。

## 7. 異常系 evidence 命名規約

- ファイル: `outputs/phase-11/anomaly-<type>.md`
- type は AN-1 → `upstream-not-green`、AN-2 → `cf-token`、… のように lower-case kebab に揃える
- 中身は次のテンプレ:

```md
# anomaly: <type>
- detected_at: <ISO 8601>
- step: Step <N> (<name>)
- detection_path: E-<n>
- raw_log_excerpt: |
    <抜粋。secret は redacted>
- mitigation: <M-1 / M-2 / M-3 のいずれか>
- mitigation_evidence: <path>
- user_approval: <user-approval-log.md の section>
- severity: P0 / P1 / P2
- escalated_to: 09b incident / 該当 wave / なし
```

silent skip / 記録なしの mitigation は禁止。発生していないなら本ファイル群は作成しない（false green 防止）。

## 8. 完了条件

- [ ] 異常系 9 件すべてに Step / 検知 / mitigation / evidence が記述される
- [ ] 09b incident runbook への引き渡し情報項目が確定
- [ ] Phase 5 rollback 3 種との接続表が完成
- [ ] evidence 命名規約が確定し、template が用意される
