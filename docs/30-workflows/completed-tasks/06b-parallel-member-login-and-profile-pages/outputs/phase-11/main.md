# Phase 11 outputs: 手動 smoke

## サマリ

local / staging で `/login`（5 状態）と `/profile`（read-only）の手動 smoke を M-01〜M-16 として定義。2026-04-29 のレビュー改善で local `/login` 5 状態 screenshot と `/profile` 未ログイン redirect curl を取得済み。`/profile` ログイン後 screenshot と staging smoke は実 session / staging deploy が必要なため未取得として分離する。

## smoke 状態

| 種別 | 状態 |
| --- | --- |
| local smoke (M-01〜M-07) | captured（localhost:3001） |
| local smoke (M-08〜M-11) | pending（実 session / API fixture 必要） |
| staging smoke (M-12〜M-16) | pending（staging deploy 後に実行） |
| evidence (curl + screenshot) | partial captured（`evidence/` に格納） |
| violation 試行 5 件 | pending |
| 観測項目 5 軸 | pending |

## local smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-01 | `pnpm dev` 起動後 `curl -s http://localhost:3000/login` | 200 + LoginPanel（input）+ MagicLinkForm + GoogleOAuthButton | curl ログ |
| M-02 | `curl -s "http://localhost:3000/login?state=sent&email=foo@example.com"` | 200 + sent Banner + cooldown 表示 | curl ログ + screenshot |
| M-03 | `curl -s "http://localhost:3000/login?state=unregistered"` | 200 + `/register` CTA | curl ログ + screenshot |
| M-04 | `curl -s "http://localhost:3000/login?state=rules_declined"` | 200 + responderUrl CTA | curl ログ + screenshot |
| M-05 | `curl -s "http://localhost:3000/login?state=deleted"` | 200 + 管理者連絡 + login form 不在 | curl ログ + screenshot |
| M-06 | `curl -s "http://localhost:3000/login?state=foo"` | 200 + input 状態フォールバック | curl ログ |
| M-07 | `curl -s -o /dev/null -w "%{http_code}\n%{redirect_url}\n" http://localhost:3000/profile` | 302 → `/login?redirect=/profile` | curl ログ |
| M-08 | ブラウザでログイン後 `/profile` を開く | 200 + StatusSummary + ProfileFields + EditCta + AttendanceList | screenshot |
| M-09 | `/profile` の DOM を DevTools で `<form>` 検索 | 0 件（不変条件 #4） | screenshot |
| M-10 | `/profile?edit=true` を開く | 200 + read-only（edit query 無視） | screenshot |
| M-11 | ブラウザで `/login` の Magic Link を送信 | `state=sent` に遷移 + 60s cooldown + email が URL から消える | screenshot |

## staging smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-12 | `curl -s https://<staging>/login` | 200 + input 状態 | curl ログ |
| M-13 | `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/profile` | 302 → `/login?redirect=/profile` | curl ログ |
| M-14 | staging で Google OAuth ログイン → `/profile` 開く | 200 + 自分の data 表示 | screenshot |
| M-15 | staging の `/profile` で「Google Form で編集する」ボタン click | 別タブで responderUrl の編集 URL が開く | screenshot |
| M-16 | staging で `localStorage` に `gateState` 等を直接 set してから `/login` reload | URL query が正本、localStorage は無視される | screenshot + DevTools |

## 不変条件 violation 試行

| 試行 | 期待 |
| --- | --- |
| `/no-access` を URL 直叩き | 404（route 自体存在しない） |
| `/profile` の DOM に `<input>` `<textarea>` がある | 0 件 |
| `/profile` 内の任意 button click で本文編集 modal が開く | そのような button が存在しない |
| `localStorage.setItem("auth", "...")` 実行後 `/login` reload | URL query が正本、localStorage 復元なし |
| Network panel で apps/web から D1 へ直接通信 | 0 件（apps/api 経由のみ） |

## 観測項目

| 観測軸 | 確認方法 | 期待 |
| --- | --- | --- |
| Cache-Control（`/login`） | response header | private, no-store |
| Cache-Control（`/profile`） | response header | private, no-store |
| `Set-Cookie` | response header | Auth.js session cookie（Secure, HttpOnly, SameSite=Lax） |
| Console log | DevTools | `window.UBM` 参照なし、警告 0 件 |
| Network panel | DevTools | apps/api への fetch のみ、D1 直接 0 件 |

詳細は `manual-smoke-evidence.md` を参照。
