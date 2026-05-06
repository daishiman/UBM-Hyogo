[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 4 Output: テスト戦略 — 09c-A-production-deploy-execution

## 1. テスト戦略の基本方針

本タスクは「production deploy 実行 + evidence 収集」の operation gate のみを担う。アプリケーションコードの新規実装は範囲外であるため、コードに対する unit / contract / integration テスト追加は本 Phase の責務外（既存テストは 09a / 09b で green であることを前提とする）。

本 Phase で確定するのは **production deploy 実行前後の検証マトリクス** であり、各層が runtime 上で何を検証し、どの evidence ファイルに結果を残すかを 1:N で定義する。

### 検証 5 層と責務

| 層 | 名前 | 目的 | テストレベル | 主 evidence prefix |
| --- | --- | --- | --- | --- |
| L1 | pre-deploy preflight | 上流 green / Cloudflare identity / D1 backup / migration list（apply 前） | contract（read-only） | `preflight-*.md`, `cf-whoami.txt`, `d1-backup-*.sql`, `d1-migrations-list-before.txt` |
| L2 | D1 mutation | migration apply 前後の Applied 件数比較 | integration | `d1-migrations-apply.txt`, `d1-migrations-list-after.txt` |
| L3 | deploy execution | api / web の build + deploy が exit 0、version_id を取得 | smoke（exit code） | `api-deploy.log`, `api-version.md`, `web-deploy.log`, `web-version.md` |
| L4 | post-deploy smoke | public/member/admin 10 ルート + manual sync + 不変条件 #5 / #6 / #11 | e2e + manual smoke | `smoke-public.md`, `smoke-member.md`, `smoke-admin.md`, `smoke-screenshots/*.png`, `invariants.md` |
| L5 | 24h verification | Cloudflare Workers / D1 metrics / `sync_jobs` / 不変条件 #14 | observability gating | `24h-verification-summary.md`, `24h-metrics-screenshots/*.png`, `post-deploy-healthcheck.md` |

### 09a staging smoke / 09b observability との関係

| 上流 | 本タスクで前提とする状態 | 本タスクで追加検証する項目 |
| --- | --- | --- |
| 09a-A staging smoke | staging で public/member/admin smoke が green。同じテストハーネスを production に流用 | production-only の URL / authz / VISUAL evidence |
| 09b-A observability | Sentry / Slack の binding が runtime 通知に届くことを staging で確認済み | production binding でも通知が出ること（Step 7 healthcheck で連動） |
| 09b-B post-deploy smoke | silent failure 検知 mechanism が staging 環境で green | production 環境に同 mechanism を接続して通知到達を確認 |

09a / 09b で完了した unit/contract/E2E は本タスクで再実行しない（L4 smoke は production runtime に対する exec smoke のみ）。

## 2. Verify suite（5 層 × ケース）

### L1 pre-deploy preflight

| ID | ケース | コマンド / 操作 | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| L1-1 | 上流 09a-A の Phase 11 が green | `ls docs/30-workflows/09a-*/outputs/phase-11/` を確認、smoke 結果を citation | smoke-public/member/admin の green ログが揃う | `outputs/phase-11/upstream-green-evidence.md` |
| L1-2 | 上流 09b-A の observability 疎通 | 09b-A の outputs/phase-11/ から runtime 通知の到達 evidence を citation | Sentry / Slack 通知の到達ログ | `outputs/phase-11/upstream-green-evidence.md` |
| L1-3 | 上流 09b-B の post-deploy healthcheck | 09b-B の outputs/phase-11/ から silent failure 検知 evidence を citation | 検知 mechanism の green | `outputs/phase-11/upstream-green-evidence.md` |
| L1-4 | main 同期 | `git fetch origin main && git rev-parse origin/main` | exit 0、HEAD commit hash を取得 | `outputs/phase-11/main-merge-commit.txt` |
| L1-5 | Cloudflare identity | `bash scripts/cf.sh whoami` | production 操作対象 account / email が一致 | `outputs/phase-11/cf-whoami.txt`（mask 済み） |
| L1-6 | D1 backup | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --remote --output=outputs/phase-11/d1-backup-<ts>.sql --env production --config apps/api/wrangler.toml` | size > 0、ファイル生成成功 | `outputs/phase-11/d1-backup-<ts>.sql` |
| L1-7 | D1 migration list（apply 前） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | Pending 件数を観測（0 でも可） | `outputs/phase-11/d1-migrations-list-before.txt` |
| L1-8 | user approval log（Phase 10） | `outputs/phase-11/user-approval-log.md` の Phase 10 セクション存在 | 承認 entry あり | `outputs/phase-11/user-approval-log.md` |

### L2 D1 mutation

| ID | ケース | コマンド | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| L2-1 | user approval（apply gate） | `outputs/phase-11/user-approval-log.md` の `apply` セクション | 承認 entry あり、未承認なら STOP | `user-approval-log.md` |
| L2-2 | migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | exit 0、applied 件数 ≥ 0 | `outputs/phase-11/d1-migrations-apply.txt`, `d1-apply.log` |
| L2-3 | migration list（apply 後） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml` | apply 前と比較し Applied 件数 ≥ before | `outputs/phase-11/d1-migrations-list-after.txt` |

### L3 deploy execution

`apps/api` / `apps/web` ともに `package.json` 上には deploy script が存在しない（`apps/api` は `wrangler deploy` のみで `bash scripts/cf.sh` 経由ではない）。CLAUDE.md および `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` §5 に従い、**正規経路は `bash scripts/cf.sh deploy --config <path> --env production` 直接呼び出し** とする。Phase 1-3 で言及された `pnpm --filter @ubm/api deploy:production` は package.json scripts に存在しないため採用しない（本 Phase で訂正）。

| ID | ケース | コマンド | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| L3-1 | user approval（API deploy gate） | `user-approval-log.md` の `api-deploy` | 承認 entry あり | `user-approval-log.md` |
| L3-2 | api typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | `outputs/phase-11/api-typecheck.log` |
| L3-3 | api deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | exit 0、`Deployed ubm-hyogo-api triggers` 出力、version_id 表示 | `outputs/phase-11/api-deploy.log`, `api-version.md` |
| L3-4 | user approval（Web deploy gate） | `user-approval-log.md` の `web-deploy` | 承認 entry あり | `user-approval-log.md` |
| L3-5 | web OpenNext build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0、`.open-next/worker.js` と `.open-next/assets/` が生成 | `outputs/phase-11/web-build.log` |
| L3-6 | web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` | exit 0、Workers Static Assets 同梱で deploy 成功、version_id 表示 | `outputs/phase-11/web-deploy.log`, `web-version.md` |
| L3-7 | bundle size guard | `.open-next/worker.js` のサイズ確認 | Free プラン 3 MiB 未満 | `outputs/phase-11/web-build.log` 内に size 記録 |

### L4 post-deploy smoke

10 ルート構成（09a 完了済み serial と整合）:

| カテゴリ | ルート（5） | role |
| --- | --- | --- |
| public | `/`, `/members`, `/members/:id` | 未認証 |
| auth 入口 | `/login` | 未認証 |
| protected member | `/profile` | member |
| protected admin | `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` | admin |

| ID | ケース | コマンド / 操作 | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| L4-1 | public 3 smoke | `curl -sI "${PRODUCTION_WEB}/" \| head -1`（同様に `/members`, `/members/:id`） | 200 | `outputs/phase-11/smoke-public.md` |
| L4-2 | login 入口 | `curl -sI "${PRODUCTION_WEB}/login" \| head -1` | 200 | `smoke-public.md` |
| L4-3 | member 認証必須 | `curl -sI "${PRODUCTION_WEB}/profile"`（未認証）、ブラウザで Google OAuth 後に `/profile` を確認 | 未認証は 302 (Auth.js redirect)、認証後は 200 で編集 form **不在**（不変条件 #4） | `outputs/phase-11/smoke-member.md`, `smoke-screenshots/member-profile-<ts>.png` |
| L4-4 | admin role 5 ルート | `/admin`, `/admin/members`, `/admin/tags`, `/admin/schema`, `/admin/meetings` を admin role で確認 | admin role: 200。member role: 403 / リダイレクト | `outputs/phase-11/smoke-admin.md`, `smoke-screenshots/admin-*-<ts>.png` |
| L4-5 | manual sync trigger | `POST ${PRODUCTION_API}/admin/sync/schema` / `POST ${PRODUCTION_API}/admin/sync/responses`（admin cookie 必須） | 200 + sync_jobs に `success` 行追加（read-only SQL で確認） | `outputs/phase-11/smoke-admin.md` 内 sync section |
| L4-6 | 不変条件 #5（authz boundary） | role 切替で 200/302/403 一致 | role × ルート の期待値どおり | `smoke-*.md` の authz 表 |
| L4-7 | 不変条件 #6（apps/web → D1 直接 access 禁止） | `rg "D1Database" apps/web/.open-next/` (build 後) | 0 hit | `outputs/phase-11/invariants.md` |
| L4-8 | 不変条件 #11（admin が本人本文を編集不可） | admin UI を click 確認、編集 form 不在 | form なし | `smoke-screenshots/admin-members-<ts>.png` + `invariants.md` |
| L4-9 | post-deploy healthcheck（09b-B 連携） | 09b-B の healthcheck mechanism を production binding で発火 | silent failure を検知できる、Sentry / Slack に通知到達 | `outputs/phase-11/post-deploy-healthcheck.md` |

### L5 24h verification

| ID | ケース | 取得方法 | 期待結果 | evidence |
| --- | --- | --- | --- | --- |
| L5-1 | Workers requests / errors | Cloudflare Dashboard → Workers → `ubm-hyogo-api` (production) → Analytics の screenshot | req < 5k/day（free-tier 10% 以下） | `outputs/phase-11/24h-metrics-screenshots/workers-requests-<ts>.png` |
| L5-2 | D1 read/write rows | Cloudflare Dashboard → D1 → `ubm-hyogo-db-prod` → Metrics の screenshot | reads / writes が無料枠 10% 以下 | `outputs/phase-11/24h-metrics-screenshots/d1-rows-<ts>.png` |
| L5-3 | sync_jobs 状況 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --env production --config apps/api/wrangler.toml --command "SELECT status, COUNT(*) FROM sync_jobs GROUP BY status"` | `success` 主体、`failed` 連続なし | `outputs/phase-11/24h-verification-summary.md` |
| L5-4 | Sentry / Slack 24h 通知 | 09b-A 通知履歴を確認、誤報 / 沈黙が無いこと | 沈黙時は incident（09b incident runbook へ） | `outputs/phase-11/24h-verification-summary.md` |
| L5-5 | 不変条件 #14（free-tier） | L5-1 / L5-2 の閾値再確認 | 全 metrics が無料枠 10% 以下 | `24h-verification-summary.md` summary |
| L5-6 | 24h 後の web bundle 不変条件 #6 再確認 | `rg "D1Database" apps/web/.open-next/` を local artifact で再実行 | 0 hit | `24h-verification-summary.md` 内に記録 |

## 3. AC × evidence path mapping

| AC | 内容 | 検証層 | evidence path |
| --- | --- | --- | --- |
| AC-1 | user approval evidence が保存される | L1 / L2 / L3 各 gate | `outputs/phase-11/user-approval-log.md`（Phase 10 / 11 / 13 セクション集約） |
| AC-2 | production D1 migration が Applied として確認される | L1（before） / L2（apply, after） | `outputs/phase-11/d1-migrations-list-before.txt`, `d1-migrations-apply.txt`, `d1-apply.log`, `d1-migrations-list-after.txt`, `d1-backup-<ts>.sql` |
| AC-3 | api/web production deploy が exit 0 | L3 | `outputs/phase-11/api-deploy.log`, `api-version.md`, `web-deploy.log`, `web-version.md`, `web-build.log` |
| AC-4 | production public/member/admin smoke が green | L4 | `outputs/phase-11/smoke-public.md`, `smoke-member.md`, `smoke-admin.md`, `smoke-screenshots/*.png`, `invariants.md`, `post-deploy-healthcheck.md` |
| AC-5 | release tag と 24h verification summary が保存される | L4 末尾 + L5 | `outputs/phase-11/release-tag.txt`, `24h-verification-summary.md`, `24h-metrics-screenshots/*.png` |

## 4. VISUAL evidence inventory

### smoke-screenshots/（10 画面）

| 画面 | URL（template） | role | ファイル名 |
| --- | --- | --- | --- |
| public home | `/` | 未認証 | `public-home-<ts>.png` |
| members 一覧 | `/members` | 未認証 | `public-members-list-<ts>.png` |
| member detail | `/members/<sample-id>` | 未認証 | `public-member-detail-<ts>.png` |
| login 入口 | `/login` | 未認証 | `auth-login-<ts>.png` |
| member profile | `/profile` | member | `member-profile-<ts>.png` |
| admin dashboard | `/admin` | admin | `admin-dashboard-<ts>.png` |
| admin members | `/admin/members` | admin | `admin-members-<ts>.png` |
| admin tags | `/admin/tags` | admin | `admin-tags-<ts>.png` |
| admin schema | `/admin/schema` | admin | `admin-schema-<ts>.png` |
| admin meetings | `/admin/meetings` | admin | `admin-meetings-<ts>.png` |

### 24h-metrics-screenshots/（3 画面）

| 画面 | 取得元 | ファイル名 |
| --- | --- | --- |
| Workers requests | Cloudflare Dashboard → Workers → `ubm-hyogo-api` Analytics | `workers-requests-<ts>.png` |
| D1 metrics | Cloudflare Dashboard → D1 → `ubm-hyogo-db-prod` Metrics | `d1-rows-<ts>.png` |
| sync_jobs 集計 | terminal screenshot（SQL 結果） | `sync-jobs-<ts>.png` |

### 取得手順

- 認証必須画面はブラウザで Google OAuth ログイン後に macOS Cmd+Shift+4 で window 撮影、または Playwright 経由で headless 撮影。
- Cloudflare Dashboard 系は Cmd+Shift+4 で metrics の datetime range が分かる範囲を含めて撮影。
- すべて `<ts>` には ISO 互換 `YYYYMMDD-HHMM` を埋める。撮影日時は `manual-smoke-log.md` に記録。

## 5. skip ルール

| skip 対象 | 条件 | 代替 evidence | 必須記録先 |
| --- | --- | --- | --- |
| L4-5 manual sync trigger | admin role の session cookie が取得不能 | curl で 401 を確認し、cookie 取得は別運用に分離。`sync_jobs` 直 SQL のみで status を確認 | `manual-smoke-log.md` |
| L4 screenshot 撮影 | CLI のみで Playwright も起動できない環境 | 手動ブラウザ確認の実行記録（実行日時 / role / 結果）を記述。dummy PNG 作成は禁止（false green 防止） | `manual-smoke-log.md` の `CAPTURE_BLOCKED` セクション |
| L5 24h verification | 24h 経過していない | 24h 後に再実行する旨を `24h-verification-summary.md` 冒頭に PENDING で残し、deadline を記録 | `24h-verification-summary.md` |
| L1-1〜L1-3 上流 citation | 上流 outputs が未配置 | NO-GO（Phase 10 で stop。本タスク再開不可） | — |

silent skip（記録なしの skip）は禁止。`manual-smoke-log.md` に skip 理由・代替経路・再実行予定を必ず記録する。

## 6. 不変条件カバレッジ

| 不変条件 | 検証層 / ケース | evidence |
| --- | --- | --- |
| #5 public/member/admin boundary | L4-1〜L4-4, L4-6 | `smoke-*.md` 内 authz 表 |
| #6 apps/web から D1 直接 access 禁止 | L4-7 | `invariants.md`（`rg "D1Database" apps/web/.open-next/` 0 hit） |
| #14 Cloudflare free-tier | L5-1, L5-2, L5-5 | `24h-verification-summary.md`, `24h-metrics-screenshots/*.png` |

`apps/web/.open-next/` の bundle inspection が production-only な追加検証点。staging 09a-A では evidence が staging artifact ベースなので、本タスクで production build 直後の artifact に対して再実行する。

## 7. テストレベル責務分離

| テストレベル | 担当 wave | 本タスクでの再実行 |
| --- | --- | --- |
| unit | 02-08（各実装タスク） | 行わない（CI green が前提） |
| contract（IPC / D1 schema） | 02a / 02b | 行わない |
| integration | 02-08 各タスク | 行わない |
| staging smoke (e2e + manual) | 09a-A | 行わない（前提として citation） |
| production smoke (e2e + manual) | **本タスク L4** | **実行**（production-only） |
| 24h verification | **本タスク L5** | **実行**（production-only） |
| post-deploy healthcheck mechanism | 09b-B | mechanism 自体は実装済み。本タスクは production binding に接続するのみ |

## 8. user approval gate（テスト戦略上の位置付け）

| gate | 担当 Phase | 前提層 |
| --- | --- | --- |
| Phase 10 approval | 設計レビューの最終確定 | L1 開始前 |
| Phase 11 apply approval | D1 mutation gate | L2 開始前 |
| Phase 11 api deploy approval | API mutation gate | L3 中 |
| Phase 11 web deploy approval | Web mutation gate | L3 中 |
| Phase 11 release tag push approval | tag mutation gate | L4 開始前 |
| Phase 13 dev → main merge approval | release 確定 | L1 の前提（main 同期前） |

approval なしに該当層を skip して PASS と記録することは禁止。承認待ちの場合は `PENDING_USER_APPROVAL` と明示する。

## 9. Phase 5 への引き渡し

- 5 層 verify suite × ケースを Phase 5 runbook の Step に 1:1 以上で接続
- VISUAL inventory（10 + 3 画面）を Phase 5 / Phase 11 の取得手順に転記
- skip ルールを Phase 6（異常系）と Phase 11（実測）に転記
- AC × evidence mapping を Phase 7 AC matrix の base として再利用
- 上流 citation 形式を Phase 11 で実 path に置換
