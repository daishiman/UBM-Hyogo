# 05a follow-up: Auth UI Logout Button

## メタ情報

```yaml
issue_number: 386
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-auth-ui-logout-button-001 |
| タスク名 | ログイン後 UI のログアウトボタン実装 |
| 分類 | implementation |
| 対象機能 | apps/web auth UI / session lifecycle |
| 優先度 | High |
| ステータス | 未実施 |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 staging smoke M-08 |
| 発見日 | 2026-05-01 |

## 背景

Google OAuth login と Auth.js session 発行は staging で確認できたが、ログイン後の画面にユーザーが操作できるログアウトボタンが無い。Auth.js の sign-out endpoint は存在しても、UI 導線が無いため Phase 11 M-08「sign-out で session cookie 削除」を実画面証跡付きで `PASS` にできない。

## 目的

ログイン済みユーザーが member/profile/admin いずれの主要画面からでも明示的にログアウトできるようにし、session cookie が削除され `/login` へ戻ることを smoke evidence で確認できる状態にする。

## スコープ

含む:

- ログイン後 app shell / header / profile / admin layout のいずれか一貫した場所にログアウトボタンを追加
- Auth.js `signOut()` または `/api/auth/signout` を使った session 終了
- ログアウト後の遷移先を `/login` に統一
- M-08 用 evidence: click 前、click 後、cookie 削除確認の screenshot または session JSON `{}` 証跡
- staging / production の Workers 環境で動くことの確認

含まない:

- OAuth provider 設定変更
- Magic Link 認証方式の追加
- admin 権限管理 UI
- session revoke 即時反映設計（別タスク `05a-followup-003-admin-revoke-immediate-effect`）

## 受け入れ条件

- ログイン済み画面でログアウト操作が視認できる
- ログアウト操作後、`/api/auth/session` が未認証状態を返す
- session cookie が削除または無効化される
- `/profile` / `/admin` など保護ページへ再アクセスすると `/login` へ redirect される
- Phase 11 M-08 を `PASS` に更新できる証跡が保存される

## 検証方法

1. staging で Google OAuth login する。
2. ログアウトボタンをクリックする。
3. `/api/auth/session` を開き、未認証状態であることを確認する。
4. DevTools Application > Cookies で session cookie が削除または無効化されたことを確認する。
5. `/profile` と `/admin` にアクセスし、`/login` へ戻ることを確認する。

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-STG-004`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-12/unassigned-task-detection.md` `UT-AUTH-LOGOUT-UI`
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-04/test-strategy.md` `M-08`

## 苦戦箇所【記入必須】

- 対象: `apps/web/middleware.ts`, `apps/web/app/(member)/**` / `apps/web/app/(admin)/**` の layout（ログアウトボタン未配置）
- 症状: `apps/web/middleware.ts` で Auth.js cookie 検査と `/login` redirect は実装済だが、ログイン後 UI に sign-out 操作導線が存在しないため M-08 を PASS にできない
- 参照:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-STG-004`
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-12/unassigned-task-detection.md` `UT-AUTH-LOGOUT-UI`
  - GitHub Issue #386

## リスクと対策

| リスク | 対策 |
| --- | --- |
| `signOut()` 呼び出し時の callback URL 設定漏れで `/login` 以外に遷移してしまう | `signOut({ callbackUrl: "/login" })` を共通化し、member / admin layout で同一実装を使う |
| ボタン配置箇所のばらつきにより admin / member 双方で UI が一貫しない | 共通 header / app shell コンポーネントに集約してから各 layout で読み込む |
| Workers 環境特有の cookie 削除挙動差異により session cookie が残存する | staging で `/api/auth/session` レスポンスと DevTools cookie 表示を併せて確認し evidence 化 |
| CSRF token 不整合で sign-out が 4xx を返す | Auth.js 公式 `signOut()` helper を使用し、独自に POST を組まない |

## 検証方法

- 実行コマンド:
  - `mise exec -- pnpm --filter web typecheck`
  - `mise exec -- pnpm --filter web lint`
  - staging URL で手動: `curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/api/auth/session`
- 期待結果:
  - typecheck / lint PASS
  - sign-out 操作後 `/api/auth/session` が `{}`（未認証）を返す
  - 保護ページ (`/profile`, `/admin`) 再アクセスで `/login` へ 302/redirect
- 失敗時の切り分け:
  1. cookie が残る場合 → Auth.js cookie 名 / domain / path を `apps/web/src/lib/auth.ts` で確認
  2. callback URL が効かない場合 → `signOut()` 引数と middleware の matcher を確認
  3. button 自体が押せない場合 → client component (`"use client"`) 指定と event handler 配線を確認
