# Phase 11 手動 smoke 実行ログ（テンプレート）

> 各 test ID の PASS / FAIL を実機実行時に埋める。
> 全 test ID 完了後に `outputs/phase-11/main.md` 集計に転記。
>
> 判定ルール: `PASS` は期待結果と証跡が揃った項目だけに使う。未実行は `TBD`、前提未達は `BLOCKED`、前段失敗により実施しない項目は `SKIPPED`、一部だけ確認できた項目は `PARTIAL` とする。完了していない項目を見込みで `PASS` にしない。

## Stage A 実行結果

| test ID | 結果 | 備考 / screenshot |
| --- | --- | --- |
| M-01 | PASS | `/login` 表示と Google ログインボタン表示を確認。screenshot: `staging/01-login-page.png` |
| M-02 | PASS | Google OAuth 画面（Google login / account chooser / consent flow）への遷移を確認。screenshot: `staging/02-google-consent.png` |
| M-03 | BLOCKED / PARTIAL | `/api/auth/callback/google` は 302 でアプリへ戻ったが、最終着地が `/login?gate=unregistered`。期待値 `/` または `/profile` には未達。screenshot: `staging/03-callback-redirect.png` |
| M-04 | SKIPPED | M-03 が `/login?gate=unregistered` で終了し、session cookie が発行されていないため未実施 |
| M-05 | SKIPPED | M-03 が `/login?gate=unregistered` で終了し、authenticated session JSON が取得できないため未実施 |
| M-06 | TBD | `staging/05-admin-allowed.png` |
| M-07 | TBD | `staging/06-admin-denied.png` |
| M-08 | BLOCKED | ログアウトボタン / sign-out UI 導線が未実装のため、UI 操作による cookie 削除 evidence を取得できない。未タスク: `docs/30-workflows/unassigned-task/task-05a-auth-ui-logout-button-001.md` |
| M-09 | TBD | cookie 手動削除版 |
| M-10 | TBD | `/admin/members` redirect |
| M-11 | PASS（再実行 2026-05-01）| `op run --env-file=.env --account manju.1password.com -- ... pnpm --filter web dev` で `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `INTERNAL_API_BASE_URL=http://localhost:8787` を注入。`web-dev.log` に `GET /api/auth/providers 200` / `GET /api/auth/callback/google ... 302` / `GET /login?gate=unregistered 200` / `GET /login?gate=admin_required 200` の entry を確認。session-resolver は unregistered 判定で session 非発行（仕様通り）。`session JSON` は `null`、`/admin` は `gate=unregistered` redirect。 |
| F-09 (staging) | EXPECTED FAIL（rules_declined 経由）| 2026-05-01 実施。`https://ubm-hyogo-web-staging.daishimanju.workers.dev/login` から外部 Gmail で sign-in → `/login?gate=rules_declined` へ redirect。email は `member_identities` に存在するが `member_status.rules_consent != 'consented'` のため session 非発行。B-03 制約と等価の admin/member 不可動作を確認。 |
| F-15 | TBD | `staging/08-redirect-mismatch.png` |
| F-16 | TBD | `staging/09-state-mismatch.png` |
| B-01 | TBD | `staging/10-cookie-tamper.png` |

合計 PASS: 2/14（F-09 を除く、M-03 は partial のため PASS に含めない）
判定: A → B BLOCKED（staging D1 の会員 identity / consent 状態確認が必要）

### Stage A 補足（2026-04-30）

- Cloudflare web staging の `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_SECRET` は 1Password item `ubm-hyogo-env` の field label から再投入済み。
- `op read .../credential` では空値投入になったため、以後は `op item get ubm-hyogo-env --vault Employee --fields label=<FIELD> --reveal` を使う。
- OAuth provider discovery と CSRF endpoint は復旧済み。
- Google OAuth callback はアプリまで戻るが、ログインした Google email が staging D1 の `member_identities.response_email` と照合できず `/login?gate=unregistered` に着地した。
- staging D1 は schema drift があり、`member_identities` table / `members` view が欠落していた。手動補修後、両方が `sqlite_master` に出ることを確認済み。
- `SELECT count(*) AS identities FROM member_identities;` は `0`。次のブロッカーは Google Forms response sync 未投入であり、`POST /admin/sync/responses?fullSync=true` で `member_identities` / `member_status` を埋める必要がある。
- 後続確認: sync 後に staging D1 の `member_identities.response_email` と `member_status.rules_consent = 'consented'` が、テストに使用した Google email と一致すること。
- M-11 local smoke では Cloudflare Secrets は自動注入されない。web dev に `AUTH_SECRET` を渡さないと Auth.js が `MissingSecret` で `/api/auth/providers` 500 を返し、Google login を開始できない。
- M-11 の `STG` はターミナルごとのシェル変数。新しいターミナルで `grep "$STG/wrangler-dev.log"` を実行すると `STG` が空になり、`grep: /wrangler-dev.log: No such file or directory` になる。各ターミナルで `export TASK_DIR=...; export STG=...; mkdir -p "$STG"; echo "$STG"` を先に実行する。
- M-11 は API dev / web dev を 1 本ずつに揃える。複数の `wrangler dev` が残ると API port と `INTERNAL_API_BASE_URL` がズレるため、迷ったら `ps ... | grep -E "wrangler dev|next dev"` で確認してから既存 process を停止する。

## Stage B 実行結果

| 項目 | 結果 |
| --- | --- |
| privacy 200 | **FAIL (404)** | `apps/web/app/` に privacy ページ未実装。詳細: `discovered-issues.md` P11-PRD-004 [HIGH] |
| terms 200 | **FAIL (404)** | `apps/web/app/` に terms ページ未実装。詳細: P11-PRD-004 [HIGH] |
| home 200 | **FAIL (500)** | `fetchPublic` が `/public/stats 404` で失敗 → 500。`PUBLIC_API_BASE_URL` を `apps/web/wrangler.toml` の staging/production vars に追加して redeploy 済だが解消せず。同URLを直叩きするとAPIは200。同一 account workers.dev loopback の可能性。詳細: P11-PRD-003 [HIGH]。再修正は P11-PRD-002 の build 失敗 fix 後。 |
| /members 200 | **FAIL (500)** | 同 P11-PRD-003 経路 |
| /login 200 | PASS | 200 |
| /register 200 | PASS | 200 |
| /admin 307 | PASS | login redirect 動作 |
| /api/auth/providers 200 | PASS | GET 200（HEAD は Auth.js が UnknownAction 400、テスト method 問題: P11-OBS-001 [LOW]）|
| /api/auth/csrf 200 | PASS | GET 200 |
| /api/auth/session 200 | PASS | GET 200 |
| API /public/* | PASS (一部 FAIL) | `/public/stats` `/public/members` `/public/healthz` 200。`/public/form-preview` **503**: P11-PRD-005 [MED] |
| apps/web build | **FAIL** | `/_global-error/page` prerender で `Cannot read properties of null (reading 'useContext')`。新規 deploy 不可。詳細: P11-PRD-002 [HIGH]（**最優先**）|
| consent screen "In production" | TBD |
| submission screenshot | TBD（`production/consent-screen.png`） |
| Publishing status | TBD（Pending verification / Verified） |

判定: B → C **BLOCKED**（privacy/terms 未実装 + home 500 で B-1 前提未達。詳細: `discovered-issues.md` P11-PRD-001）

## Stage C 実行結果

| test ID | 結果 | 備考 |
| --- | --- | --- |
| Cloudflare Secrets production 投入 | TBD | `production/secrets-list-*.txt` |
| production deploy | TBD | |
| F-09 (production) | TBD | `production/login-smoke.png` |
| URL 200 再確認 | FAIL | `production/url-200-check.txt`: `/` 500 / `/privacy` 404 / `/terms` 404（B-1 と同要因） |
| wrangler login 不在 | PASS | `production/wrangler-login-absence.txt`: OAuth token ファイル無し / `CLOUDFLARE_API_TOKEN=` / `wrangler login` の git grep 0件 |

判定: C 完了 __ / B-03 解除条件採用: a / b / c
