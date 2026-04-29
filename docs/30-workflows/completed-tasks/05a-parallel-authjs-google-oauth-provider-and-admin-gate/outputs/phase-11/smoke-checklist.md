# Phase 11 — 手動 smoke チェックリスト（実環境再現用）

実 Google OAuth credentials + Cloudflare Workers staging が用意できた段階（Phase 09a）で本ファイルを上から順に実行する。各行の evidence path は `outputs/phase-11/` 配下を指す。

## 前提

- 1Password から Cloudflare API Token / Google OAuth client_id・secret が `bash scripts/cf.sh` 経由で注入されている
- D1 staging に以下の seed が投入されている:
  - `member-unregistered@example.com`（admin_users 不在 / members 不在）
  - `member-rules-declined@example.com`（rulesConsent=false の最終応答）
  - `member-deleted@example.com`（members.deletedAt 非 null）
  - `member-general@example.com`（一般 member, admin_users 不在）
  - `member-admin@example.com`（一般 member + admin_users 登録）

## ステップ 1: 起動

```bash
# Terminal 1
bash scripts/cf.sh dev --config apps/api/wrangler.toml --env staging \
  2>&1 | tee outputs/phase-11/wrangler-dev.log

# Terminal 2
mise exec -- pnpm dev --filter=@ubm/web
```

## ステップ 2: OAuth flow（M-01 〜 M-05）

| # | 入力 | 期待 | evidence |
| --- | --- | --- | --- |
| M-01 | `member-unregistered@example.com` で `/login` → Google OAuth → callback | URL bar が `/login?gate=unregistered`、画面に「未登録です」表示 | `screenshot-unregistered.png` |
| M-02 | `member-rules-declined@example.com` で OAuth | `/login?gate=rules_declined` redirect、`rulesConsent=false` を引いていること（不変条件 #2） | `screenshot-rules-declined.png` |
| M-03 | `member-deleted@example.com` で OAuth | `/login?gate=deleted` redirect、本人本文編集 UI に飛ばない（不変条件 #4） | `screenshot-deleted.png` |
| M-04 | `member-general@example.com` で OAuth | `/profile` 表示、DevTools の session に `isAdmin:false` / `memberId` のみ（responseId 無し、不変条件 #7） | `screenshot-member-profile.png` + `session-member.json` |
| M-05 | `member-admin@example.com` で OAuth | `/profile` 表示、session に `isAdmin:true`（不変条件 #7 同様 responseId 無し） | `screenshot-admin-profile.png` + `session-admin.json` |

session-*.json の取得方法（Chrome DevTools → Application → Cookies → `authjs.session-token` を decode、または `/api/auth/session` を fetch）:

```bash
curl -s http://localhost:3000/api/auth/session -H "Cookie: authjs.session-token=<JWT>" \
  | jq . > outputs/phase-11/session-member.json
```

## ステップ 3: admin gate 二段防御（M-06 〜 M-11）

| # | シナリオ | 期待 | evidence |
| --- | --- | --- | --- |
| M-06 | 未ログインで `/admin/dashboard` を開く | `/login?gate=admin_required` redirect | `screenshot-admin-no-auth.png` |
| M-07 | M-04 の member cookie で `/admin/dashboard` を開く | `/login?gate=admin_required` redirect | `screenshot-admin-non-admin.png` |
| M-08 | M-05 の admin cookie で `/admin/dashboard` を開く | dashboard 表示（200） | `screenshot-admin-ok.png` |
| M-09 | M-04 JWT で `curl http://localhost:8787/admin/users` | 403 `{"error":"forbidden"}` | `curl-admin-non-admin.txt` |
| M-10 | M-05 JWT で `curl http://localhost:8787/admin/users` | 200 + user list | `curl-admin-ok.txt` |
| M-11 | Authorization なしで `curl http://localhost:8787/admin/users` | 401 `{"error":"unauthorized"}` | `curl-admin-no-auth.txt` |

```bash
JWT_MEMBER="<M-04 で得た authjs.session-token>"
JWT_ADMIN="<M-05 で得た authjs.session-token>"

curl -i -H "Authorization: Bearer $JWT_MEMBER" http://localhost:8787/admin/users \
  | tee outputs/phase-11/curl-admin-non-admin.txt
curl -i -H "Authorization: Bearer $JWT_ADMIN" http://localhost:8787/admin/users \
  | tee outputs/phase-11/curl-admin-ok.txt
curl -i http://localhost:8787/admin/users \
  | tee outputs/phase-11/curl-admin-no-auth.txt
```

## ステップ 4: bypass 試行（F-09 / F-15 / F-16）

```bash
# F-15
curl -i 'http://localhost:3000/admin/dashboard?bypass=true' \
  | tee outputs/phase-11/bypass-query.txt
# 期待: 302 to /login?gate=admin_required

# F-16
curl -i 'http://localhost:3000/admin/dashboard' \
  -H 'Cookie: authjs.session-token=fake.jwt.value' \
  | tee outputs/phase-11/bypass-cookie.txt
# 期待: 302 to /login（verify fail）

# F-09: M-04 JWT の payload を base64 で `isAdmin:true` に書き換えて再送
TAMPERED="<改ざん後 JWT>"
curl -i -H "Authorization: Bearer $TAMPERED" http://localhost:8787/admin/users \
  | tee outputs/phase-11/jwt-tampered.txt
# 期待: 401（signature mismatch）
```

## ステップ 5: `/no-access` 不在確認（実施済）

→ `no-access-check.txt` 参照（本 Phase で完了済 / PASS）

## ステップ 6: B-01 race condition

```bash
# 1. M-05 で OAuth → admin cookie 取得
# 2. D1 から admin_users.memberId を DELETE
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "DELETE FROM admin_users WHERE memberId='<M-05 memberId>'"
# 3. 同じ cookie で curl
curl -i -H "Authorization: Bearer $JWT_ADMIN" http://localhost:8787/admin/users \
  | tee outputs/phase-11/race-condition-admin-revoke.txt
# 期待: 200（既知制約 B-01 — JWT 内の isAdmin=true がそのまま残る）
# 4. ログアウト → 再ログインで isAdmin=false に再評価されること
```

## 完了判定

すべての evidence が outputs/phase-11/ に保存され、期待と一致したら Phase 12 へ進む。1 件でも fail なら Phase 5 へ巻き戻し。
