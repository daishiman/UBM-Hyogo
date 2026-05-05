# Phase 4 主成果物 — テスト戦略

> 仕様: `phase-04.md`

## 自動化テストの再利用範囲（05a 完了分）

| 種別 | 物理位置 | 本タスクでの扱い |
| --- | --- | --- |
| Auth.js Google provider unit test | `apps/api` 配下 | **再実行のみ**（コード変更なし） |
| admin-gate.ts unit test | 同上 | 同上 |
| middleware integration test（`/admin/*` redirect） | 同上 | 同上 |
| smoke-checklist.md | 05a workflow 配下 | **本タスクで再実行**して evidence を上書き |

> 本タスクは新規コード追加ゼロ。Phase 11 staging smoke 直前に `pnpm test` を 1 度緑にすることのみ要求。

## test ID × 段階適用マトリクス

| test ID | 内容 | Stage A (staging) | Stage C (production) |
| --- | --- | --- | --- |
| M-01 | `/login` 表示 → Google sign-in 開始 | YES | YES |
| M-02 | Google consent screen 表示 | YES | YES（verified 後は簡略化） |
| M-03 | callback `/api/auth/callback/google` で 302 → `/` | YES | YES |
| M-04 | session-token cookie が `Secure; SameSite=Lax` | YES | YES |
| M-05 | `/api/auth/session` JSON に email/name 反映 | YES | YES |
| M-06 | allowlist 一致 email で `/admin` 200 | YES | YES |
| M-07 | 不一致 email で `/admin` → `/login?gate=admin` | YES | NO |
| M-08 | sign-out で session cookie 削除 | YES | YES |
| M-09 | session 有効期限切れ後再 sign-in | YES | NO |
| M-10 | `/admin/*` 配下任意ルートで gate redirect | YES | NO |
| M-11 | wrangler-dev.log に callback/session/admin entry | YES | NO（Cloudflare Logs で確認） |
| F-09 | testing user 以外で `/login` → `/admin` 完走 | NO（B-03 で fail 期待） | **YES（Stage C 中核）** |
| F-15 | redirect URI 不一致時のエラー画面 | YES（fault injection） | NO |
| F-16 | OAuth state mismatch エラー | YES | NO |
| B-01 | session cookie 改ざん時の reject | YES | NO |

## AC × test ID トレース

| AC | カバー |
| --- | --- |
| AC-1 | redirect URI matrix と Console 登録の手動 diff（Phase 5 Step A-1） |
| AC-2 | `bash scripts/cf.sh secret list` で 3 key 存在確認 |
| AC-3 | secrets-placement-matrix.md + Phase 12 で 02-auth.md / 13-mvp-auth.md から参照 |
| AC-4 | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を staging で実行 |
| AC-5 | M-06 / M-07 / M-10（staging） |
| AC-6 | Stage B 完了 + consent screen screenshot |
| AC-7 | F-09（production Stage C） |
| AC-8 | privacy / terms / home `curl -I` で 200 確認 |
| AC-9 | `git grep` で `wrangler login` 0 件 + `~/.../wrangler/config/default.toml` 不在 |
| AC-10 | Phase 12 で `13-mvp-auth.md` 更新 |
| AC-11 | Phase 9 free-tier-estimation.md で根拠化 |
| AC-12 | 05a Phase 11 placeholder を本タスク outputs リンクで上書き |

## VISUAL evidence: screenshot 9 枚以上

| # | ファイル | 撮影対象 | 段階 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/staging/01-login-page.png` | `/login` 画面 | A |
| 2 | `outputs/phase-11/staging/02-google-consent.png` | Google consent | A |
| 3 | `outputs/phase-11/staging/03-callback-redirect.png` | callback 後 `/` 着地 | A |
| 4 | `outputs/phase-11/staging/04-session-json.png` | `/api/auth/session` JSON | A |
| 5 | `outputs/phase-11/staging/05-admin-allowed.png` | allowlist 一致時 `/admin` | A |
| 6 | `outputs/phase-11/staging/06-admin-denied.png` | 不一致時 redirect | A |
| 7 | `outputs/phase-11/staging/07-signout.png` | sign-out 後 cookie 削除 | A |
| 8 | `outputs/phase-11/production/consent-screen.png` | Console consent screen | B |
| 9 | `outputs/phase-11/production/login-smoke.png` | 外部 Gmail で `/admin` 到達 | C |

## 撮影時の必須注意

- DevTools Network/Application タブの `set-cookie` / `Authorization` 値はマスクまたは画面外
- callback 直後（URL に `code=` / `state=`）は撮らない。`/` 着地後に撮影
- Console / Cloudflare dashboard の `Client ID` / `Client secret` は "Hide" 後に撮影
- ターミナル screenshot は `secret list`（マスク済み出力）まで。`secret put` の stdin / op read 出力は撮らない

## coverage 代替指標

| 指標 | 目標 | 計測 |
| --- | --- | --- |
| smoke PASS 率（staging） | M-01〜M-11 / F-15 / F-16 / B-01 で 100% | manual-smoke-log.md |
| F-09 PASS 率（production） | 100% | manual-smoke-log.md |
| screenshot 充足率 | 9 枚以上 + secret/token 非露出 | 目視レビュー |
| AC カバレッジ | AC-1〜AC-12 すべてに 1+ test ID/検証 | 本ファイル AC × test ID 表 |

## 検証コマンド集

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
curl -I https://<production-domain>/
curl -I https://<production-domain>/privacy
curl -I https://<production-domain>/terms
curl -s -b cookies.txt https://<staging-domain>/api/auth/session | jq .
ls ~/Library/Preferences/.wrangler/config/default.toml 2>&1 | grep -q "No such file" && echo OK
git grep -n "wrangler login" -- ':!docs/' ':!CLAUDE.md' ':!.claude/' && exit 1 || echo OK
```
