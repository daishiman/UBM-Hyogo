# Phase 3 出力: 設計レビュー

## 1. レビュー対象

Phase 2 で固定した以下を対象とする。

- cron schedule design（C 案: `0 * * * *` + `*/15 * * * *` + `0 18 * * *`）
- 監視 placeholder（Cloudflare Analytics 6 URL + Sentry/Logpush placeholder）
- release runbook 章立て（9 章）
- incident response runbook 章立て（8 章）
- rollback 戦略（worker / pages / D1 migration / cron の 4 種）

## 2. Alternative 3 案

### 2.1 cron 頻度

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | `*/5 * * * *` で response sync を 5 分毎、schema sync `0 */12 * * *` 12 時間毎 | 反映速度最速 | 5 分 cron × 24h = 288 req/day。他 req と合算で 100k 接近時に余裕が減る。Forms API rate limit にも近づく |
| B | `0 18 * * *` schema sync のみ。response は admin が `POST /admin/sync/responses` で都度起動 | 無料枠最大余裕（1 req/day） | 反映遅延がひどく UX 悪化、admin の手動運用負荷 |
| **C（採択）** | `0 * * * *`（legacy）+ `0 18 * * *`（schema, 03:00 JST）+ `*/15 * * * *`（response） | `apps/api/wrangler.toml` current facts と一致、UX/コストのバランス、legacy 撤回は UT21-U05 に分離 | legacy 行の監視ノイズが残る、15 分の最大遅延 |

### 2.2 監視戦略

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | Sentry 実 DSN を 09b で登録 + Logpush 設定 | 即座に observability が稼働 | 09b の単一責務逸脱、無料枠超過リスク（Logpush 一部有料）、secret rotation を 09b で背負う |
| B | Cloudflare Analytics のみ + 自前 alert なし | 最低限の運用、コスト 0 | error 検知が手動依存、alert 未配線 |
| **C（採択）** | Cloudflare Analytics + Sentry/Logpush は placeholder のみ + 別 task（UT-OBS-SENTRY-001 等）に切り分け | 09b の scope を保ち、placeholder で将来接続を容易にする | 当面 alert は dashboard 目視 + sync_jobs SELECT のみ |

### 2.3 rollback 戦略

| 案 | 概要 | Pros | Cons |
| --- | --- | --- | --- |
| A | Worker / Pages / D1 / cron をひとつの bash script で一括 rollback | 操作 1 コマンド、所要時間最短 | 失敗時のリカバリが複雑、誤操作で web/api/cron 全体に波及 |
| B | rollback 専用の GitHub Actions workflow 化 | 実行履歴がリポジトリに残り、誰でも実行可能 | workflow 構築コスト、09b は docs-only なので scope 外 |
| **C（採択）** | runbook で 4 種を独立に手順化（Worker / Pages / D1 migration / cron）。各 sanity check + 注意事項を併記 | 障害種別ごとに最小実行範囲、失敗時の戻し先が明確 | 実行手順が長くなる、人手が必要 |

## 3. PASS-MINOR-MAJOR 判定（4 領域 × 3 案 = 12 セル）

| 領域 | A | B | C |
| --- | --- | --- | --- |
| cron 頻度 | MINOR（無料枠リスク + Forms API rate） | MINOR（UX 大幅悪化） | **PASS** |
| 監視 dashboard | MINOR（scope 逸脱） | MINOR（alert 未配線） | **PASS** |
| rollback 戦略 | MINOR（一括 rollback の波及リスク） | MINOR（09b scope 外） | **PASS** |
| 二重起動防止 | PASS（共通） | PASS（共通） | **PASS** |

採択: **C 案（cron / 監視 / rollback すべて C）**。

- MAJOR: 0 件
- MINOR: 6 件（A/B 案側に分散）
- PASS: 6 件（C 案全 + A/B の二重起動防止部分）

C 案で PASS 4/4 揃うため次 Phase（4: テスト戦略）に進める条件を満たす。

## 4. 不変条件 review

| 不変条件 | 結果 | 根拠 |
| --- | --- | --- |
| #5 apps/web → D1 直接禁止 | PASS | rollback 4 種に web 側 D1 操作が含まれない（Pages rollback は Dashboard 操作のみ） |
| #6 GAS prototype 昇格しない | PASS | cron 案はすべて Workers Cron Triggers。Alternative B でも apps script trigger は登場しない |
| #10 Cloudflare 無料枠 | PASS | C 案で 121 req/day（Phase 9 で詳細試算） |
| #15 attendance 重複防止 / 削除済み除外 | PASS | rollback-procedures.md の attendance 整合性 SQL を Phase 6 で必ず含める前提で PASS |

## 5. open question clearance

| # | Phase 1 で挙げた question | clearance |
| --- | --- | --- |
| O-1（cron 頻度） | C 案採択で確定 | CLEARED |
| O-2（Sentry/Logpush 配置） | placeholder のみ + 別 task 化（unassigned-task-detection.md） | CLEARED |
| O-3（Slack/Email 通知先） | `<placeholder>` 表記。実値は Cloudflare Secrets / 1Password 経由（CLAUDE.md secret 管理ポリシー準拠） | CLEARED |

残 open question: 0 件。

## 6. レビュー結論

- 採択案: **C（cron 頻度）+ C（監視）+ C（rollback）**
- MAJOR 0、MINOR 0（採択案について）
- 不変条件 #5/#6/#10/#15 すべて PASS
- Phase 4 へ進行可。verify suite を採択 C 案前提で構築する。

## 7. 次 Phase への引き継ぎ

- 採択案 C を Phase 4 verify suite の対象とする
- Alternative A/B の MINOR 評価は Phase 6 failure-cases.md の「想定外運用」サンプルとして引用
