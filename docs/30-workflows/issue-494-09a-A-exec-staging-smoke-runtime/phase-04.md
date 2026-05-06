# Phase 4: テスト戦略 — issue-494-09a-A-exec-staging-smoke-runtime

[実装区分: 実装仕様書]

判定根拠: 本タスクは spec 確定済（PR #493）の 09a-A staging deploy smoke を **実 staging 環境** で実行し runtime evidence を repo にコミットする runtime-evidence-acquisition タスクである。Cloudflare Workers / D1 / Forms quota への副作用と repo コミット成果物を伴うため、CONST_004 に従い実装仕様書として扱う（docs-only 不可）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-494-09a-A-exec-staging-smoke-runtime |
| issue | #494 (`UT-09A-A-EXEC-STAGING-SMOKE-001`) |
| phase | 4 / 13 |
| wave | 9a-fu |
| mode | sequential（G1→G2→G3→G4 multi-stage approval gate） |
| priority | HIGH |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec / runtime-evidence-acquisition |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Issue #494「完了条件チェックリスト」13 項目に対し、(a) どの観点を (b) どのテスト種別で (c) どのコマンド契約で (d) どの pass 条件で評価するかを定義し、Phase 5 ランブック / Phase 11 実測時に機械検証可能な粒度で実行できるようにする。

各 G1〜G4 ゲートに紐づく acceptance test / smoke test / parity test / sync replay test の 4 系統を、独立性・冪等性・redaction policy の 3 観点で揃える。

## 検証戦略の階層

```
Layer 1  preflight              (cf.sh whoami / op:// 参照確認 / staging URL 確定)
Layer 2  G1 deploy 成否         (api → web Workers script publish / version_id 取得)
Layer 3  G1 endpoint 死活       (HTTP 200 / 401 / 403 / 5xx 切り分け)
Layer 4  G2 D1 schema/contract  (migrations list / schema parity staging vs prod)
Layer 5  G1/G3 UI smoke         (Playwright 4 spec / screenshot)
Layer 6  G3 data sync replay    (Forms schema/responses sync → sync_jobs / audit_log)
Layer 7  G1 log evidence        (wrangler tail 30min redacted)
Layer 8  G4 evidence commit     (artifacts.json parity / 09c blocker 更新 / task-workflow-active.md)
```

下層 fail 時に上層を実行しない（fail-fast）。各層判定は Phase 7 AC マトリクスの 13 項目チェックリストに 1:1 で対応させる。

## coverage 概念の適用外性

本タスクは staging 実環境で取得する **実測 evidence の網羅性** を検証対象とするため、ユニットテストの statement / branch coverage は適用外。代替指標:

| 指標 | 値 |
| --- | --- |
| 完了条件チェックリスト達成数 | 13 / 13（Issue #494 本文の 13 チェック項目） |
| 必須証跡パス保存数 | 10 ライン × 物理ファイル（Issue #494「必須証跡パス」表に列挙） |
| `NOT_EXECUTED` 残存数 | 0（Phase 11 完了時点で `outputs/phase-11/` 配下 grep ヒット 0） |
| placeholder 文字列 grep 対象 | `NOT_EXECUTED` / `TODO_EVIDENCE` / `PLACEHOLDER` |
| evidence file size | すべて > 0 byte（空ファイルは未取得扱い） |
| secret leak hit 数 | 0（`Bearer\|token=\|sk-\|API_KEY=\|Cookie:` パターンで grep）|

## ゲート別テスト種別マトリクス

### G1 — staging deploy + smoke

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド / HTTP | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | L1 | preflight: Cloudflare auth | acceptance | 自動 | `bash scripts/cf.sh whoami \| tee $EVID/preflight/cf-whoami.log` | `evidence/preflight/cf-whoami.log` | exit 0、Account ID 行が存在、トークン scope に Workers/D1 Edit を含む |
| T02 | L2 | api Workers staging publish | deploy | **手動 + G1 approval** | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \| tee $EVID/deploy/deploy-api-staging.log` | `evidence/deploy/deploy-api-staging.log` | exit 0、`Deployed ubm-hyogo-api-staging` 行と `Current Version ID` を含む |
| T03 | L2 | web Workers staging publish | deploy | **手動 + G1 approval（T02 後）** | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \| tee $EVID/deploy/deploy-web-staging.log` | `evidence/deploy/deploy-web-staging.log` | exit 0、`Deployed ubm-hyogo-web-staging` 行と `Current Version ID` を含む |
| T04 | L3 | api `/health` | curl smoke | 自動 | `curl -sSi --max-time 10 "$API_STAGING_URL/health"` | `evidence/curl/curl-public-health.log` | HTTP/2 200、JSON body |
| T05 | L3 | `/public/members` base + 6 クエリ | curl smoke + contract | 自動 | 08a-B contract に従い `q=` `zone=` `status=` `tag=` `sort=` `density=` 別 curl | `evidence/curl/curl-public-members-{base,q,zone,status,tag,sort,density}.log` | 全件 HTTP/2 200、JSON body の `items` 配列存在、`total` integer、08a-B contract と key set 一致（`jq -S 'keys'`）|
| T06 | L3 | 認可境界: `/api/me` 未認証 | authz smoke | 自動 | `curl -sSi --max-time 10 "$API_STAGING_URL/api/me"` | `evidence/curl/curl-authz-me-unauth.log` | 401 |
| T07 | L3 | 認可境界: `/api/admin/members` 未認証 | authz smoke | 自動 | `curl -sSi --max-time 10 "$API_STAGING_URL/api/admin/members"` | `evidence/curl/curl-authz-admin-unauth.log` | 401 または 403 |
| T08 | L3 | 認可境界: member role で admin | authz smoke | 手動（fixture cookie） | `curl -sSi -H "Cookie: $MEMBER_SESSION" "$API_STAGING_URL/api/admin/members"` | `evidence/curl/curl-authz-admin-member-role.log` | 403 |
| T09 | L5 | 公開 `/members` 描画 | UI screenshot | Playwright | `pnpm --filter web exec playwright test --config=playwright.staging.config.ts smoke/public-members.spec.ts` | `evidence/screenshots/public-members-staging.png` | png > 0 byte、reporter pass |
| T10 | L5 | ログイン画面 | UI screenshot | Playwright | 同上 `smoke/login.spec.ts` | `evidence/screenshots/login-staging.png` | png > 0 byte、Magic Link / Google OAuth ボタン描画 |
| T11 | L5 | 認証後 `/me` profile | UI screenshot | Playwright | 同上 `smoke/me.spec.ts`（member fixture） | `evidence/screenshots/me-staging.png` | png > 0 byte、profile データ描画 |
| T12 | L5 | `/admin` ダッシュボード | UI screenshot | Playwright | 同上 `smoke/admin.spec.ts`（admin fixture） | `evidence/screenshots/admin-staging.png` | png > 0 byte、admin ナビ描画 |
| T13 | L5 | Playwright report / trace | E2E | Playwright | `--reporter=html,list --output=evidence/playwright/` | `evidence/playwright/` | `index.html` 存在、failed=0 |
| T14 | L7 | wrangler tail 30 分 redacted | log | 手動 | `timeout 1800 bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty \| bash scripts/lib/redaction.sh \| tee $EVID/wrangler-tail/api-30min.log` | `evidence/wrangler-tail/api-30min.log` | size > 0、または冒頭に取得不能理由（token scope / quota）明記、redact 後 `Bearer\|token=\|sk-\|API_KEY=` の grep ヒット 0 |

### G2 — D1 migration apply / parity

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T15 | L4 | D1 staging migration list | parity | 自動 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \| tee $EVID/d1/d1-migrations-staging.log` | `evidence/d1/d1-migrations-staging.log` | exit 0、pending 行 0、または pending 行に `pending reason:` コメント追記 |
| T16 | L4 | D1 production migration list | parity | 自動（read-only） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \| tee $EVID/d1/d1-migrations-prod.log` | `evidence/d1/d1-migrations-prod.log` | exit 0、staging との差分が `d1-schema-parity.json` で説明可能 |
| T17 | L4 | D1 migration apply | apply | **手動 + G2 approval（pending あり時のみ）** | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | `evidence/d1/d1-migrations-staging.log`（追記） | apply 後 pending=0、または pending=0 skip 理由 evidence |
| T18 | L4 | schema parity staging vs production | parity | 自動（両 DB read-only `PRAGMA table_info`） | Phase 5 inline node script | `evidence/d1/d1-schema-parity.json` | `summary.diffCount = 0`、または `summary.productionMigrationTodo` に unassigned-task path |

### G3 — Forms schema / responses sync replay

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T19 | L6 | Forms schema sync 1 サイクル | sync replay | **手動 + G3 approval（quota 消費）** | admin endpoint POST → tee | `evidence/forms/forms-schema-sync.log` | HTTP 200、response body に `jobId` |
| T20 | L6 | Forms responses sync 1 サイクル | sync replay | **手動 + G3 approval（quota 消費）** | admin endpoint POST → tee | `evidence/forms/forms-responses-sync.log` | HTTP 200、response body に `jobId`、1 件以上 row 増分 |
| T21 | L6 | `sync_jobs` row dump | data | 自動 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT * FROM sync_jobs ORDER BY id DESC LIMIT 20"` | `evidence/forms/sync-jobs-staging.json` | rows 配列に T19/T20 の `succeeded` 行が含まれる |
| T22 | L6 | `audit_log` row dump（PII 除外） | data | 自動 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --json --command "SELECT id, event, actor, created_at FROM audit_log WHERE event LIKE 'sync.%' ORDER BY id DESC LIMIT 20"` | `evidence/forms/audit-log-staging.json` | append-only（id 単調増加）、PII カラム不在 |

### G4 — evidence commit / 09c blocker 更新（draft）

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T23 | L8 | artifacts.json parity | structure | 自動 | `diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json)` | `outputs/phase-13/main.md` に diff 結果記録 | diff 出力なし |
| T24 | L8 | `outputs/phase-11/main.md` `NOT_EXECUTED` 全置換 | placeholder | 自動 | `! grep -RE 'NOT_EXECUTED\|TODO_EVIDENCE\|PLACEHOLDER' outputs/phase-11/` | grep 結果記録 | hit 0 |
| T25 | L8 | 09c blocker 更新 | doc | 手動（user 視認） | `grep -q '09a-A 実測完了' docs/30-workflows/completed-tasks/task-09c-production-deploy-execution-001.md` | 当該 md ファイル | 文字列ヒット |
| T26 | L8 | `task-workflow-active.md` 09a-A 行更新 | doc | 手動（user 視認） | `grep -q 'runtime_evidence_captured' .claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（09a-A 行に対し） | 当該 md ファイル | 文字列ヒット |
| T27 | L8 | G1〜G4 承認 timestamp | governance | 手動 | user 発言 timestamp を追記 | `outputs/phase-13/main.md` | 4 回分の独立 timestamp が記録 |

## テストの独立性・冪等性・redaction policy

### 独立性

- 各テスト T01〜T27 は単独 evidence path を持ち、他テストの成功を前提としない（fail-fast 順序は L1→L8 のみ）。
- 1 ゲート内の T 同士は失敗しても他 T の evidence 取得を妨げない（G1 内で T05 が fail しても T06〜T14 は実行）。
- ゲート間は前ゲートの **承認証跡** を前提とする（G2 は G1 deploy 完了後、G3 は G2 schema 確定後、G4 は G3 sync evidence 揃ってから）。

### 冪等性

| テスト | 冪等性 | 補足 |
| --- | --- | --- |
| T02 / T03 deploy | 冪等（同コードを再 deploy しても新 version_id が発行されるだけ） | 旧 version_id は Phase 5 Step 2 で控える |
| T04〜T13 curl / Playwright | 冪等（read-only） | screenshot は最新撮影で上書き |
| T15 / T16 / T18 D1 list / parity | 冪等（read-only） | |
| T17 D1 apply | **非冪等**（apply 済 migration は idempotent だが、failed 状態 row の再 apply は要確認） | G2 approval で停止する根拠 |
| T19 / T20 Forms sync | **非冪等**（API quota 消費） | G3 approval で停止、`sync_jobs.kind` で重複検出 |
| T14 wrangler tail | 冪等（log 取得のみ） | |

非冪等テストは G2/G3 approval により user が明示承認した時のみ実行。

### redaction policy

すべての log 系 evidence（curl response / wrangler tail / forms sync log）は保存前に以下の redact pipeline を通す:

```bash
sed -E \
  -e 's/(Bearer )[A-Za-z0-9._-]+/\1***/g' \
  -e 's/(token=)[A-Za-z0-9._-]+/\1***/g' \
  -e 's/(sk-)[A-Za-z0-9]+/\1***/g' \
  -e 's/(API_KEY=)[A-Za-z0-9._-]+/\1***/g' \
  -e 's/(Cookie: )[^ ]+/\1***/g' \
  -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/***@***/g' \
  -e 's/\b([0-9]{1,3}\.){3}[0-9]{1,3}\b/***.***.***.***/g'
```

primary は `scripts/lib/redaction.sh`、不在時は inline sed フォールバック。

`audit_log` dump は **PII カラム除外 SELECT** のみ許可（`SELECT id, event, actor, created_at` のように email / 氏名カラムを含めない）。

## 失敗時の判定基準

| カテゴリ | 失敗条件 | 切り分け |
| --- | --- | --- |
| 4xx 期待外 | T04/T05 で 400/404 | レスポンス body と T14 wrangler tail を突き合わせ。binding 不整合・route 未配置 |
| 5xx | 任意 curl で 500/502/503 | T14 wrangler tail で Workers exception stack trace 抽出 |
| タイムアウト | curl `--max-time 10` 超過 3 回連続 | staging Workers cold start 疑い、Phase 6 S02 |
| Playwright timeout | spec 30s 超過 | trace 保存、最大 2 回 retry で flaky 判定 |
| redact leak | log evidence に Bearer/token=/sk-/API_KEY=/Cookie: が grep ヒット | redact 失敗、evidence 破棄して再取得（Phase 6 S08）|
| D1 schema drift | T18 `summary.diffCount > 0` | production migration TODO 起票（Phase 6 S05）|
| Forms quota 枯渇 | T19/T20 で 429 | 翌日 retry を main.md に記録（Phase 6 S06）|

## 08a-B contract との合流ポイント

- T05 は 08a-B Phase 11 `/public/members` の **q / zone / status / tag / sort / density runtime evidence contract** に従う。
- 合流チェック: 08a-B 側 `outputs/phase-11/evidence/` の curl response JSON と本タスク T05 の JSON body を `jq -S 'keys' file.json` で比較し、key set が一致することを確認。
- 不一致時は本タスクで API 修正せず、08a-B 側へ差し戻す follow-up を `unassigned-task/` に起票（Phase 6 S03）。

## 自走禁止操作（G1〜G4 multi-stage approval gate 再掲）

| gate | 対象テスト | 停止位置 | 承認なしで実行禁止の根拠 |
| --- | --- | --- | --- |
| G1 | T02 / T03 / T14 | `cf.sh deploy` 直前 / `cf.sh tail` 直前 | staging Workers 副作用 + log capture |
| G2 | T17 | `cf.sh d1 migrations apply` 直前 | D1 schema 永続変更 |
| G3 | T19 / T20 | Forms sync endpoint POST 直前 | Forms API quota 消費 |
| G4 | T23〜T27 commit | commit 直前（push/PR は別タスク） | repo 履歴への永続化 |

合算承認禁止・逆順実行禁止・production 拡張時は追加承認必須（Issue #494「G1-G4 multi-stage approval gate 制約」）。包括承認に解釈できる発言（"進めて" 等）で全 gate を一気に実行することは spec 違反。

## 不変条件マッピング

| 不変条件 | 対応テスト |
| --- | --- |
| #5 公開／会員／管理境界 | T05 公開 / T06 未認証 / T07 admin 未認証 / T08 member role / T11 認証後 /me / T12 admin |
| #6 D1 直接アクセスは `apps/api` のみ | T21 / T22 / T15 / T16 / T17 / T18 すべて `apps/api` 経由（`scripts/cf.sh` ラッパー） |
| #14 Forms quota 観測 | T19 / T20 を 1 サイクルに限定、T21 で `sync_jobs.status` 確認 |

## 参照資料

- Issue #494（GitHub）
- `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/phase-04.md`〜`phase-07.md`（spec 確定版・構造内包元）
- `docs/30-workflows/08a-B-public-search-filter-coverage-spec/`（`/public/members` contract）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/wrangler.toml` / `apps/web/wrangler.toml`
- `scripts/cf.sh` / `scripts/lib/redaction.sh`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

- 上流: 08a coverage gate / 08a-B contract / 08b Playwright E2E / PR #493 spec 確定
- 下流: 09c production deploy execution（本 Phase の AC 全 PASS が 09c 着手の必要条件）

## 多角的チェック観点

- 不変条件 #5 は T05〜T08 / T11 / T12 で実測
- 不変条件 #6 は T15〜T22 すべて `scripts/cf.sh` 経由で担保（`wrangler` 直叩き禁止）
- 不変条件 #14 は T19 / T20 を 1 サイクルに限定し T21 で観測
- 未実装/未実測を PASS と扱わない: `evidence file size > 0` と `NOT_EXECUTED 不在` の 2 段 gate を Phase 7 AC で全項目に適用
- placeholder と実測 evidence の物理パス分離（`outputs/phase-11/evidence/` 配下に限る）
- secret/PII の op:// 参照ルール: 仕様書本文に実値を書かない、`Cookie:` 値は redact 後保存

## サブタスク管理

- [ ] T01〜T27 のテスト項目と evidence path の対応を確定
- [ ] G1〜G4 ゲート停止位置を Phase 5 ランブックへ引き渡す
- [ ] 08a-B contract 合流チェック手段（`jq -S 'keys'`）を Phase 5 へ引き渡す
- [ ] coverage 適用外の代替指標（13/13 + NOT_EXECUTED=0 + leak=0）を Phase 7 AC へ反映
- [ ] `outputs/phase-04/main.md` を Phase 11 で作成

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 13 完了条件チェックリストに対応する 27 テスト項目（T01〜T27）が、種別 / コマンド / pass 条件で一意に定義されている
- G1〜G4 ゲート停止位置がテスト項目別に明記されている
- 08a-B contract との合流ポイントが明文化されている
- coverage 適用外の代替指標が定義されている
- 失敗時の判定基準（4xx/5xx 切り分け、redact leak、D1 drift、Forms quota）が明記されている
- 不変条件 #5/#6/#14 とテスト項目のマッピングが揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] CONST_007: 「Phase XX で対応」の先送り表現が含まれていない（follow-up は Phase 6 シナリオへの分岐として明示）
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] secret 値・PII を仕様書本文に書いていない（op:// 参照のみ）

## 次 Phase への引き渡し

Phase 5 へ:
- T01〜T27 のコマンド契約と pass 条件
- G1〜G4 ゲートの停止位置と承認発話テンプレ
- 失敗時の切り分けフロー（Phase 6 異常系検証へ繋ぐ S01〜S12）
- redact pipeline (`scripts/lib/redaction.sh`) と inline sed フォールバック
- 不変条件 #5/#6/#14 の実測担保ポイント

## 実行タスク

- [ ] phase-04 の既存セクションに記載した手順・検証・成果物作成を Phase 11 で実行する。
