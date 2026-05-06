# Phase 4: テスト戦略 — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 1-3 で確定した 13 evidence を実 staging 環境で取得するための検証戦略を定義する。テスト対象が Cloudflare Workers / D1 / Forms quota への副作用を伴うため、docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 4 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 1-3 で確定した 13 evidence と 4 approval gate に対し、(a) どの観点を (b) どのテスト種別で (c) どのコマンド契約で (d) どの pass 条件で評価するかを定義し、Phase 5 ランブック / Phase 11 実測がそのまま機械検証可能になる粒度に落とす。

## 検証戦略の階層

```
Layer 1  deploy 成否          (Workers script publish / version_id 取得)
Layer 2  endpoint 死活        (HTTP 200 / 401 / 403 / 5xx 切り分け)
Layer 3  schema/contract      (08a-B contract / D1 schema parity)
Layer 4  UI smoke             (Playwright / screenshot)
Layer 5  data sync            (Forms schema/responses → sync_jobs / audit_log)
Layer 6  log evidence         (wrangler tail redacted)
```

下層が落ちた時点で上層は実行しない（fail-fast）。各層の判定は Phase 7 AC マトリクスに 1:1 で対応させる。

## coverage 概念の適用外性

本タスクは staging 実環境で取得する **実測 evidence の網羅性** を検証対象とするため、ユニットテストのカバレッジ率（statement / branch coverage）の概念は適用外である。代替指標として以下を採用する。

| 指標 | 値 |
| --- | --- |
| evidence 保存数 | 13 / 13（Phase 1 で定義した evidence #1〜#13 すべて） |
| `NOT_EXECUTED` 残存数 | 0（Phase 11 完了時点で grep ヒット 0） |
| placeholder 文字列 grep 対象 | `NOT_EXECUTED`、`TODO_EVIDENCE`、`PLACEHOLDER` |
| evidence file size | すべて > 0 byte（空ファイルは未取得扱い） |

## テスト種別マトリクス

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド / HTTP | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | L1 | api Workers staging publish | deploy | 手動+approval | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \| tee outputs/phase-11/evidence/deploy/deploy-api-staging.log` | `evidence/deploy/deploy-api-staging.log` | exit 0 かつ `Deployed ubm-hyogo-api-staging` と version_id を含む |
| T02 | L1 | web Workers staging publish | deploy | 手動+approval | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \| tee outputs/phase-11/evidence/deploy/deploy-web-staging.log` | `evidence/deploy/deploy-web-staging.log` | exit 0 かつ `Deployed ubm-hyogo-web-staging` と version_id を含む |
| T03 | L2 | api `/health` (staging) | curl smoke | 自動 | `curl -sSi https://<api-staging>/health` | `evidence/curl/curl-public-health.log` | HTTP/2 200 かつ body `{"ok":true}` 等 |
| T04 | L2/L3 | `/public/members`（base） | curl smoke + contract | 自動 | `curl -sSi 'https://<api-staging>/public/members'` | `evidence/curl/curl-public-members-base.log` | 200、`X-Total-Count` または body `total` あり、08a-B contract と整合 |
| T05 | L3 | `/public/members?q=...&zone=...&status=...&tag=...&sort=...&density=...` | curl smoke + contract | 自動 | 08a-B Phase 11 contract に従い q / zone / status / tag / sort / density の組み合わせ別に curl | `evidence/curl/curl-public-members-{q,zone,status,tag,sort,density}.log`（6 件） | すべて 200、件数が contract 期待値レンジ内、density runtime evidence と一致 |
| T06 | L2 | 認可境界: 未認証 `/api/me` | curl smoke (authz) | 自動 | `curl -sSi https://<api-staging>/api/me` | `evidence/curl/curl-authz-me-unauth.log` | 401 |
| T07 | L2 | 認可境界: 未認証 `/api/admin/members` | curl smoke (authz) | 自動 | `curl -sSi https://<api-staging>/api/admin/members` | `evidence/curl/curl-authz-admin-unauth.log` | 401 または 403 |
| T08 | L2 | 認可境界: member role で `/api/admin/*` | curl smoke (authz) | 手動（session cookie 注入） | member セッション cookie で `curl -sSi -H "Cookie: <session>" https://<api-staging>/api/admin/members` | `evidence/curl/curl-authz-admin-member-role.log` | 403 |
| T09 | L4 | 公開 `/members` 描画 | screenshot | 自動 (Playwright) | `pnpm --filter web exec playwright test --config=playwright.staging.config.ts smoke/public-members.spec.ts` | `evidence/screenshots/public-members-staging.png` | png サイズ > 0、Playwright reporter で pass、density toggle が描画 |
| T10 | L4 | ログイン画面 | screenshot | 自動 (Playwright) | 同上 `smoke/login.spec.ts` | `evidence/screenshots/login-staging.png` | png サイズ > 0、Magic Link / Google OAuth ボタン描画 |
| T11 | L4 | 認証後 `/me` (profile) | screenshot | 自動 (Playwright) | 同上 `smoke/me.spec.ts`（fixture アカウント） | `evidence/screenshots/me-staging.png` | png サイズ > 0、profile データ描画 |
| T12 | L4 | `/admin` ダッシュボード | screenshot | 自動 (Playwright) | 同上 `smoke/admin.spec.ts`（admin fixture） | `evidence/screenshots/admin-staging.png` | png サイズ > 0、admin ナビ描画 |
| T13 | L4 | Playwright report / trace | E2E | 自動 | 上記 4 spec を `--reporter=html,list --output=...playwright/` | `evidence/playwright/` | report `index.html` 存在、failed=0 |
| T14 | L3 | D1 staging migration list | schema | 自動 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \| tee outputs/phase-11/evidence/d1/d1-migrations-list.txt` | `evidence/d1/d1-migrations-list.txt` | exit 0、`pending=0` または pending 行に理由 evidence 併記 |
| T15 | L3 | D1 schema parity (staging vs production) | schema | 自動 (read-only) | Phase 5 で定義する parity スクリプトで `PRAGMA table_info` を JSON 化 | `evidence/d1/d1-schema-parity.json` | `summary.diffCount = 0`、または diff 時は `productionMigrationTodo` に unassigned-task path |
| T16 | L5 | Forms schema sync 1 サイクル | sync | 手動+approval (G3) | api admin endpoint POST → tee | `evidence/forms/forms-schema-sync.log` | HTTP 200、`sync_jobs.kind="schema" status="succeeded"` |
| T17 | L5 | Forms responses sync 1 サイクル | sync | 手動+approval (G3) | 同上 | `evidence/forms/forms-responses-sync.log` | HTTP 200、`sync_jobs.kind="responses" status="succeeded"`、1 件以上の row 増分 |
| T18 | L5 | `sync_jobs` row evidence | data | 自動 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20"` | `evidence/forms/sync-jobs-staging.json` | rows 配列に T16/T17 で増えた行が含まれる |
| T19 | L5 | `audit_log` row evidence | data | 自動 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM audit_log WHERE event LIKE 'sync.%' ORDER BY id DESC LIMIT 20"` | `evidence/forms/audit-log-staging.json` | append-only（id 単調増加）、PII redacted |
| T20 | L6 | `wrangler tail` 1 分間 redacted capture | log | 手動 | `timeout 60 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \| bash scripts/lib/redaction.sh \| tee outputs/phase-11/evidence/wrangler-tail/wrangler-tail.log` | `evidence/wrangler-tail/wrangler-tail.log` | サイズ > 0、または取得不能理由（token scope / quota）を明記、redact 後に `Bearer\|token=\|sk-\|API_KEY=` の hit 0 |

> 「13 evidence」物理ファイル数の内訳: deploy 2（T01,T02）/ curl smoke 9（T03,T04,T05×6 不定だが代表 1 で計上、T06,T07,T08）/ screenshot 4（T09-T12）/ playwright 1（T13）/ forms sync 2（T16,T17）/ sync_jobs 1（T18）/ audit_log 1（T19）/ wrangler tail 1（T20）/ d1-migrations 1（T14）/ d1-schema-parity 1（T15） = 23 ファイル相当だが、AC 上の「13 evidence」は Phase 1 § 出力表の論理 evidence #1〜#13 を指す。物理ファイル数と論理 evidence の対応は Phase 7 で表化する。

## コマンド / HTTP request の具体例

### T03 `/health` 期待レスポンス

```
HTTP/2 200
content-type: application/json
{"ok":true,"service":"ubm-hyogo-api","env":"staging"}
```

### T05 `/public/members` クエリ別呼び出し

```bash
BASE='https://<api-staging>/public/members'
for q in 'q=tanaka' 'zone=hyogo' 'status=active' 'tag=board' 'sort=name_asc' 'density=compact'; do
  key=$(echo "$q" | cut -d= -f1)
  curl -sSi "$BASE?$q" | tee outputs/phase-11/evidence/curl/curl-public-members-$key.log
done
```

期待: 全クエリで HTTP 200、`Content-Type: application/json`、JSON body の `items` 配列長が 0 以上、`total` が integer。08a-B Phase 11 で定義された contract（density runtime evidence）と field 名・型が一致すること。

### T06/T07 認可境界

```
HTTP/2 401         <- /api/me unauth
HTTP/2 401 or 403  <- /api/admin/members unauth
HTTP/2 403         <- /api/admin/members member role
```

## 失敗時の判定基準

| カテゴリ | 失敗条件 | 切り分け |
| --- | --- | --- |
| 4xx 期待外 | T03/T04/T05 で 400/404 | レスポンス body と `wrangler tail` を突き合わせ。binding 不整合・route 未配置を疑う |
| 5xx | 任意 curl で 500/502/503 | T20 wrangler tail を併読、Workers exception stack trace を探す |
| タイムアウト閾値 | curl `--max-time 10` を超過 | staging Workers cold start を疑う。3 回連続で 10s 超なら fail |
| Playwright timeout | spec が 30s を超過 | trace を保存、最大 2 回リトライで切り分け（flaky 判定） |
| redact 検証 | T20 evidence に `Bearer [A-Za-z0-9]+`/`token=[A-Za-z0-9]+`/`sk-[A-Za-z0-9]+`/`API_KEY=` が grep ヒット | redact 失敗とみなし evidence 破棄、redact pipeline 修正後に再取得 |
| D1 schema drift | T15 `summary.diffCount > 0` | production 側 migration TODO を `unassigned-task/task-09a-d1-schema-parity-followup-001.md` で起票 |

## 08a-B contract との合流ポイント

- T04 / T05 は 08a-B Phase 11 で確立した `/public/members` の **q / zone / status / tag / sort / density runtime evidence contract** に従う。
- 合流チェック: 08a-B 側 `outputs/phase-11/evidence/` の curl response JSON schema と本タスク T04/T05 の JSON body を `jq -S 'keys' file.json` で比較し、key set が一致することを Phase 11 で確認する。
- density runtime evidence は density toggle 別に `items[].layout` 等の runtime field が contract と一致することを T05 density 行で評価する。
- 不一致時は本タスクで修正せず、08a-B 側へ差し戻す follow-up を `unassigned-task/` に起票（CONST_007）。

## 自走禁止操作（approval gate 再掲）

| gate | 対象テスト | 停止位置 |
| --- | --- | --- |
| G1 | T01 / T02 | `cf.sh deploy` 直前 |
| G2 | T14 後の apply（pending あり時） | `cf.sh d1 migrations apply` 直前 |
| G3 | T16 / T17 | Forms sync endpoint POST 直前（quota 消費を伴うため） |
| G4 | Phase 12 / 13 の 09c blocker 更新 commit | commit 直前 |

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md` 〜 `phase-03.md`
- `docs/30-workflows/08a-B-public-search-filter-coverage-spec/`（`/public/members` contract）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`

## 統合テスト連携

- 上流: 08a coverage gate / 08a-B contract / 08b Playwright E2E evidence
- 下流: 09c production deploy execution（本 Phase で確立する pass 条件をそのまま 09c 入力に流用）

## 多角的チェック観点

- 不変条件 #5: T06/T07/T08 で公開・会員・管理境界を実測
- 不変条件 #6: T18/T19 は `apps/api` 経由のみで取得（apps/web から D1 直接呼び出さない）
- 不変条件 #14: T20 quota 観測、Forms quota 消費は T16/T17 の 1 サイクルに限定
- 未実装/未実測を PASS と扱わない: `evidence file size > 0` と `NOT_EXECUTED 含まない` の 2 段 gate を Phase 7 AC で全項目に適用
- placeholder と実測 evidence の物理パス分離（`outputs/phase-11/evidence/` 配下に限る）

## サブタスク管理

- [ ] T01〜T20 のテスト項目と evidence path の対応を確定
- [ ] 08a-B contract との合流チェック手段（`jq -S 'keys'` 等）を Phase 5 へ引き渡し
- [ ] coverage 適用外の代替指標（13/13 + NOT_EXECUTED=0）を Phase 7 AC マトリクスに反映する指示を残す
- [ ] `outputs/phase-04/main.md` を作成

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 13 evidence（論理）に対応する 20 テスト項目（物理 T01〜T20）が、種別 / コマンド / pass 条件で一意に定義されている
- 08a-B contract との合流ポイントが明文化されている
- coverage 適用外の代替指標が定義されている
- 失敗時の判定基準（4xx/5xx 切り分け、タイムアウト閾値、redact 検証）が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] follow-up gate（実測未取得を埋める）に限定されており、本体タスクの再実装ではない
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない

## 次 Phase への引き渡し

Phase 5 へ:
- T01〜T20 のコマンド契約と pass 条件
- 4 approval gate の停止位置
- 失敗時の切り分けフロー（Phase 6 異常系検証へ繋ぐ）
- redact pipeline (`scripts/lib/redaction.sh`) と inline sed フォールバック仕様

## 実行タスク

- [ ] phase-04 の既存セクションに記載した手順・検証・成果物作成を実行する。
