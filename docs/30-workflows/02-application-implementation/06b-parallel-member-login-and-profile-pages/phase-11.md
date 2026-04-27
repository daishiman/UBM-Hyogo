# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

local / staging で `/login`（5 状態）と `/profile`（read-only）を手動確認し、curl 出力 + screenshot を evidence に残す。Playwright 自動化とは別軸で「`/profile` に編集 form / button が一切出現しない（不変条件 #4）」と「`/no-access` への遷移が一切発生しない（不変条件 #9）」を人の目で再確認する。

## 実行タスク

1. local smoke（5 状態 × 2 page）
2. staging smoke
3. evidence 収集（curl + screenshot）
4. 不変条件 #4 / #9 の violation 試行
5. 観測項目（Cache-Control / Set-Cookie / Console / Network）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/runbook.md | 手順 |
| 必須 | outputs/phase-09/main.md | 期待値 |
| 必須 | outputs/phase-10/main.md | GO 判定の前提 |
| 参考 | doc/00-getting-started-manual/specs/05-pages.md | UX 期待値 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | AuthGateState |

## 実行手順

### ステップ 1: local smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-01 | `pnpm dev` 起動後 `curl -s http://localhost:3000/login` を 200 確認 | 200 + LoginPanel（input 状態）+ MagicLinkForm + GoogleOAuthButton | curl ログ |
| M-02 | `curl -s "http://localhost:3000/login?state=sent&email=foo@example.com"` | 200 + sent Banner + cooldown 表示 | curl ログ + screenshot |
| M-03 | `curl -s "http://localhost:3000/login?state=unregistered"` | 200 + `/register` CTA | curl ログ + screenshot |
| M-04 | `curl -s "http://localhost:3000/login?state=rules_declined"` | 200 + responderUrl CTA | curl ログ + screenshot |
| M-05 | `curl -s "http://localhost:3000/login?state=deleted"` | 200 + 管理者連絡 + login form 不在 | curl ログ + screenshot |
| M-06 | `curl -s "http://localhost:3000/login?state=foo"` | 200 + input 状態フォールバック | curl ログ |
| M-07 | `curl -s -o /dev/null -w "%{http_code}\n%{redirect_url}\n" http://localhost:3000/profile` | 302 → `/login?redirect=/profile` | curl ログ |
| M-08 | ブラウザでログイン後 `/profile` を開く | 200 + StatusSummary + ProfileFields + EditCta + AttendanceList | screenshot |
| M-09 | `/profile` の DOM を DevTools で `<form>` 検索 | 0 件（不変条件 #4） | screenshot |
| M-10 | `/profile?edit=true` を開く | 200 + read-only（edit query 無視） | screenshot |
| M-11 | ブラウザで `/login` の Magic Link を送信 | `state=sent` に遷移 + 60s cooldown 表示 + email が URL から消える | screenshot |

### ステップ 2: staging smoke

| ID | 手順 | 期待 | evidence |
| --- | --- | --- | --- |
| M-12 | `curl -s https://<staging>/login` | 200 + input 状態 | curl ログ |
| M-13 | `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/profile` | 302 → `/login?redirect=/profile` | curl ログ |
| M-14 | staging で Google OAuth ログイン → `/profile` 開く | 200 + 自分の data 表示 | screenshot |
| M-15 | staging の `/profile` で「Google Form で編集する」ボタン click | 別タブで responderUrl の編集 URL が開く | screenshot |
| M-16 | staging で `localStorage` に `gateState` 等を直接 set してから `/login` reload | URL query が正本、localStorage は無視される | screenshot + DevTools |

### ステップ 3: evidence 収集

| 種別 | パス | 用途 |
| --- | --- | --- |
| curl log | outputs/phase-11/evidence/curl/M-01.log | smoke 根拠 |
| screenshot | outputs/phase-11/evidence/screenshot/M-02-sent.png | sent Banner |
| screenshot | outputs/phase-11/evidence/screenshot/M-05-deleted.png | deleted（form 不在） |
| screenshot | outputs/phase-11/evidence/screenshot/M-08-profile.png | profile 全体 |
| screenshot | outputs/phase-11/evidence/screenshot/M-09-no-form.png | DevTools form 検索 0 件 |
| screenshot | outputs/phase-11/evidence/screenshot/M-15-edit-cta.png | Google Form 編集導線 |

### ステップ 4: 不変条件 violation 試行（出ないこと確認）

| 試行 | 期待 |
| --- | --- |
| `/no-access` を URL 直叩き | 404（route 自体存在しない） |
| `/profile` の DOM に `<input>` `<textarea>` がある | 0 件（profile 表示のみ） |
| `/profile` 内の任意 button click で本文編集 modal が開く | そのような button が存在しない |
| `localStorage.setItem("auth", "...")` 実行後 `/login` reload | URL query が正本、localStorage 復元なし |
| Network panel で apps/web から D1 へ直接通信 | 0 件（apps/api 経由のみ） |

### ステップ 5: 観測項目

| 観測軸 | 確認方法 | 期待 |
| --- | --- | --- |
| Cache-Control（`/login`） | response header | private, no-store（gate state がユーザー依存のため） |
| Cache-Control（`/profile`） | response header | private, no-store |
| `Set-Cookie` | response header | Auth.js session cookie（Secure, HttpOnly, SameSite=Lax） |
| Console log | DevTools | `window.UBM` 参照なし、警告 0 件 |
| Network panel | DevTools | apps/api への fetch のみ、D1 直接 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog に記録 |
| Phase 13 | PR description に evidence link を貼付 |
| 09a | staging deploy 成果と突合 |

## 多角的チェック観点

- 不変条件 #1: M-08 で stableKey が UI ラベルとして直接出ていないか目視
- 不変条件 #2: M-08 の StatusSummary で `publicConsent` / `rulesConsent` 表記が一致
- 不変条件 #4: M-09 の DOM 検索で `<form>` 0 件、M-10 で edit query 無視
- 不変条件 #5: M-08 の Network panel で apps/api 経由のみ
- 不変条件 #6: ステップ 4 の `localStorage.setItem` 試行が無効、Console で `window.UBM` 0 件
- 不変条件 #7: M-08 の API レスポンスで session.memberId と responseId が型分離されている
- 不変条件 #8: M-11 で email が URL から消える、M-16 で URL query 正本
- 不変条件 #9: ステップ 4 の `/no-access` が 404、`/login?state=*` で 5 状態を吸収
- 不変条件 #10: M-12, M-13 staging response が 1xx〜3xx の範囲、無料枠内
- 不変条件 #11: M-09 で他人本文編集 UI も不在

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | local smoke | 11 | pending | M-01〜M-11 |
| 2 | staging smoke | 11 | pending | M-12〜M-16 |
| 3 | evidence 収集 | 11 | pending | curl + screenshot |
| 4 | violation 試行 | 11 | pending | 5 試行 |
| 5 | 観測項目 | 11 | pending | 5 軸 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果サマリ |
| ドキュメント | outputs/phase-11/manual-smoke-evidence.md | screenshot / curl evidence 一覧 |
| evidence | outputs/phase-11/evidence/ | curl + screenshot |
| メタ | artifacts.json | phase 11 status |

## 完了条件

- [ ] M-01〜M-16 が pass
- [ ] evidence が phase-11/evidence に揃う
- [ ] violation 試行 5 件すべて阻止確認
- [ ] 観測項目 5 軸が green

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-11/main.md 配置
- 不変条件 #1, #2, #4, #5, #6, #7, #8, #9, #10, #11 への対応が evidence で証明
- 次 Phase へ smoke 結果と evidence path を引継ぎ

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke 結果と evidence path
- ブロック条件: M-01〜M-16 のいずれか fail / violation 試行で UI が破られたら進まない
