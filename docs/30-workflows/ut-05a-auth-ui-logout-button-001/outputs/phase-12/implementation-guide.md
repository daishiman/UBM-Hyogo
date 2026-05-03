# Implementation guide

## Part 1: 中学生レベル

ログアウトは、学校のロッカーを閉じて鍵を返す動作に近いです。

ログイン中のブラウザは、`session cookie` という鍵を持っています。`SignOutButton` を押すと、Auth.js という警備員に「鍵を返します」と伝えます。警備員が鍵を無効にすると、次に `/profile` や `/admin` へ入ろうとしても、鍵がないので `/login` に戻されます。

| 用語 | 意味 |
| --- | --- |
| `signOut` | 鍵を返す依頼 |
| `redirectTo` | 鍵を返した後に戻る場所 |
| `session cookie` | ログイン中であることを示す鍵 |
| `middleware` | 入り口で鍵を確認する係 |
| `redirect` | 別のページへ移動させること |

## Part 2: 技術者レベル

`apps/web/src/components/auth/SignOutButton.tsx` を client component として追加し、`next-auth/react` の `signOut({ redirectTo: "/login" })` を単一箇所に集約した。

配置は次の通り。

| Surface | Implementation |
| --- | --- |
| `/profile` | `apps/web/app/profile/page.tsx` が `MemberHeader` を直接描画 |
| `(member)` group | `apps/web/app/(member)/layout.tsx` が `MemberHeader` を描画 |
| `/admin` | `AdminSidebar` footer が `SignOutButton` を描画 |

Auth.js config、middleware、API、DB schema は変更しない。M-08 は Phase 11 runtime evidence が揃った後にのみ linked/completed へ進める。

### Phase 11 screenshot references

Runtime screenshot files are intentionally not present yet because an authenticated OAuth browser session was not available in this cycle. When smoke execution is approved and the session exists, save these files and reference them from the PR body:

| Evidence | Path |
| --- | --- |
| `/profile` before sign-out | `outputs/phase-11/screenshots/before-signout-profile.png` |
| `/admin` before sign-out | `outputs/phase-11/screenshots/before-signout-admin.png` |
| `/login` after sign-out | `outputs/phase-11/screenshots/after-signout.png` |

Until those files exist, screenshot evidence remains `runtime-evidence-blocked` and must not be described as PASS.
