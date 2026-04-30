# Phase 06 outputs: 異常系検証

## サマリ

`/login`（5 状態）と `/profile`（read-only）の異常系を 17 件（F-01〜F-17）に整理。`/no-access` への遷移が一切起きないこと（不変条件 #9）と profile に編集 UI が出る経路が 0 件であること（不変条件 #4 / #11）を Banner / Toast / error.tsx / not-found.tsx / ESLint で多重防御する。

## failure case 表

| ID | 入力 | 期待 status | 期待 UI | 不変条件 |
| --- | --- | --- | --- | --- |
| F-01 | `/login?state=foo`（不正 state） | 200 | `loginQuerySchema` で `input` フォールバック | #8 |
| F-02 | `/login?email=not-an-email&state=sent` | 200 | email 欠落として `state=sent` だけ表示 | #8 |
| F-03 | `/login` で Magic Link 連打（cooldown 内） | 429 / button disabled | UI で button disabled、Toast「60 秒後に再送可」 | - |
| F-04 | Magic Link 期限切れ token で `/api/auth/callback/email` | 302 → `/login?state=input&error=expired` | Banner「リンクの有効期限が切れました」+ 再送 CTA | #9 |
| F-05 | Google OAuth callback で provider error | 302 → `/login?state=input&error=oauth_failed` | Banner「Google ログインに失敗しました」+ 再試行 CTA | #9 |
| F-06 | `/profile` を未ログインで開く | 302 → `/login?redirect=/profile` | middleware redirect | #9 |
| F-07 | `/profile` で session 切れ（API 401） | RSC fetch 失敗 → error.tsx → `/login?redirect=/profile` | Toast「セッションが切れました」 | #5, #9 |
| F-08 | `/profile` で `/me` が 403 | 500 扱い | error.tsx で「再試行」 | #5 |
| F-09 | `/profile` で member が `isDeleted=true` | API が 404 → page も 404 | not-found.tsx「アカウントが削除されています」 | #5, #11 |
| F-10 | `/profile` で `editResponseUrl` が null | 200 | `EditCta` の button disabled + tooltip「Google Form 再回答 URL を取得中」 | #4 |
| F-11 | `/profile` で `MemberProfile.fields` が空 | 200 | EmptyState「プロフィール情報がまだありません」+ responderUrl CTA | #4 |
| F-12 | `/profile` で 5xx | 500 | error.tsx「一時的なエラー」+ retry button | #5, #10 |
| F-13 | `/profile?edit=true` 等で URL 経由の編集 mode 起動試行 | 200 | edit query は無視、read-only 維持 | #4 |
| F-14 | `/login?state=deleted` でログイン form を表示しようと URL 改ざん | 200 | deleted 状態 Banner のみ、form は描画しない | #9 |
| F-15 | `/login` で `localStorage` 経由の state 復元試行 | lint error | grep / ESLint で阻止 | #6, #8 |
| F-16 | consent 撤回後の `/profile`（`publicConsent=declined`） | 200 | 状態サマリで「公開許可: 撤回」表示、再回答 CTA を強調 | #2, #4 |
| F-17 | `/login` の Magic Link form で email 形式不正 | 422（client zod） | FormField error「正しいメールアドレスを入力してください」 | - |

## URL tampering / state 不整合

- F-01 / F-02 / F-14: `loginQuerySchema.safeParse` で fallback `state="input"`、`redirect="/profile"` に正規化
- `state="deleted"` でログイン form を再描画する分岐は switch case 内に存在しない

## Magic Link / OAuth callback 障害

- F-03: 60 秒 cooldown は client state（ephemeral、不変条件 #6 抵触なし）
- F-04: 05b 側で期限切れ判定 → `/login?state=input&error=expired` redirect
- F-05: 05a 側 OAuth callback 失敗 → `/login?state=input&error=oauth_failed` redirect

## profile read-only 強制

- F-13: edit query は URL contract に存在せず、読み込まない
- F-15: ESLint custom rule で `/profile` 配下の `<form>` + onSubmit を ban
- 唯一許容する form は visibility-request / delete-request の confirm dialog のみ（本タスクでは UI 配置せず、後続 wave の責務）

## consent 撤回後の表示

- F-16: `publicConsent=declined` のとき `StatusSummary` は「公開許可: 撤回」を表示し、`EditCta` で responderUrl を強調

## 不変条件チェック

- #2 / #4 / #5 / #6 / #7 / #8 / #9 / #10 すべて F-01〜F-17 の expectations に明記
