# test 行列（21 件）

| ID | layer | AC | 内容 | 期待 |
| --- | --- | --- | --- | --- |
| U-01 | unit | AC-1 | loginQuerySchema parse 5 state | green |
| U-02 | unit | AC-1 | loginQuerySchema 不正 state は input fallback | green |
| U-03 | unit | AC-2 | MagicLinkForm cooldown 60s カウント | green |
| C-01 | contract | AC-2, AC-9 | `POST /auth/magic-link` 200 + state="sent" | 05b の契約と一致 |
| C-02 | contract | AC-3 | `GET /api/auth/callback/google` redirect | 05a の契約 |
| C-03 | contract | AC-7 | `GET /me` 401 unauth | 04b の契約 |
| C-04 | contract | AC-8 | `GET /me/profile` の field は MemberProfile schema | 04b の契約 |
| E-01 | e2e | AC-1 | `/login?state=input` で MagicLinkForm + GoogleOAuth ボタン表示 | desktop / mobile |
| E-02 | e2e | AC-2 | Magic Link 送信 → `?state=sent` に遷移、cooldown 表示 | - |
| E-03 | e2e | AC-3 | Google OAuth ボタン click → callback redirect | - |
| E-04 | e2e | AC-4 | `/login?state=unregistered` で `/register` CTA | - |
| E-05 | e2e | AC-5 | `/login?state=rules_declined` で responderUrl CTA | - |
| E-06 | e2e | AC-6 | `/login?state=deleted` で 管理者連絡 CTA + ログイン不可 | - |
| E-07 | e2e | AC-7 | 未ログインで `/profile` → `/login?redirect=/profile` redirect | - |
| E-08 | e2e | AC-8 | `/profile` に編集 form / button 不在 | - |
| E-09 | e2e | AC-9 | `/profile` editResponseUrl ボタン click → Google Form 編集 URL を別タブで開く | - |
| E-10 | e2e | AC-10 | `/profile` に状態サマリ表示 | - |
| S-01 | static | AC-11 | `git grep "questionId"` で stableKey 直書き 0 | - |
| S-02 | static | AC-12 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` で 0 | - |
| S-03 | static | AC-4 | `grep -r "/no-access" apps/web` で 0 | - |
| S-04 | static | AC-8 | `grep -r "form" apps/web/app/profile` で profile field 編集 form なし | - |

## fixture

| 種類 | path | 用途 |
| --- | --- | --- |
| MeView | tests/fixtures/me/registered.json | 通常会員 |
| MemberProfile | tests/fixtures/me/profile.json | 11 stableKey |
| Magic Link 送信成功 | tests/fixtures/auth/magic-link-sent.json | C-01 |
| AuthGateState 5 種 | tests/fixtures/auth/gate-state/*.json | E-01〜E-06 |
